/**
 * ============================================================================
 * BÀI TẬP THỰC HÀNH: MODULAR MONOLITH ARCHITECTURE & FACADE PATTERN
 * ============================================================================
 * Tệp: 01. Modular Monolith Structure.ts
 * Khóa học: DevOps & Architecture - Architecture Patterns
 *
 * MỤC TIÊU BÀI HỌC:
 * 1. Nắm vững cách tổ chức thư mục cho một hệ thống Modular Monolith chuẩn Domain-Driven Design (DDD).
 * 2. Thiết lập ranh giới module nghiêm ngặt (Strict Module Boundaries) - Chống tình trạng "Big Ball of Mud".
 * 3. Áp dụng Facade Pattern để xuất bản (expose) các Public Interface an toàn giữa các module.
 * 4. Ngăn chặn việc truy cập trực tiếp vào Entity nội bộ (Internal Entities) hoặc Repository của module khác.
 *
 * CÁC BÀI TẬP CẦN HOÀN THÀNH:
 * - Bài tập 1: Nghiên cứu sơ đồ thiết kế cấu trúc thư mục Modular Monolith (bên dưới).
 * - Bài tập 2: Hoàn thiện các phương thức Facade và OrderService theo các điểm đánh dấu [TODO].
 * ============================================================================
 */

// ============================================================================
// BÀI TẬP 1: BẢN THIẾT KẾ CẤU TRÚC THƯ MỤC (FOLDER STRUCTURE DESIGN)
// ============================================================================
/*
src/
├── app.module.ts                   # Root Module của toàn bộ Monolith
├── main.ts                         # Entrypoint khởi động HTTP Server
├── common/                         # Mã nguồn dùng chung toàn hệ thống (Stateless Utilities)
│   ├── decorators/
│   ├── guards/
│   ├── interceptors/
│   └── utils/
│
└── modules/                        # Danh sách các Module nghiệp vụ độc lập (Bounded Contexts)
    ├── users/                      # [MODULE 1: QUẢN LÝ NGƯỜI DÙNG]
    │   ├── users.module.ts         # Khai báo DI Container cho User Module
    │   ├── public/                 # PUBLIC CONTRACT: Chỉ cho phép các module khác import từ đây
    │   │   ├── index.ts            # Public Barrel Export
    │   │   ├── user.facade.ts      # Facade cung cấp dữ liệu User cho Order/Payment
    │   │   └── dtos/               # DTOs công khai (chỉ chứa dữ liệu cần thiết)
    │   │       └── user-public.dto.ts
    │   └── internal/               # NỘI BỘ MODULE: Tuyệt đối CẤM module khác import
    │       ├── controllers/
    │       ├── services/
    │       ├── repositories/
    │       └── entities/
    │           └── user.entity.ts  # Chứa password_hash, salt, private info -> BẢO MẬT
    │
    ├── products/                   # [MODULE 2: QUẢN LÝ HÀNG HÓA & TỒN KHO]
    │   ├── products.module.ts
    │   ├── public/
    │   │   ├── index.ts
    │   │   ├── product.facade.ts   # Facade kiểm tra và trừ tồn kho (Reserve Stock)
    │   │   └── dtos/
    │   │       └── product-public.dto.ts
    │   └── internal/
    │       ├── services/
    │       └── entities/
    │           └── product.entity.ts
    │
    └── orders/                     # [MODULE 3: QUẢN LÝ ĐƠN HÀNG]
        ├── orders.module.ts        # Import UserModule và ProductModule (thông qua Facade)
        ├── internal/
        │   ├── controllers/
        │   ├── services/
        │   │   └── order.service.ts # Sử dụng UserFacade & ProductFacade
        │   └── entities/
        │       └── order.entity.ts
        └── public/
            └── order.facade.ts
*/

// ============================================================================
// BÀI TẬP 2: HIỆN THỰC HÓA FACADE PATTERN TRONG TYPESCRIPT
// ============================================================================

// ----------------------------------------------------------------------------
// 1. MODULE USERS (PUBLIC CONTRACTS & INTERNAL IMPLEMENTATION)
// ----------------------------------------------------------------------------

/**
 * Public DTO: Dữ liệu công khai của User mà module khác được phép biết.
 * Tuyệt đối không phơi bày passwordHash, twoFactorSecret hay token nhạy cảm.
 */
