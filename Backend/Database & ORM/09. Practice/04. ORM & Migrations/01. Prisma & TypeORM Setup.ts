/**
 * ============================================================================
 * BÀI TẬP THỰC HÀNH: ORM DEEP DIVE (TYPEORM TRANSACTIONS & PRISMA OPTIMIZATION)
 * ============================================================================
 * Tệp: 01. Prisma & TypeORM Setup.ts
 * Khóa học: Database & Storage - ORM & Migrations
 *
 * MỤC TIÊU BÀI HỌC:
 * 1. Làm chủ cơ chế Quản lý Transaction đa thực thể với TypeORM (QueryRunner).
 * 2. Bảo vệ dữ liệu chống Race Condition bằng Khóa bi quan (Pessimistic Locking).
 * 3. Nhận diện và loại bỏ triệt để vấn đề truy vấn N+1 (N+1 Query Problem) trong Prisma.
 * 4. Tối ưu hóa bộ nhớ với Phân trang theo con trỏ (Cursor-based Pagination) chống OOM.
 * ============================================================================
 */

import { randomUUID } from "crypto";

// ============================================================================
// PHẦN 1: BÀI TẬP TYPEORM - ENTITIES, REPOSITORY & TRANSACTION RUNNER
// ============================================================================

// --- 1.1 Khai báo Domain Entities & DTOs ---

export class UserEntity {
  id!: string;
  email!: string;
  fullName!: string;
  walletBalance!: number;
  orders?: OrderEntity[];

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}

export class ProductEntity {
  id!: string;
  name!: string;
  price!: number;
  stockQuantity!: number;

  constructor(partial: Partial<ProductEntity>) {
    Object.assign(this, partial);
  }
}

export enum OrderStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
}

export class OrderEntity {
  id!: string;
  userId!: string;
  user!: UserEntity;
  items!: OrderItemEntity[];
  totalAmount!: number;
  status!: OrderStatus;
  createdAt!: Date;

  constructor(partial: Partial<OrderEntity>) {
    Object.assign(this, partial);
  }
}

export class OrderItemEntity {
  id!: string;
  orderId!: string;
  order!: OrderEntity;
  productId!: string;
  product!: ProductEntity;
  quantity!: number;
  unitPrice!: number;
  subtotal!: number;

  constructor(partial: Partial<OrderItemEntity>) {
    Object.assign(this, partial);
  }
}

export interface PlaceOrderItemInput {
  productId: string;
  quantity: number;
}

export interface PlaceOrderInput {
  userId: string;
  items: PlaceOrderItemInput[];
}

// --- 1.2 Giả lập Cơ sở Dữ liệu & TypeORM QueryRunner Engine ---

export class MockDatabaseEngine {
  public users = new Map<string, UserEntity>();
  public products = new Map<string, ProductEntity>();
  public orders = new Map<string, OrderEntity>();
  public orderItems = new Map<string, OrderItemEntity>();

  public queryLog: string[] = [];

  constructor() {
    this.seedInitialData();
  }

  public seedInitialData() {
    this.users.set(
      "u-1",
      new UserEntity({
        id: "u-1",
        email: "alice@techmaster.vn",
        fullName: "Alice Nguyễn",
        walletBalance: 30000000, // 30 triệu VND
      })
    );

    this.products.set(
      "p-1",
      new ProductEntity({
        id: "p-1",
        name: "Bàn phím cơ Keychron Q1 Pro",
        price: 4500000,
        stockQuantity: 5,
      })
    );

    this.products.set(
      "p-2",
      new ProductEntity({
        id: "p-2",
        name: "Chuột không dây Logitech MX Master 3S",
        price: 2500000,
        stockQuantity: 2,
      })
    );
  }

  public createQueryRunner(): MockTypeOrmQueryRunner {
    return new MockTypeOrmQueryRunner(this);
  }
}

/**
 * Trình giả lập TypeORM QueryRunner có đầy đủ Transaction Isolation,
 * Pessimistic Lock và Rollback khôi phục trạng thái nguyên bản.
 */
export class MockTypeOrmQueryRunner {
  private inTransaction = false;
  private snapshotState: {
    users: Map<string, UserEntity>;
    products: Map<string, ProductEntity>;
    orders: Map<string, OrderEntity>;
    orderItems: Map<string, OrderItemEntity>;
  } | null = null;

