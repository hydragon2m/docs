// Bài tập 05: Strict Union Types (Kiểu kết hợp nghiêm ngặt)
// Yêu cầu: Ngăn chặn thuộc tính lai (hybrid/bleeding properties) trong Union.

interface IDesktopConfig {
  os: "windows" | "mac" | "linux";
}

interface IMobileConfig {
  platform: "ios" | "android";
}

// 1. Nếu viết Union thông thường:
type DeviceConfig = IDesktopConfig | IMobileConfig;
// TypeScript sẽ chấp nhận đối tượng lai dưới đây:
const badHybridConfig = { os: "windows", platform: "ios" };
const testConfig: DeviceConfig = badHybridConfig; // ✅ Không báo lỗi!


// 2. Yêu cầu: Hãy định nghĩa lại hai interface mới là `IStrictDesktopConfig` 
// và `IStrictMobileConfig` sử dụng kiểu `never` để loại trừ lẫn nhau.
// Sau đó tạo Union `StrictDeviceConfig` để đối tượng lai trên bắt buộc phải báo lỗi đỏ.
type StrictDeviceConfig = any; // Sửa lại dòng này và các interface tương ứng