export interface UserPublicDto {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly isActive: boolean;
  readonly creditLimit: number;
}

/**
 * Public Interface: Hợp đồng giao tiếp công khai của User Module.
 */
export interface IUserFacade {
  getUserById(userId: string): Promise<UserPublicDto | null>;
  isUserEligibleForOrder(userId: string): Promise<{ eligible: boolean; reason?: string }>;
}

// --- Nội bộ User Module (Internal) ---

class UserEntity {
  constructor(
    public readonly id: string,
    public fullName: string,
    public email: string,
    public passwordHash: string, // THÔNG TIN NỘI BỘ NHẠY CẢM
    public isActive: boolean,
    public creditLimit: number,
    public internalRiskScore: number // THÔNG TIN NỘI BỘ
  ) {}
}

class UserRepository {
  private users: Map<string, UserEntity> = new Map([
    ["u-101", new UserEntity("u-101", "Nguyễn Văn A", "vana@example.com", "hash_secret_123", true, 50000000, 10)],
    ["u-102", new UserEntity("u-102", "Trần Thị B (Banned)", "thib@example.com", "hash_secret_456", false, 0, 95)],
  ]);

  async findById(id: string): Promise<UserEntity | null> {
    return this.users.get(id) || null;
  }
}

class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  async getUser(id: string): Promise<UserEntity | null> {
    return this.userRepo.findById(id);
  }
}

/**
 * [TODO 1]: Hiện thực hóa UserFacade
 * Nhiệm vụ: Đóng gói UserService và chuyển đổi UserEntity nội bộ thành UserPublicDto an toàn.
 */
export class UserFacade implements IUserFacade {
  constructor(private readonly userService: UserService) {}

  async getUserById(userId: string): Promise<UserPublicDto | null> {
    const user = await this.userService.getUser(userId);
    if (!user) return null;

    // TODO: Chuyển đổi UserEntity -> UserPublicDto (Lọc bỏ passwordHash & internalRiskScore)
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      isActive: user.isActive,
      creditLimit: user.creditLimit,
    };
  }

  async isUserEligibleForOrder(userId: string): Promise<{ eligible: boolean; reason?: string }> {
    const user = await this.userService.getUser(userId);
    if (!user) {
      return { eligible: false, reason: "Người dùng không tồn tại trong hệ thống." };
    }
    if (!user.isActive) {
      return { eligible: false, reason: "Tài khoản người dùng đang bị khóa." };
    }
    return { eligible: true };
  }
}

// ----------------------------------------------------------------------------
// 2. MODULE PRODUCTS (PUBLIC CONTRACTS & INTERNAL IMPLEMENTATION)
// ----------------------------------------------------------------------------

export interface ProductPublicDto {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly availableStock: number;
}

export interface ReserveStockItem {
  productId: string;
  quantity: number;
}

export interface ReserveStockResult {
  success: boolean;
  totalPrice: number;
  errorMessage?: string;
}

/**
 * Public Interface cho Product Module.
 */
export interface IProductFacade {
  getProductById(productId: string): Promise<ProductPublicDto | null>;
  reserveStock(items: ReserveStockItem[]): Promise<ReserveStockResult>;
  releaseStock(items: ReserveStockItem[]): Promise<void>;
}

// --- Nội bộ Product Module (Internal) ---

class ProductEntity {
  constructor(
    public readonly id: string,
    public name: string,
    public price: number,
    public stock: number,
    public costPrice: number // Giá nhập hàng nội bộ (Private)
  ) {}
}

class ProductRepository {
  private products: Map<string, ProductEntity> = new Map([
    ["p-001", new ProductEntity("p-001", "MacBook Pro M3", 45000000, 10, 38000000)],
    ["p-002", new ProductEntity("p-002", "Bàn phím cơ Keychron Q1", 4200000, 3, 3000000)],
    ["p-003", new ProductEntity("p-003", "Chuột Logitech MX Master 3S", 2400000, 0, 1800000)], // Hết hàng
  ]);

  async findById(id: string): Promise<ProductEntity | null> {
    return this.products.get(id) || null;
  }

  async save(product: ProductEntity): Promise<void> {
    this.products.set(product.id, product);
  }
}

class ProductService {
  constructor(private readonly productRepo: ProductRepository) {}

  async getProduct(id: string): Promise<ProductEntity | null> {
    return this.productRepo.findById(id);
  }