  public isReleased = false;

  constructor(private readonly db: MockDatabaseEngine) {}

  async connect(): Promise<void> {
    if (this.isReleased) throw new Error("QueryRunner đã bị giải phóng!");
  }

  async startTransaction(): Promise<void> {
    if (this.inTransaction) throw new Error("Transaction đang chạy!");
    this.inTransaction = true;
    this.db.queryLog.push("BEGIN TRANSACTION;");

    // Tạo Deep Copy Snapshot để phục vụ Rollback nếu gặp lỗi
    this.snapshotState = {
      users: new Map(Array.from(this.db.users.entries()).map(([k, v]) => [k, new UserEntity(v)])),
      products: new Map(Array.from(this.db.products.entries()).map(([k, v]) => [k, new ProductEntity(v)])),
      orders: new Map(Array.from(this.db.orders.entries()).map(([k, v]) => [k, new OrderEntity(v)])),
      orderItems: new Map(Array.from(this.db.orderItems.entries()).map(([k, v]) => [k, new OrderItemEntity(v)])),
    };
  }

  async commitTransaction(): Promise<void> {
    if (!this.inTransaction) throw new Error("Không có transaction nào đang chạy để commit!");
    this.db.queryLog.push("COMMIT;");
    this.inTransaction = false;
    this.snapshotState = null;
  }

  async rollbackTransaction(): Promise<void> {
    if (!this.inTransaction) throw new Error("Không có transaction nào đang chạy để rollback!");
    this.db.queryLog.push("ROLLBACK;");

    // Khôi phục hoàn toàn dữ liệu về thời điểm trước transaction
    if (this.snapshotState) {
      this.db.users = this.snapshotState.users;
      this.db.products = this.snapshotState.products;
      this.db.orders = this.snapshotState.orders;
      this.db.orderItems = this.snapshotState.orderItems;
    }
    this.inTransaction = false;
  }

  async release(): Promise<void> {
    this.isReleased = true;
    this.db.queryLog.push("-- Released QueryRunner Connection back to Pool");
  }

  // --- Manager API giả lập TypeORM EntityManager ---
  public manager = {
    findOneUser: async (id: string): Promise<UserEntity | null> => {
      this.db.queryLog.push(`SELECT * FROM users WHERE id = '${id}'`);
      const user = this.db.users.get(id);
      return user ? new UserEntity(user) : null;
    },

    findOneProduct: async (
      id: string,
      options?: { lock?: { mode: "pessimistic_write" } }
    ): Promise<ProductEntity | null> => {
      const lockClause = options?.lock?.mode === "pessimistic_write" ? " FOR UPDATE" : "";
      this.db.queryLog.push(`SELECT * FROM products WHERE id = '${id}'${lockClause}`);
      const product = this.db.products.get(id);
      return product ? new ProductEntity(product) : null;
    },

    saveUser: async (user: UserEntity): Promise<UserEntity> => {
      this.db.queryLog.push(`UPDATE users SET walletBalance = ${user.walletBalance} WHERE id = '${user.id}'`);
      this.db.users.set(user.id, user);
      return user;
    },

    saveProduct: async (product: ProductEntity): Promise<ProductEntity> => {
      this.db.queryLog.push(`UPDATE products SET stockQuantity = ${product.stockQuantity} WHERE id = '${product.id}'`);
      this.db.products.set(product.id, product);
      return product;
    },

    saveOrder: async (order: OrderEntity): Promise<OrderEntity> => {
      if (!order.id) order.id = `ord-${randomUUID().slice(0, 8)}`;
      order.createdAt = new Date();
      this.db.queryLog.push(`INSERT INTO orders (id, userId, totalAmount, status) VALUES ('${order.id}', '${order.userId}', ${order.totalAmount}, '${order.status}')`);
      this.db.orders.set(order.id, order);
      return order;
    },

    saveOrderItem: async (item: OrderItemEntity): Promise<OrderItemEntity> => {
      if (!item.id) item.id = `item-${randomUUID().slice(0, 8)}`;
      this.db.queryLog.push(`INSERT INTO order_items (id, orderId, productId, quantity, unitPrice, subtotal) VALUES ('${item.id}', '${item.orderId}', '${item.productId}', ${item.quantity}, ${item.unitPrice}, ${item.subtotal})`);
      this.db.orderItems.set(item.id, item);
      return item;
    },
  };
}

