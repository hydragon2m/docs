// Bài tập 01: Dependency Injection & Inversion of Control
// Yêu cầu: Viết lại Class EmailService và NotificationService sử dụng Dependency Injection (Constructor Injection).

// 1. Mã nguồn tồi (Tight Coupling):
class InsecureEmailService {
  send(to: string, msg: string) {
    console.log(`Sending email to ${to}: ${msg}`);
  }
}

class TightCoupledNotification {
  private emailService: InsecureEmailService;

  constructor() {
    this.emailService = new InsecureEmailService(); // ❌ Khóa cứng phụ thuộc bên trong
  }

  notify(userEmail: string, message: string) {
    this.emailService.send(userEmail, message);
  }
}

// 2. Yêu cầu cải tiến:
// - Định nghĩa một Interface `IMessageService` chứa hàm `sendMessage(recipient: string, body: string): void`.
// - Tạo Class `GmailService` kế thừa `IMessageService`.
// - Sửa lại Class `NotificationManager` sử dụng Constructor Injection để nhận vào một dịch vụ kiểu `IMessageService` từ bên ngoài.
// - Viết code khởi chạy tiêm phụ thuộc thủ công ở cuối file.

interface IMessageService {
  // Định nghĩa hàm tại đây
}