  async reserveStock(items: ReserveStockItem[]): Promise<ReserveStockResult> {
    // 1. Kiểm tra tính khả dụng của tất cả mặt hàng trước (Atomic check)
    let totalAmount = 0;
    const productsToUpdate: { product: ProductEntity; qty: number }[] = [];

    for (const item of items) {
      const product = await this.productRepo.findById(item.productId);
      if (!product) {
        return { success: false, totalPrice: 0, errorMessage: `Sản phẩm mã ${item.productId} không tồn tại.` };
      }
      if (product.stock < item.quantity) {
        return {
          success: false,
          totalPrice: 0,
          errorMessage: `Sản phẩm "${product.name}" không đủ số lượng tồn (Yêu cầu: ${item.quantity}, Hiện có: ${product.stock}).`,
        };
      }
      totalAmount += product.price * item.quantity;
      productsToUpdate.push({ product, qty: item.quantity });
    }

    // 2. Trừ tồn kho thực tế
    for (const { product, qty } of productsToUpdate) {
      product.stock -= qty;
      await this.productRepo.save(product);
    }

    return { success: true, totalPrice: totalAmount };
  }

  async releaseStock(items: ReserveStockItem[]): Promise<void> {
    for (const item of items) {
      const product = await this.productRepo.findById(item.productId);
      if (product) {
        product.stock += item.quantity;
        await this.productRepo.save(product);
      }
    }
  }
}

/**
 * [TODO 2]: Hiện thực hóa ProductFacade
 */
export class ProductFacade implements IProductFacade {
  constructor(private readonly productService: ProductService) {}

  async getProductById(productId: string): Promise<ProductPublicDto | null> {
    const product = await this.productService.getProduct(productId);
    if (!product) return null;
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      availableStock: product.stock,
    };
  }

  async reserveStock(items: ReserveStockItem[]): Promise<ReserveStockResult> {
    return this.productService.reserveStock(items);
  }

  async releaseStock(items: ReserveStockItem[]): Promise<void> {
    return this.productService.releaseStock(items);
  }
}

// ----------------------------------------------------------------------------
// 3. MODULE ORDERS (SỬ DỤNG PUBLIC FACADES TỪ MODULE KHÁC)
// ----------------------------------------------------------------------------

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  userId: string;
  items: CreateOrderItemInput[];
}

export interface OrderResultDto {
  success: boolean;
  orderId?: string;
  totalAmount?: number;
  status?: string;
  error?: string;
}

class OrderEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly items: CreateOrderItemInput[],
    public readonly totalAmount: number,
    public status: "PENDING" | "PAID" | "FAILED",
    public readonly createdAt: Date
  ) {}
}

class OrderRepository {
  private orders: Map<string, OrderEntity> = new Map();

  async save(order: OrderEntity): Promise<OrderEntity> {
    this.orders.set(order.id, order);
    return order;
  }

  async findById(id: string): Promise<OrderEntity | null> {
    return this.orders.get(id) || null;
  }
}

/**
 * [TODO 3]: Hoàn thiện logic OrderService
 * QUY TẮC CỐT LÕI: OrderService KHÔNG ĐƯỢC PHÉP gọi trực tiếp UserService hay ProductService.
 * Phải inject và sử dụng IUserFacade và IProductFacade.
 */
