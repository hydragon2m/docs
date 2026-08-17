/**
 * ============================================================================
 * BÀI TẬP THỰC HÀNH: MICROSERVICES COMMUNICATION PATTERNS
 * ============================================================================
 * Tệp: 02. Microservices Communication.ts
 * Khóa học: DevOps & Architecture - Architecture Patterns
 *
 * MỤC TIÊU BÀI HỌC:
 * 1. Hiểu và hiện thực hóa mô hình API Gateway định tuyến đồng bộ (Synchronous Routing Pattern).
 *    - Gom nhiều vi dịch vụ riêng biệt thành một cổng duy nhất cho Client.
 *    - Gắn kèm Correlation ID (X-Request-ID) và kiểm tra Bearer Auth Token.
 * 2. Hiểu và hiện thực hóa mô hình Giao tiếp Bất đồng bộ Hướng sự kiện (Event-Driven Asynchronous Pattern).
 *    - Sử dụng Message Bus (Publish/Subscribe) mô phỏng Kafka / RabbitMQ.
 *    - Hiện thực hóa luồng Choreography Saga giữa Order Service và Inventory Service:
 *      OrderCreated -> InventoryReserved -> OrderConfirmed / OrderCancelled.
 *
 * BÀI TẬP:
 * - Bài tập 1: Hoàn thành logic định tuyến của ApiGateway.
 * - Bài tập 2: Hoàn thành luồng phát và lắng nghe sự kiện bất đồng bộ qua EventBus.
 * ============================================================================
 */

import { EventEmitter } from "events";

// ============================================================================
// BÀI TẬP 1: XÂY DỰNG API GATEWAY (SYNCHRONOUS REQUEST ROUTING)
// ============================================================================

export interface GatewayHttpRequest {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  headers: Record<string, string>;
  body?: any;
}

export interface GatewayHttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  data: any;
}

export type MicroserviceHandler = (req: GatewayHttpRequest) => Promise<GatewayHttpResponse>;

/**
 * Vi dịch vụ người dùng giả lập (Mock User Service)
 */
export const mockUserService: MicroserviceHandler = async (req) => {
  if (req.path === "/users/me") {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { statusCode: 401, headers: {}, data: { error: "Unauthorized: Missing Bearer Token" } };
    }
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      data: { id: "u-101", name: "Nguyễn Văn Dev", role: "ADMIN", requestId: req.headers["x-request-id"] },
    };
  }
  return { statusCode: 404, headers: {}, data: { error: "User Route Not Found" } };
};

/**
 * Vi dịch vụ sản phẩm giả lập (Mock Product Service)
 */
export const mockProductService: MicroserviceHandler = async (req) => {
  if (req.path === "/products" && req.method === "GET") {
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      data: [
        { id: "p-01", name: "Laptop ThinkPad", price: 35000000 },
        { id: "p-02", name: "Màn hình Dell Ultrasharp", price: 12000000 },
      ],
    };
  }
  return { statusCode: 404, headers: {}, data: { error: "Product Route Not Found" } };
};

/**
 * API Gateway trung tâm
 */
export class ApiGateway {
  private routeTable: Map<string, MicroserviceHandler> = new Map();

  /**
   * Đăng ký tiền tố URL (Prefix) tới Microservice tương ứng
   * @param prefix Ví dụ: '/api/v1/users' -> userService
   */
  registerRoute(prefix: string, handler: MicroserviceHandler): void {
    this.routeTable.set(prefix, handler);
    console.log(`📡 [API Gateway] Đã đăng ký route prefix: "${prefix}" -> Handled by Service`);
  }