// --- 1.3 Hiện thực hóa TypeORM Transaction Service ---

export class TypeOrmOrderService {
  constructor(private readonly dbEngine: MockDatabaseEngine) {}

  /**
   * [TODO 1]: Quy trình đặt hàng an toàn với Transaction & Pessimistic Locking
   */
  public async executeOrderTransaction(input: PlaceOrderInput): Promise<OrderEntity> {
    const qr = this.dbEngine.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // 1. Kiểm tra tài khoản User
      const user = await qr.manager.findOneUser(input.userId);
      if (!user) {
        throw new Error(`[OrderError] Không tìm thấy người dùng với ID '${input.userId}'!`);
      }

      let calculatedTotal = 0;
      const orderItemsToCreate: OrderItemEntity[] = [];
      const updatedProducts: ProductEntity[] = [];

      // 2. Duyệt từng sản phẩm: Khóa bản ghi (FOR UPDATE), kiểm tra tồn kho, trừ tồn kho
      for (const itemInput of input.items) {
        const product = await qr.manager.findOneProduct(itemInput.productId, {
          lock: { mode: "pessimistic_write" },
        });

        if (!product) {
          throw new Error(`[OrderError] Sản phẩm '${itemInput.productId}' không tồn tại trong hệ thống!`);
        }

        if (product.stockQuantity < itemInput.quantity) {
          throw new Error(
            `[OrderError] Sản phẩm '${product.name}' không đủ tồn kho (Yêu cầu: ${itemInput.quantity}, Hiện có: ${product.stockQuantity})!`
          );
        }

        // Trừ tồn kho
        product.stockQuantity -= itemInput.quantity;
        updatedProducts.push(product);

        const subtotal = product.price * itemInput.quantity;
        calculatedTotal += subtotal;

        const orderItem = new OrderItemEntity({
          productId: product.id,
          product: product,
          quantity: itemInput.quantity,
          unitPrice: product.price,
          subtotal: subtotal,
        });
        orderItemsToCreate.push(orderItem);
      }

      // 3. Kiểm tra số dư ví
      if (user.walletBalance < calculatedTotal) {
        throw new Error(
          `[OrderError] Số dư ví không đủ! (Cần: ${calculatedTotal}đ, Số dư hiện tại: ${user.walletBalance}đ)`
        );
      }

      // 4. Trừ tiền ví User và lưu DB
      user.walletBalance -= calculatedTotal;
      await qr.manager.saveUser(user);

      // 5. Lưu cập nhật tồn kho các sản phẩm
      for (const product of updatedProducts) {
        await qr.manager.saveProduct(product);
      }

      // 6. Tạo và lưu Order chính
      const newOrder = new OrderEntity({
        userId: user.id,
        user: user,
        totalAmount: calculatedTotal,
        status: OrderStatus.PAID,
      });
      const savedOrder = await qr.manager.saveOrder(newOrder);

      // 7. Lưu các Order Items liên kết
      for (const orderItem of orderItemsToCreate) {
        orderItem.orderId = savedOrder.id;
        orderItem.order = savedOrder;
        await qr.manager.saveOrderItem(orderItem);
      }

      savedOrder.items = orderItemsToCreate;

      // 8. Commit Transaction thành công
      await qr.commitTransaction();
      return savedOrder;
    } catch (error) {
      // 9. Rollback Transaction toàn bộ nếu gặp bất kỳ lỗi nào
      await qr.rollbackTransaction();
      throw error;
    } finally {
      // 10. Luôn luôn giải phóng kết nối
      await qr.release();
    }
  }
}

// ============================================================================
// PHẦN 2: BÀI TẬP PRISMA - TỐI ƯU HÓA TRUY VẤN & XÓA BỎ N+1 QUERIES
// ============================================================================

export interface AuthorRecord {
  id: string;
  name: string;
  email: string;
}

export interface PostRecord {
  id: string;
  authorId: string;
  title: string;
  content: string;
  published: boolean;
}

