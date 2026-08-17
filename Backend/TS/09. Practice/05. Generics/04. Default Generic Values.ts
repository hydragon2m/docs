// Bài tập 04: Default Generic Values
// Yêu cầu: Khai báo Generic có giá trị mặc định cho tham số kiểu.

// 1. Tạo một Generic Interface `EventPacket<Payload = string, Meta = object>` gồm:
// - eventName (string)
// - payload (kiểu Payload)
// - metadata (kiểu Meta)
//
// Hãy khai báo các biến dưới đây và kiểm tra kiểu:
// - Biến `ev1` kiểu `EventPacket`: sử dụng mặc định toàn bộ (payload là string, metadata là object).
// - Biến `ev2` kiểu `EventPacket<{ id: number }>`: chỉ định nghĩa lại payload, giữ nguyên mặc định cho metadata.
// - Biến `ev3` kiểu `EventPacket<number, string>`: định nghĩa lại toàn bộ.
