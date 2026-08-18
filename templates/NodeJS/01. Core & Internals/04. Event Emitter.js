// Bài tập 04: Event Emitter
// Yêu cầu: Sử dụng EventEmitter để thiết kế một hệ thống Pub/Sub đơn giản.

const EventEmitter = require('events');

// 1. Tạo một class `StockTicker` kế thừa `EventEmitter`.
// Class này giả lập sự thay đổi giá cổ phiếu:
// - Phương thức `updatePrice(symbol, price)`: phát ra sự kiện `price_changed` kèm đối tượng `{ symbol, price }`.
//
// 2. Viết mã đăng ký lắng nghe (Subscribe):
// - Một listener in ra: "[LOG] Cổ phiếu [symbol] đổi giá thành: [price]".
// - Một listener đặc biệt lắng nghe sự kiện `'error'` để tránh tiến trình bị crash.