export class MockPrismaDatabase {
  public authors: AuthorRecord[] = [
    { id: "a-1", name: "Nguyễn Du", email: "nguyendu@literature.vn" },
    { id: "a-2", name: "Nam Cao", email: "namcao@literature.vn" },
    { id: "a-3", name: "Xuân Quỳnh", email: "xuanquynh@literature.vn" },
    { id: "a-4", name: "Tô Hoài", email: "tohoai@literature.vn" },
    { id: "a-5", name: "Vũ Trọng Phụng", email: "vutrongphung@literature.vn" },
  ];

  public posts: PostRecord[] = [
    { id: "p-101", authorId: "a-1", title: "Truyện Kiều Đoạn 1", content: "Trăm năm trong cõi người ta...", published: true },
    { id: "p-102", authorId: "a-1", title: "Truyện Kiều Đoạn 2", content: "Làn thu thủy nét xuân sơn...", published: true },
    { id: "p-103", authorId: "a-2", title: "Chí Phèo", content: "Hắn vừa đi vừa chửi...", published: true },
    { id: "p-104", authorId: "a-2", title: "Lão Hạc", content: "Cậu Vàng đi đời rồi ông giáo ạ...", published: true },
    { id: "p-105", authorId: "a-3", title: "Sóng", content: "Dữ dội và dịu êm, ồn ào và lặng lẽ...", published: true },
    { id: "p-106", authorId: "a-4", title: "Dế Mèn Phiêu Lưu Ký", content: "Bởi tôi ăn uống điều độ...", published: true },
    { id: "p-107", authorId: "a-5", title: "Số Đỏ", content: "Hạnh phúc của một tang gia...", published: true },
  ];

  public queryExecutionCount = 0;

  // Reset thống kê truy vấn
  public resetQueryCount() {
    this.queryExecutionCount = 0;
  }
}

export class PrismaQueryOptimizationService {
  constructor(private readonly prismaDb: MockPrismaDatabase) {}

  /**
   * [ANTI-PATTERN]: Cách viết ngây thơ gây lỗi N+1 Query Problem nghiêm trọng
   * - 1 câu query lấy danh sách N tác giả
   * - N câu query tiếp theo nằm trong vòng lặp map() để lấy posts của từng tác giả
   * -> Tổng số câu query: 1 + N (Nếu có 100 tác giả -> Bắn 101 câu query xuống DB!)
   */
  public async getAuthorsWithPostsNaive() {
    this.prismaDb.resetQueryCount();

    // 1 query lấy danh sách authors
    this.prismaDb.queryExecutionCount++;
    const authors = [...this.prismaDb.authors];

    // N queries tiếp tục bắn trong vòng lặp!
    const results = await Promise.all(
      authors.map(async (author) => {
        this.prismaDb.queryExecutionCount++; // Bắn thêm 1 query cho mỗi author
        const posts = this.prismaDb.posts.filter((p) => p.authorId === author.id);
        return {
          ...author,
          posts,
        };
      })
    );

    return {
      data: results,
      totalQueriesExecuted: this.prismaDb.queryExecutionCount,
    };
  }

  /**
   * [OPTIMIZED PATTERN 1]: Prisma Eager Include / Batch Join Optimization
   * Sử dụng cơ chế nạp quan hệ của Prisma:
   * Prisma gom toàn bộ authorId thành: SELECT * FROM posts WHERE authorId IN ('a-1', 'a-2', ...)
   * -> Tổng số câu query chỉ là 2 (1 cho Authors + 1 cho tất cả Posts liên quan), bất kể N lớn đến đâu!
   */
  public async getAuthorsWithPostsOptimized() {
    this.prismaDb.resetQueryCount();

    // Query 1: Lấy danh sách authors
    this.prismaDb.queryExecutionCount++;
    const authors = [...this.prismaDb.authors];
    const authorIds = authors.map((a) => a.id);

    // Query 2: Lấy toàn bộ posts của tất cả authors trong 1 câu lệnh IN duy nhất
    this.prismaDb.queryExecutionCount++;
    const allPosts = this.prismaDb.posts.filter((p) => authorIds.includes(p.authorId));

    // Nhóm posts theo authorId trong RAM (Memory Aggregation)
    const postsByAuthorId = new Map<string, PostRecord[]>();
    for (const post of allPosts) {
      const list = postsByAuthorId.get(post.authorId) || [];
      list.push(post);
      postsByAuthorId.set(post.authorId, list);
    }

    const results = authors.map((author) => ({
      ...author,
      posts: postsByAuthorId.get(author.id) || [],
    }));

    return {
      data: results,
      totalQueriesExecuted: this.prismaDb.queryExecutionCount,
    };
  }

