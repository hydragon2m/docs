// ==============================================================
// Bài tập Thực hành: Database Transactions & CQRS Pattern trong NestJS
// File: NestJS/09. Practice/02. Database & CQRS/01. Transactions & CQRS.ts
// ==============================================================

/**
 * ĐỀ BÀI:
 * 1. Triển khai Order Service xử lý đặt hàng an toàn sử dụng Transaction.
 *    - Trừ tồn kho sản phẩm (Inventory) và lưu đơn hàng (Order) cùng một lúc.
 *    - Sử dụng `dataSource.transaction()` để đảm bảo tính nguyên tử (Atomicity). Nếu một trong hai bước lỗi, rollback toàn bộ.
 * 
 * 2. Triển khai luồng CQRS cơ bản cho việc đặt hàng:
 *    - Định nghĩa một Command: `CreateOrderCommand`.
 *    - Định nghĩa một CommandHandler: `CreateOrderHandler`.
 *    - Sau khi tạo đơn hàng thành công, phát đi một Event: `OrderCreatedEvent`.
 *    - Định nghĩa một EventHandler `OrderCreatedHandler` để lắng nghe sự kiện gửi mail xác nhận (giả lập).
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';

// Giả lập Entities
export interface Product {
  id: string;
  name: string;
  stock: number;
}

export interface Order {
  id: string;
  productId: string;
  quantity: number;
  status: string;
}

// Giả lập DataSource / Connection của Database
export class MockDataSource {
  private products: Map<string, Product> = new Map([
    ['p1', { id: 'p1', name: 'MacBook Pro', stock: 5 }],
  ]);
  private orders: Map<string, Order> = new Map();

  async transaction(runInTransaction: (manager: any) => Promise<any>): Promise<any> {
    // Giả lập EntityManager để thao tác DB trong Transaction
    const manager = {
      findOneProduct: async (id: string): Promise<Product | undefined> => this.products.get(id),
      updateProductStock: async (id: string, newStock: number) => {
        const product = this.products.get(id);
        if (product) product.stock = newStock;
      },
      saveOrder: async (order: Order) => {
        this.orders.set(order.id, order);
        return order;
      }
    };
    
    // Thực thi transaction
    try {
      return await runInTransaction(manager);
    } catch (error) {
      // Giả lập rollback bằng cách in log
      console.log('--- Transaction Rollbacked ---', error.message);
      throw error;
    }
  }
}

// ==============================================================
// 1. PHẦN 1: TRANSACTIONS TRONG SERVICE
// ==============================================================
@Injectable()
export class OrdersService {
  constructor(private readonly dataSource: MockDataSource) {}

  // TODO 1: Hoàn thiện phương thức createOrder sử dụng Transaction nguyên tử
  async createOrder(orderId: string, productId: string, quantity: number): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      // Bước A: Tìm sản phẩm. Nếu không có, ném BadRequestException
      // Bước B: Kiểm tra tồn kho. Nếu stock < quantity, ném BadRequestException
      // Bước C: Trừ tồn kho của sản phẩm
      // Bước D: Lưu và trả về đối tượng Order mới dạng { id: orderId, productId, quantity, status: 'PENDING' }
      
      return {} as Order; // Sửa lại dòng này
    });
  }
}

// ==============================================================
// 2. PHẦN 2: TRIỂN KHAI CQRS
// ==============================================================

// COMMAND DEFINITION
export class CreateOrderCommand {
  constructor(
    public readonly orderId: string,
    public readonly productId: string,
    public readonly quantity: number,
  ) {}
}

// EVENT DEFINITION
export class OrderCreatedEvent {
  constructor(public readonly orderId: string) {}
}

// TODO 2: Hoàn thiện CommandHandler xử lý CreateOrderCommand
@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateOrderCommand): Promise<any> {
    // 1. Gọi ordersService.createOrder()
    // 2. Nếu thành công, phát sự kiện OrderCreatedEvent lên eventBus
    // 3. Trả về kết quả đơn hàng vừa tạo
  }
}

// TODO 3: Hoàn thiện EventHandler lắng nghe OrderCreatedEvent
@EventsHandler(OrderCreatedEvent)
export class OrderCreatedHandler implements IEventHandler<OrderCreatedEvent> {
  handle(event: OrderCreatedEvent) {
    // Giả lập logic gửi email hoặc cập nhật analytics
    console.log(`[Email Service] Gửi mail xác nhận đơn hàng thành công cho order: ${event.orderId}`);
  }
}
