## I. KHÁI QUÁT (OVERVIEW)

### 1. Tại sao cần áp dụng Design Patterns trong Backend?
**Design Patterns (Mẫu thiết kế)** là các giải pháp đã được kiểm chứng và chuẩn hóa để giải quyết các vấn đề thiết kế phần mềm thường gặp trong thực tế. 

Trong lập trình Backend Node.js/NestJS, việc áp dụng đúng Design Patterns giúp bạn cấu trúc hệ thống một cách có tổ chức, dễ mở rộng, tối ưu hóa bộ nhớ và tài nguyên hệ thống (như kết nối cơ sở dữ liệu).

Chúng ta sẽ đi sâu vào 3 mẫu thiết kế cốt lõi nhất thường dùng trong Backend:
1. **Singleton Pattern** (Mẫu khởi tạo duy nhất - Creational).
2. **Factory Pattern** (Mẫu nhà máy khởi tạo - Creational).
3. **Adapter Pattern** (Mẫu bộ chuyển đổi tương thích - Structural).

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Singleton Pattern (Khởi tạo thực thể duy nhất)

#### a. Mục tiêu
Đảm bảo một Class chỉ được phép tạo ra **duy nhất một thực thể (Instance)** trong suốt vòng đời hoạt động của ứng dụng, và cung cấp một điểm truy cập toàn cục tới thực thể đó.

#### b. Ứng dụng thực tế
Dùng cho các Service đắt đỏ về tài nguyên như: Connection Pool kết nối Database, kết nối Redis Client, Logger toàn hệ thống. Nếu mỗi request lại tạo mới 1 instance kết nối DB, Server sẽ nhanh chóng hết ram và sập kết nối DB.

#### c. Cơ chế Caching Module của Node.js
Trong JavaScript/CommonJS, khi bạn dùng `require` hoặc `import` một file, Node.js sẽ tự động lưu kết quả vào bộ nhớ đệm (Module Caching). Nhờ đó, việc export thẳng một instance mới từ file sẽ tự động biến nó thành một Singleton ở môi trường runtime:

```javascript
// db.js
class Database { ... }
module.exports = new Database(); // Singleton tự động nhờ Node.js Module Cache
```

---

### 2. Factory Pattern (Nhà máy sản xuất đối tượng)

#### a. Mục tiêu
Định nghĩa một Interface dùng để tạo đối tượng, nhưng để các lớp con tự quyết định lớp nào sẽ được khởi tạo. Factory Pattern đóng vai trò ẩn giấu logic khởi tạo đối tượng phức tạp dưới một hàm duy nhất.

#### b. Ứng dụng thực tế
Dùng khi bạn có nhiều biến thể của một dịch vụ và muốn khởi tạo động dựa trên cấu hình runtime. Ví dụ: Cổng thanh toán (Payment Factory) tự động sinh ra đối tượng xử lý **Stripe** hoặc **Paypal** tùy theo lựa chọn của người dùng lúc bấm thanh toán.

---

### 3. Adapter Pattern (Bộ chuyển đổi tương thích)

#### a. Mục tiêu
Chuyển đổi giao diện (Interface) của một Class sẵn có sang một giao diện khác mà Client mong muốn, giúp các Class có giao diện không tương thích có thể làm việc cùng nhau một cách êm ái.

#### b. Ứng dụng thực tế
Thường dùng khi bạn tích hợp các thư viện của bên thứ ba (Third-party SDKs) vào dự án. Mỗi thư viện có tên hàm khác nhau, bạn viết một lớp Adapter bọc ngoài để chuyển đổi chúng về cùng một tên hàm chung do bạn tự định nghĩa, tránh code logic của bạn bị phụ thuộc vào SDK đó.

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE ANALYSIS)

Dưới đây là mã nguồn mô tả cách kết hợp **Factory Pattern** và **Adapter Pattern** để xây dựng hệ thống gửi SMS linh hoạt:

### Bước 1: Định nghĩa Interface chuẩn của chúng ta
```typescript
interface ISmsSender {
  sendSms(phoneNumber: string, message: string): Promise<void>;
}
```

### Bước 2: Viết các Adapters bọc các thư viện bên thứ ba (Twilio và Vonage)
```typescript
// Thư viện SDK Twilio giả lập
class TwilioSDK {
  triggerSMS(to: string, text: string) { console.log(`[Twilio SDK] Sent to ${to}: ${text}`); }
}

// Adapter cho Twilio
class TwilioAdapter implements ISmsSender {
  private twilio = new TwilioSDK();

  async sendSms(phoneNumber: string, message: string): Promise<void> {
    // Chuyển đổi tên hàm sendSms -> triggerSMS của SDK
    this.twilio.triggerSMS(phoneNumber, message); 
  }
}

// Thư viện SDK Vonage giả lập
class VonageSDK {
  sendDirectMessage(phone: string, body: string) { console.log(`[Vonage SDK] Sent to ${phone}: ${body}`); }
}

// Adapter cho Vonage
class VonageAdapter implements ISmsSender {
  private vonage = new VonageSDK();

  async sendSms(phoneNumber: string, message: string): Promise<void> {
    // Chuyển đổi tên hàm sendSms -> sendDirectMessage của SDK
    this.vonage.sendDirectMessage(phoneNumber, message);
  }
}
```

### Bước 3: Tạo SMS Factory để khởi tạo động
```typescript
class SmsFactory {
  static createSender(provider: "twilio" | "vonage"): ISmsSender {
    if (provider === "twilio") {
      return new TwilioAdapter();
    }
    if (provider === "vonage") {
      return new VonageAdapter();
    }
    throw new Error("Provider không được hỗ trợ");
  }
}

// Sử dụng động tại Service
const currentProvider = "twilio"; // Cấu hình lấy từ file .env
const smsService = SmsFactory.createSender(currentProvider);
smsService.sendSms("+84999999", "Mã xác thực của bạn là 1234");
// Output: [Twilio SDK] Sent to +84999999: Mã xác thực của bạn là 1234
```

---

## IV. LƯU Ý, CẠM BẪY VÀ QUY TẮC CỐT LÕI (BEST PRACTICES)

> [!CAUTION]
> ### Cạm bẫy phá vỡ Singleton bằng cách phá khóa Constructor
> Khi viết Singleton bằng TypeScript, nếu bạn quên đặt từ khóa **`private`** cho constructor của Class Singleton, lập trình viên khác vẫn có thể vô ý gọi `new MySingleton()` ở bên ngoài, làm phá vỡ hoàn toàn nguyên lý hoạt động của mẫu thiết kế.
>
> **Quy tắc cốt lõi:**
> ```typescript
> class DatabaseConnection {
>   private static instance: DatabaseConnection;
>   
>   // 1. Bắt buộc phải khóa constructor bằng private
>   private constructor() {} 
>   
>   static getInstance(): DatabaseConnection {
>     if (!this.instance) {
>       this.instance = new DatabaseConnection();
>     }
>     return this.instance;
>   }
> }
> ```