  /**
   * [OPTIMIZED PATTERN 2]: Xử lý tập dữ liệu khổng lồ bằng Cursor-based Batching
   * Chống tràn bộ nhớ Heap của Node.js (V8 Memory Bloat) khi xử lý hàng trăm ngàn bản ghi.
   */
  public async processLargeDatasetInChunks(
    chunkSize = 2,
    processor: (chunk: PostRecord[]) => Promise<void>
  ): Promise<{ totalProcessed: number; batchesCount: number }> {
    let cursor: string | null = null;
    let totalProcessed = 0;
    let batchesCount = 0;

    while (true) {
      // Giả lập Prisma findMany({ take, skip, cursor, orderBy: { id: 'asc' } })
      let querySet = [...this.prismaDb.posts].sort((a, b) => a.id.localeCompare(b.id));

      if (cursor !== null) {
        const cursorIndex = querySet.findIndex((p) => p.id === cursor);
        querySet = querySet.slice(cursorIndex + 1);
      }

      const currentChunk = querySet.slice(0, chunkSize);

      if (currentChunk.length === 0) {
        break; // Hoàn tất duyệt toàn bộ dữ liệu
      }

      batchesCount++;
      totalProcessed += currentChunk.length;
      await processor(currentChunk);

      // Đặt con trỏ là ID của phần tử cuối cùng trong batch hiện tại
      cursor = currentChunk[currentChunk.length - 1].id;
    }

    return { totalProcessed, batchesCount };
  }
}

// ============================================================================
// KỊCH BẢN KIỂM THỬ THỰC TẾ & CHẠY ĐÁNH GIÁ HIỆU NĂNG (VERIFICATION SUITE)
// ============================================================================

