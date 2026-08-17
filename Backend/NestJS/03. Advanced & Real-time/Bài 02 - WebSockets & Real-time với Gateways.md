## I. KHÁI QUÁT (OVERVIEW)

Trong môi trường web hiện đại, việc giao tiếp hai chiều thời gian thực (real-time bidirection) giữa Client và Server là vô cùng quan trọng cho các tính năng như Chat, Notifications, Live Tracking.
NestJS cung cấp module `@nestjs/websockets` hỗ trợ việc xây dựng WebSocket server dễ dàng, đóng gói các thư viện phổ biến như `socket.io` (mặc định) và `ws`.

Bằng cách sử dụng các Gateway, NestJS cho phép áp dụng hoàn toàn tư duy của Controller (Dependency Injection, Guards, Pipes, Interceptors) vào môi trường WebSocket.

> [!TIP]
> Gateways trong NestJS hoạt động như một lớp trừu tượng (abstraction layer) giúp bạn dễ dàng chuyển đổi qua lại giữa `socket.io` và `ws` mà không phải thay đổi toàn bộ logic kinh doanh.

## II. CHI TIẾT KỸ THUẬT

### 1. Kiến trúc WebSocket Gateway
Khai báo Gateway bằng decorator `@WebSocketGateway()`. Để instance của gateway được NestJS quản lý, nó cần được khai báo trong mảng `providers` của Module.

```typescript
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway(80, { namespace: 'chat', cors: { origin: '*' } })
export class ChatGateway {
  @WebSocketServer()
  server: Server; // Truy cập trực tiếp instance của socket.io Server
}
```

### 2. Quản lý vòng đời Gateway (Lifecycle)
Gateway có thể triển khai 3 interfaces vòng đời để hook vào các sự kiện hệ thống:
- `OnGatewayInit`: Chạy khi server khởi tạo xong.
- `OnGatewayConnection`: Chạy khi có một client kết nối.
- `OnGatewayDisconnect`: Chạy khi client ngắt kết nối.

```typescript
import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket } from 'socket.io';

export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  afterInit(server: Server) {
    console.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }
}
```

### 3. Nhận tin nhắn (Subscribing to Messages)
Sử dụng `@SubscribeMessage()` để lắng nghe các event từ client.
Sử dụng `@MessageBody()` để lấy payload và `@ConnectedSocket()` để lấy thông tin client socket.

```typescript
import { SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';

@SubscribeMessage('send_message')
handleMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket): string {
  console.log('Received payload:', data);
  // Trả về dữ liệu trực tiếp dưới dạng response (Ack)
  return 'Message received!';
}
```

### 4. Xác thực người dùng (JWT Authentication)
Việc xác thực thường được thực hiện trong hàm `handleConnection`. Nếu token không hợp lệ, ta sẽ chủ động disconnect client.

```typescript
async handleConnection(client: Socket) {
  try {
    const token = client.handshake.headers.authorization?.split(' ')[1];
    const user = await this.jwtService.verifyAsync(token);
    client.data.user = user; // Lưu thông tin user vào socket
  } catch (error) {
    client.disconnect(true); // Ngắt kết nối nếu token sai
  }
}
```
*Ghi chú:* Bạn cũng có thể dùng Custom Guards (`@UseGuards(WsJwtGuard)`) để bảo vệ các event cụ thể.

### 5. Room Management và Broadcasting
Socket.io hỗ trợ khái niệm "Rooms" (phòng). Client có thể join/leave các phòng, server có thể gửi tin nhắn cho toàn bộ thành viên trong phòng.

```typescript
@SubscribeMessage('join_room')
handleJoinRoom(client: Socket, room: string) {
  client.join(room);
}

@SubscribeMessage('send_room_message')
handleRoomMessage(client: Socket, payload: { room: string; message: string }) {
  // Gửi cho tất cả mọi người trong phòng
  this.server.to(payload.room).emit('new_message', payload.message);
  
  // Gửi cho mọi người trừ người gửi
  // client.to(payload.room).emit('new_message', payload.message);
}
```

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE

Dưới đây là một Gateway thông báo đơn giản, tận dụng DI (Dependency Injection) để phát thông báo từ bất kỳ đâu trong hệ thống.

```typescript
@WebSocketGateway({ cors: true })
export class NotificationGateway {
  @WebSocketServer() server: Server;

  // Phương thức này có thể được gọi bởi NotificationService
  sendNotificationToUser(userId: string, notification: any) {
    // Giả sử mỗi user khi connect sẽ join một room bằng userId của họ
    this.server.to(userId).emit('notification', notification);
  }
}

@Injectable()
export class NotificationService {
  constructor(private gateway: NotificationGateway) {}

  async notifyOrderSuccess(userId: string, orderId: string) {
    this.gateway.sendNotificationToUser(userId, { type: 'ORDER_SUCCESS', orderId });
  }
}
```

## IV. LƯU Ý CẠM BẪY VÀ QUY TẮC CỐT LÕI

> [!WARNING] Cạm bẫy về Instance
> Nếu bạn khai báo Gateway trong nhiều Modules (mà không thiết kế ở Global module hay Shared module), NestJS sẽ tạo ra **nhiều instances** của Gateway đó và bind vào nhiều server khác nhau, gây lỗi xung đột cổng (port collision) hoặc rò rỉ bộ nhớ.
> **Giải pháp:** Chỉ cung cấp (provide) Gateway ở duy nhất một Module.

> [!IMPORTANT] Xử lý ngoại lệ trong WebSocket
> Không giống như HTTP, việc ném ngoại lệ (Exception) trong hàm `@SubscribeMessage` có thể làm chết tiến trình hoặc không phản hồi về client theo đúng cấu trúc.
> Bạn phải tạo `WsExceptionFilter` (kế thừa từ `BaseWsExceptionFilter`) để bắt lỗi và trả về cho client một cấu trúc lỗi rõ ràng.

> [!CAUTION] State Management
> Không lưu trữ state dài hạn trực tiếp trên biến của Gateway (vì môi trường server có thể khởi động lại hoặc có nhiều node). Cần sử dụng Redis Adapter (`@socket.io/redis-adapter`) nếu chạy ứng dụng theo dạng cluster/multi-node để các node có thể broadcast cho nhau.

> [!TIP] Scaling WebSockets
> Khi hệ thống có nhiều kết nối đồng thời và bạn chạy nhiều instance (pods/containers) của NestJS app, bạn **phải** cấu hình Redis Adapter cho Socket.io để các clients kết nối vào các pods khác nhau vẫn có thể chat/nhận tin nhắn cùng room.