export class OrderService {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly userFacade: IUserFacade,       // Giao tiếp qua Public Facade
    private readonly productFacade: IProductFacade  // Giao tiếp qua Public Facade
  ) {}

  async createOrder(request: CreateOrderRequest): Promise<OrderResultDto> {
    console.log(`\n📦 [OrderService] Bắt đầu quy trình tạo đơn hàng cho khách: ${request.userId}`);

    // BƯỚC 1: Kiểm tra tính hợp lệ của người dùng qua UserFacade
    const eligibility = await this.userFacade.isUserEligibleForOrder(request.userId);
    if (!eligibility.eligible) {
      console.error(`❌ [OrderService] Lỗi xác thực người dùng: ${eligibility.reason}`);
      return { success: false, error: eligibility.reason };
    }

    const user = await this.userFacade.getUserById(request.userId);
    console.log(`✅ [OrderService] Xác nhận khách hàng hợp lệ: ${user?.fullName} (${user?.email})`);

    // BƯỚC 2: Kiểm tra và giữ hàng (Reserve Stock) qua ProductFacade
    const reserveResult = await this.productFacade.reserveStock(request.items);
    if (!reserveResult.success) {
      console.error(`❌ [OrderService] Lỗi tồn kho: ${reserveResult.errorMessage}`);
      return { success: false, error: reserveResult.errorMessage };
    }

    console.log(`✅ [OrderService] Đã giữ hàng thành công! Tổng tiền đơn: ${reserveResult.totalPrice.toLocaleString()} VND`);

    // BƯỚC 3: Lưu đơn hàng vào cơ sở dữ liệu nội bộ Order
    try {
      const orderId = `ORD-${Date.now()}`;
      const newOrder = new OrderEntity(
        orderId,
        request.userId,
        request.items,
        reserveResult.totalPrice,
        "PENDING",
        new Date()
      );

      await this.orderRepo.save(newOrder);
      console.log(`🎉 [OrderService] Đơn hàng [${orderId}] đã được tạo thành công với trạng thái PENDING.`);

      return {
        success: true,
        orderId: newOrder.id,
        totalAmount: newOrder.totalAmount,
        status: newOrder.status,
      };
    } catch (dbError) {
      // BƯỚC 4 (Bù trừ / Compensation): Nếu lưu đơn thất bại, giải phóng lại kho hàng
      console.error(`💥 [OrderService] Lỗi khi lưu DB đơn hàng, tiến hành Rollback kho...`);
      await this.productFacade.releaseStock(request.items);
      return { success: false, error: "Lỗi hệ thống khi lưu đơn hàng. Kho đã được hoàn trả." };
    }
  }
}

// ============================================================================
// KỊCH BẢN KIỂM THỬ THỰC TẾ (VERIFICATION & SIMULATION TEST)
// ============================================================================
async function runModularMonolithDemo() {
  console.log("================================================================");
  console.log("🚀 CHẠY THỬ NGHIỆM MÔ HÌNH MODULAR MONOLITH & FACADE PATTERN");
  console.log("================================================================");

  // 1. Khởi tạo các tầng Dependency (Mô phỏng NestJS Dependency Injection Container)
  const userRepo = new UserRepository();
  const userService = new UserService(userRepo);
  const userFacade: IUserFacade = new UserFacade(userService);

  const productRepo = new ProductRepository();
  const productService = new ProductService(productRepo);
  const productFacade: IProductFacade = new ProductFacade(productService);

  const orderRepo = new OrderRepository();
  const orderService = new OrderService(orderRepo, userFacade, productFacade);

  // TEST CASE 1: Đặt hàng thành công cho khách hợp lệ
  console.log("\n--- TEST CASE 1: Khách hàng hợp lệ mua MacBook và Bàn phím ---");
  const result1 = await orderService.createOrder({
    userId: "u-101",
    items: [
      { productId: "p-001", quantity: 1 }, // MacBook Pro
      { productId: "p-002", quantity: 2 }, // Keychron Q1
    ],
  });
  console.log("Kết quả Test 1:", result1);

  // TEST CASE 2: Đặt hàng cho tài khoản bị khóa (Banned)
  console.log("\n--- TEST CASE 2: Tài khoản bị khóa cố tình đặt hàng ---");
  const result2 = await orderService.createOrder({
    userId: "u-102",
    items: [{ productId: "p-001", quantity: 1 }],
  });
  console.log("Kết quả Test 2:", result2);

  // TEST CASE 3: Đặt hàng sản phẩm đã hết hàng trong kho
  console.log("\n--- TEST CASE 3: Đặt mua Chuột Logitech đã hết hàng (stock = 0) ---");
  const result3 = await orderService.createOrder({
    userId: "u-101",
    items: [{ productId: "p-003", quantity: 1 }],
  });
  console.log("Kết quả Test 3:", result3);

  // Kiểm tra số lượng tồn kho còn lại của MacBook sau Test 1 (Ban đầu 10, mua 1 -> còn 9)
  const updatedMacbook = await productFacade.getProductById("p-001");
  console.log("\n📊 Tồn kho MacBook hiện tại:", updatedMacbook?.availableStock, "(Kỳ vọng: 9)");
}

// Chạy demo nếu tệp được thực thi trực tiếp
if (require.main === module) {
  runModularMonolithDemo().catch(console.error);
}