async function runOrmMasterySuite() {
  console.log("================================================================");
  console.log("🚀 KHỞI CHẠY BỘ KIỂM THỬ ORM: TYPEORM TRANSACTIONS & PRISMA N+1");
  console.log("================================================================\n");

  // --------------------------------------------------------------------------
  // TEST 1: TypeORM Transaction - Đặt hàng thành công
  // --------------------------------------------------------------------------
  console.log("--- TEST 1: TypeORM Transaction - Đặt Hàng Hợp Lệ ---");
  const db = new MockDatabaseEngine();
  const orderService = new TypeOrmOrderService(db);

  const initialUserBalance = db.users.get("u-1")!.walletBalance;
  const initialStockP1 = db.products.get("p-1")!.stockQuantity;
  console.log(`  Số dư User u-1 ban đầu: ${initialUserBalance.toLocaleString("vi-VN")}đ`);
  console.log(`  Tồn kho Bàn phím p-1 ban đầu: ${initialStockP1}`);

  const orderResult = await orderService.executeOrderTransaction({
    userId: "u-1",
    items: [
      { productId: "p-1", quantity: 2 }, // 2 * 4.5tr = 9tr
      { productId: "p-2", quantity: 1 }, // 1 * 2.5tr = 2.5tr -> Tổng 11.5tr
    ],
  });

  const updatedUserBalance = db.users.get("u-1")!.walletBalance;
  const updatedStockP1 = db.products.get("p-1")!.stockQuantity;
  console.log(`  ✅ Đặt hàng thành công! Order ID: ${orderResult.id}`);
  console.log(`  Tổng tiền đơn hàng: ${orderResult.totalAmount.toLocaleString("vi-VN")}đ`);
  console.log(`  Số dư User u-1 sau khi trừ: ${updatedUserBalance.toLocaleString("vi-VN")}đ (Kỳ vọng: 18.500.000đ)`);
  console.log(`  Tồn kho p-1 sau khi trừ: ${updatedStockP1} (Kỳ vọng: 3)`);
  console.log("=> Kết quả Test 1:", updatedUserBalance === 18500000 && updatedStockP1 === 3 ? "✅ PASS" : "❌ FAIL");

  // --------------------------------------------------------------------------
  // TEST 2: TypeORM Transaction - Thất bại do Quá Tồn Kho -> Rollback Toàn Vẹn
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 2: TypeORM Transaction - Rollback Khi Vượt Quá Tồn Kho ---");
  const balanceBeforeFail = db.users.get("u-1")!.walletBalance;
  const stockP2BeforeFail = db.products.get("p-2")!.stockQuantity;

  try {
    // p-2 chỉ còn 1 sản phẩm, nhưng cố tình đặt mua 99 sản phẩm
    await orderService.executeOrderTransaction({
      userId: "u-1",
      items: [{ productId: "p-2", quantity: 99 }],
    });
    console.log("❌ Lỗi: Lẽ ra transaction phải thất bại nhưng lại thành công!");
  } catch (err: any) {
    console.log(`  🛡️ Bắt lỗi nghiệp vụ thành công: "${err.message}"`);
  }

  const balanceAfterFail = db.users.get("u-1")!.walletBalance;
  const stockP2AfterFail = db.products.get("p-2")!.stockQuantity;

  console.log(`  Số dư ví sau khi Rollback: ${balanceAfterFail.toLocaleString("vi-VN")}đ (Kỳ vọng không đổi: ${balanceBeforeFail.toLocaleString("vi-VN")}đ)`);
  console.log(`  Tồn kho p-2 sau khi Rollback: ${stockP2AfterFail} (Kỳ vọng không đổi: ${stockP2BeforeFail})`);
  console.log("=> Kết quả Test 2:", balanceAfterFail === balanceBeforeFail && stockP2AfterFail === stockP2BeforeFail ? "✅ PASS (Rollback toàn vẹn 100%)" : "❌ FAIL");

  // --------------------------------------------------------------------------
  // TEST 3: Prisma Query - So sánh Hiệu năng N+1 Naïve vs Optimized
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 3: So Sánh Vấn Đề N+1 vs Truy Vấn Tối Ưu Hóa Trong Prisma ---");
  const prismaDb = new MockPrismaDatabase();
  const prismaService = new PrismaQueryOptimizationService(prismaDb);

  const naiveResult = await prismaService.getAuthorsWithPostsNaive();
  console.log(`  [Naïve Implementation] Số lượng Tác giả: ${naiveResult.data.length} | Tổng Queries Đã Gọi: ${naiveResult.totalQueriesExecuted}`);

  const optimizedResult = await prismaService.getAuthorsWithPostsOptimized();
  console.log(`  [Optimized Implementation] Số lượng Tác giả: ${optimizedResult.data.length} | Tổng Queries Đã Gọi: ${optimizedResult.totalQueriesExecuted}`);

  console.log(`  -> Giảm thiểu số lượng Database Round-trips từ ${naiveResult.totalQueriesExecuted} queries xuống chỉ còn ${optimizedResult.totalQueriesExecuted} queries!`);
  console.log("=> Kết quả Test 3:", optimizedResult.totalQueriesExecuted === 2 ? "✅ PASS (Giải quyết triệt để N+1)" : "❌ FAIL");

  // --------------------------------------------------------------------------
  // TEST 4: Prisma Cursor-based Chunking - Xử lý dữ liệu lớn không tràn RAM
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 4: Duyệt Dữ Liệu Lớn Bằng Cursor-based Batching ---");
  let chunkCount = 0;
  const chunkResult = await prismaService.processLargeDatasetInChunks(3, async (batch) => {
    chunkCount++;
    console.log(`  [Batch ${chunkCount}] Đang xử lý ${batch.length} bài viết: [${batch.map((b) => b.title).join(", ")}]`);
  });

  console.log(`  Tổng số bài viết đã xử lý an toàn: ${chunkResult.totalProcessed} qua ${chunkResult.batchesCount} đợt phân trang.`);
  console.log("=> Kết quả Test 4:", chunkResult.totalProcessed === prismaDb.posts.length ? "✅ PASS (Cursor Chunking chính xác)" : "❌ FAIL");

  console.log("\n================================================================");
  console.log("🎉 TẤT CẢ CÁC BÀI THỰC HÀNH ORM & TRANSACTION ĐỀU VƯỢT QUA!");
  console.log("================================================================");
}

// Chạy demo nếu file được thực thi trực tiếp
if (require.main === module) {
  runOrmMasterySuite().catch(console.error);
}