  /**
   * [TODO 1]: Hiện thực hóa bộ định tuyến (Dispatcher) của API Gateway
   * Các yêu cầu:
   * 1. Sinh ngẫu nhiên hoặc kế thừa Correlation ID (`x-request-id`) để Trace log phân tán.
   * 2. Tìm kiếm prefix khớp với `request.path` trong `routeTable`.
   * 3. Viết lại path (Strip prefix) trước khi chuyển vào microservice đích.
   *    Ví dụ: Request tới `/api/v1/users/me` -> Chuyển vào User Service với path `/users/me`.
   * 4. Bắt lỗi (Catch Error) nếu microservice đích gặp sự cố và trả về HTTP 500 hoặc 504.
   */
  async handleRequest(request: GatewayHttpRequest): Promise<GatewayHttpResponse> {
    const correlationId = request.headers["x-request-id"] || `trace-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const forwardedHeaders = {
      ...request.headers,
      "x-request-id": correlationId,
      "x-forwarded-by": "ApiGateway-v1.0",
    };

    console.log(`\n🌐 [Gateway] Nhận request [${request.method}] ${request.path} | TraceID: ${correlationId}`);

    // Tìm kiếm prefix phù hợp
    let matchedPrefix: string | null = null;
    let matchedHandler: MicroserviceHandler | null = null;

    for (const [prefix, handler] of this.routeTable.entries()) {
      if (request.path.startsWith(prefix)) {
        matchedPrefix = prefix;
        matchedHandler = handler;
        break;
      }
    }

    if (!matchedPrefix || !matchedHandler) {
      console.error(`❌ [Gateway] Không tìm thấy Service cho đường dẫn: ${request.path}`);
      return {
        statusCode: 404,
        headers: { "x-request-id": correlationId },
        data: { error: `Gateway Error: Không tìm thấy service định tuyến cho path "${request.path}"` },
      };
    }

    // Rewrite path: Loại bỏ tiền tố của Gateway
    const targetPath = request.path.slice(matchedPrefix.length) || "/";
    const forwardedRequest: GatewayHttpRequest = {
      ...request,
      path: targetPath,
      headers: forwardedHeaders,
    };

    try {
      console.log(`🔀 [Gateway] Định tuyến tới Service nội bộ với sub-path: "${targetPath}"`);
      const response = await matchedHandler(forwardedRequest);
      return {
        ...response,
        headers: {
          ...response.headers,
          "x-request-id": correlationId,
        },
      };
    } catch (err: any) {
      console.error(`💥 [Gateway] Lỗi Service nội bộ:`, err.message);
      return {
        statusCode: 502,
        headers: { "x-request-id": correlationId },
        data: { error: "Bad Gateway: Dịch vụ nội bộ không phản hồi", details: err.message },
      };
    }
  }
}

// ============================================================================
// BÀI TẬP 2: GIAO TIẾP HƯỚNG SỰ KIỆN BẤT ĐỒNG BỘ (ASYNC EVENT-DRIVEN & SAGA)
// ============================================================================

/**
 * Cấu trúc chuẩn của một Domain Event trong hệ thống phân tán
 */
export interface DomainEvent<T = any> {
  readonly eventId: string;
  readonly eventName: string;
  readonly correlationId: string;
  readonly timestamp: number;
  readonly payload: T;
}

/**
 * Message Broker / Event Bus giả lập (Mô phỏng RabbitMQ / Kafka)
 */
export class DistributedEventBus {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  /**
   * Xuất bản (Publish) một sự kiện lên Bus
   */
  async publish<T>(eventName: string, correlationId: string, payload: T): Promise<void> {
    const event: DomainEvent<T> = {
      eventId: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      eventName,
      correlationId,
      timestamp: Date.now(),
      payload,
    };

    console.log(`📢 [EventBus] 👉 PHÁT SỰ KIỆN [${eventName}] | Trace: ${correlationId}`);
    // Mô phỏng độ trễ truyền tin qua mạng (Network Latency ~ 20ms)
    setTimeout(() => {
      this.emitter.emit(eventName, event);
    }, 20);
  }

  /**
   * Đăng ký lắng nghe (Subscribe) sự kiện từ Bus
   */
  subscribe<T>(eventName: string, handler: (event: DomainEvent<T>) => Promise<void>): void {
    this.emitter.on(eventName, async (event: DomainEvent<T>) => {
      try {
        console.log(`📥 [EventBus] 👈 NHẬN SỰ KIỆN [${eventName}] bởi Listener | Trace: ${event.correlationId}`);
        await handler(event);
      } catch (err: any) {
        console.error(`💥 [EventBus] Lỗi xử lý sự kiện [${eventName}]:`, err.message);
      }
    });
  }
}

// --- ĐỊNH NGHĨA SỰ KIỆN GIỮA ORDER VÀ INVENTORY SERVICE ---

export interface OrderCreatedPayload {
  orderId: string;
  userId: string;
  items: { productId: string; quantity: number }[];
  totalAmount: number;
}

export interface InventoryReservedPayload {
  orderId: string;
  items: { productId: string; quantity: number }[];
}

export interface InventoryFailedPayload {
  orderId: string;
  reason: string;
}

/**
 * [TODO 2]: Dịch vụ Quản lý Kho (Inventory Service)
 * Nhiệm vụ:
 * 1. Lắng nghe sự kiện "order.created"
 * 2. Kiểm tra hàng tồn trong kho:
 *    - Nếu đủ hàng: Trừ kho và phát sự kiện "inventory.reserved"
 *    - Nếu thiếu hàng: Phát sự kiện "inventory.failed"
 */
export class InventoryMicroservice {
  private stockDb: Map<string, number> = new Map([
    ["item-macbook", 5],
    ["item-keyboard", 2],
  ]);

  constructor(private readonly eventBus: DistributedEventBus) {
    this.registerEventListeners();
  }

  private registerEventListeners(): void {
    this.eventBus.subscribe<OrderCreatedPayload>("order.created", async (event) => {
      console.log(`🔍 [InventoryService] Đang kiểm tra tồn kho cho đơn hàng: ${event.payload.orderId}`);
      const { orderId, items } = event.payload;

      let isStockAvailable = true;
      let failureReason = "";

      for (const item of items) {
        const currentStock = this.stockDb.get(item.productId) ?? 0;
        if (currentStock < item.quantity) {
          isStockAvailable = false;
          failureReason = `Sản phẩm ${item.productId} không đủ hàng (Cần: ${item.quantity}, Còn: ${currentStock})`;
          break;
        }
      }

      if (isStockAvailable) {
        // Trừ tồn kho
        for (const item of items) {
          const currentStock = this.stockDb.get(item.productId)!;
          this.stockDb.set(item.productId, currentStock - item.quantity);
        }
        console.log(`✅ [InventoryService] Giữ hàng thành công cho đơn [${orderId}]!`);

        // Phát sự kiện thành công
        await this.eventBus.publish<InventoryReservedPayload>(
          "inventory.reserved",
          event.correlationId,
          { orderId, items }
        );
      } else {
        console.warn(`❌ [InventoryService] Giữ hàng thất bại cho đơn [${orderId}]: ${failureReason}`);

        // Phát sự kiện thất bại
        await this.eventBus.publish<InventoryFailedPayload>(
          "inventory.failed",
          event.correlationId,
          { orderId, reason: failureReason }
        );
      }
    });
  }
}

/**
 * [TODO 3]: Dịch vụ Quản lý Đơn hàng (Order Service)
 * Nhiệm vụ:
 * 1. Tạo đơn hàng trạng thái "PENDING_INVENTORY" và phát "order.created"
 * 2. Lắng nghe "inventory.reserved" -> Cập nhật trạng thái đơn thành "CONFIRMED"
 * 3. Lắng nghe "inventory.failed" -> Cập nhật trạng thái đơn thành "REJECTED_OUT_OF_STOCK"
 */
export class OrderMicroservice {
  public orders: Map<string, { id: string; status: string; totalAmount: number }> = new Map();

  constructor(private readonly eventBus: DistributedEventBus) {
    this.registerEventListeners();
  }

  private registerEventListeners(): void {
    // Khi kho đã giữ hàng thành công -> Xác nhận đơn
    this.eventBus.subscribe<InventoryReservedPayload>("inventory.reserved", async (event) => {
      const order = this.orders.get(event.payload.orderId);
      if (order) {
        order.status = "CONFIRMED";
        console.log(`🎉 [OrderService] Đơn hàng [${order.id}] đã được XÁC NHẬN (CONFIRMED).`);
      }
    });

    // Khi kho hết hàng -> Hủy đơn
    this.eventBus.subscribe<InventoryFailedPayload>("inventory.failed", async (event) => {
      const order = this.orders.get(event.payload.orderId);
      if (order) {
        order.status = "REJECTED_OUT_OF_STOCK";
        console.log(`⚠️ [OrderService] Đơn hàng [${order.id}] đã bị HỦY (Lý do: ${event.payload.reason}).`);
      }
    });
  }

  async placeOrder(userId: string, items: { productId: string; quantity: number }[], totalAmount: number): Promise<string> {
    const orderId = `ORD-MS-${Date.now()}`;
    const correlationId = `corr-${orderId}`;

    this.orders.set(orderId, {
      id: orderId,
      status: "PENDING_INVENTORY",
      totalAmount,
    });

    console.log(`📝 [OrderService] Đã tạo đơn mới [${orderId}], phát sự kiện order.created...`);

    await this.eventBus.publish<OrderCreatedPayload>("order.created", correlationId, {
      orderId,
      userId,
      items,
      totalAmount,
    });

    return orderId;
  }
}

// ============================================================================
// KỊCH BẢN KIỂM THỬ TỔNG HỢP (COMPREHENSIVE TEST SUITE)
// ============================================================================
async function runMicroservicesSimulation() {
  console.log("================================================================");
  console.log("🚀 CHẠY THỬ NGHIỆM GIAO TIẾP MICROSERVICES (GATEWAY + EVENT BUS)");
  console.log("================================================================");

  // --- PHẦN 1: TEST API GATEWAY ĐỒNG BỘ ---
  console.log("\n==================== 1. KIỂM THỬ API GATEWAY ====================");
  const gateway = new ApiGateway();
  gateway.registerRoute("/api/v1/users", mockUserService);
  gateway.registerRoute("/api/v1/products", mockProductService);

  // Gửi request lấy thông tin User qua Gateway (Kèm Bearer Token)
  const userResponse = await gateway.handleRequest({
    method: "GET",
    path: "/api/v1/users/me",
    headers: { authorization: "Bearer jwt_super_secure_token" },
  });
  console.log("Gateway Response (User):", JSON.stringify(userResponse, null, 2));

  // Gửi request lấy danh sách sản phẩm qua Gateway
  const productResponse = await gateway.handleRequest({
    method: "GET",
    path: "/api/v1/products",
    headers: {},
  });
  console.log("Gateway Response (Products):", JSON.stringify(productResponse, null, 2));

  // --- PHẦN 2: TEST GIAO TIẾP BẤT ĐỒNG BỘ HƯỚNG SỰ KIỆN (CHOREOGRAPHY SAGA) ---
  console.log("\n==================== 2. KIỂM THỬ ASYNC SAGA EVENT BUS ====================");
  const eventBus = new DistributedEventBus();
  const inventoryService = new InventoryMicroservice(eventBus);
  const orderService = new OrderMicroservice(eventBus);

  // Kịch bản A: Đặt 1 chiếc MacBook (Kho có 5 chiếc -> Thành công)
  console.log("\n--- KỊCH BẢN A: Đặt hàng thành công ---");
  const orderId1 = await orderService.placeOrder("user-01", [{ productId: "item-macbook", quantity: 1 }], 35000000);

  // Đợi các sự kiện bất đồng bộ lan truyền xong
  await new Promise((resolve) => setTimeout(resolve, 100));
  console.log(`Trạng thái cuối cùng của đơn [${orderId1}]:`, orderService.orders.get(orderId1)?.status);

  // Kịch bản B: Đặt 10 chiếc Bàn phím (Kho chỉ có 2 chiếc -> Thất bại, Hủy đơn)
  console.log("\n--- KỊCH BẢN B: Đặt quá số lượng tồn kho (Out of Stock) ---");
  const orderId2 = await orderService.placeOrder("user-02", [{ productId: "item-keyboard", quantity: 10 }], 12000000);

  await new Promise((resolve) => setTimeout(resolve, 100));
  console.log(`Trạng thái cuối cùng của đơn [${orderId2}]:`, orderService.orders.get(orderId2)?.status);
}

if (require.main === module) {
  runMicroservicesSimulation().catch(console.error);
}
