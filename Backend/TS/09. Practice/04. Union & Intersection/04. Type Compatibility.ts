// Bài tập 04: Type Compatibility & Widening
// Yêu cầu: Giải quyết vấn đề tự động mở rộng kiểu (widening) trong TS.

// 1. Cho hàm xử lý sự kiện:
type EventName = "click" | "hover" | "focus";
function attachListener(elementId: string, event: EventName) {
  console.log(`Attaching ${event} to ${elementId}`);
}

// Đối tượng cấu hình sau bị báo lỗi khi truyền vào hàm do tự động widen:
const config = {
  elementId: "submit-btn",
  event: "click" // Bị suy luận thành kiểu 'string'
};

// Sửa lại dòng gọi hàm dưới đây bằng cách áp dụng một giải pháp đã học ở Bài 04
// để nó compile thành công (ví dụ: dùng as const hoặc thêm kiểu cho config).
// attachListener(config.elementId, config.event);
