// ==============================================================
// Bài tập Thực hành: BullMQ Queues & WebSockets Gateway trong NestJS
// File: NestJS/09. Practice/03. Advanced & Real-time/01. Queues & WebSockets.ts
// ==============================================================

/**
 * ĐỀ BÀI:
 * 1. Triển khai một BullMQ Queue Processor xử lý Job chạy ngầm:
 *    - Tạo hàng đợi có tên `'email-queue'`.
 *    - Định nghĩa Processor `@Processor('email-queue')`.
 *    - Lắng nghe và xử lý Job có tên `'send-welcome-email'`.
 *    - Ghi log (console.log) khi bắt đầu và hoàn thành công việc.
 * 
 * 2. Triển khai một WebSocket Gateway để phát thông tin real-time:
 *    - Định nghĩa một Gateway `@WebSocketGateway(8080)`.
 *    - Lắng nghe sự kiện `'join-room'` từ client để kết nối client vào room tương ứng (use socket.join).
 *    - Định nghĩa phương thức broadcast tin nhắn cho tất cả các clients trong room đó khi nhận được sự kiện `'send-message'`.
 */

import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// ==============================================================
// 1. PHẦN 1: BULLMQ PROCESSOR
// ==============================================================

// TODO 1: Định nghĩa Processor và phương thức xử lý Job 'send-welcome-email'
@Processor('email-queue')
export class EmailProcessor {
  @Process('send-welcome-email')
  async handleSendWelcomeEmail(job: Job<{ userId: string; email: string }>) {
    const { userId, email } = job.data;
    // 1. In log bắt đầu xử lý gửi email cho userId
    // 2. Giả lập tác vụ nặng (sleep 2000ms)
    // 3. In log hoàn thành và trả về kết quả
    
    return { success: true };
  }
}

// ==============================================================
// 2. PHẦN 2: WEBSOCKETS GATEWAY
// ==============================================================

// TODO 2: Hoàn thiện Gateway với Room Management & Broadcasting
@WebSocketGateway(8080, { cors: { origin: '*' } })
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  // Lắng nghe sự kiện 'join-room' từ Client
  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId } = data;
    // 1. Kết nối client vào phòng: client.join(roomId)
    // 2. Trả về thông báo thành công cho client hiện tại
    
    return { event: 'joined', data: roomId };
  }

  // TODO 3: Lắng nghe sự kiện 'send-message' và phát đi (broadcast) cho cả room
  @SubscribeMessage('send-message')
  handleSendMessage(
    @MessageBody() data: { roomId: string; message: string; sender: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, message, sender } = data;
    // 1. Sử dụng this.server.to(roomId).emit(...) để gửi tin nhắn cho toàn bộ client trong phòng
    // Tin nhắn gửi đi định dạng: { event: 'new-message', data: { message, sender } }
  }
}
