// ==============================================================================
// BÀI TẬP THỰC HÀNH: MODULE SYSTEM TRONG NODE.JS
// Mục tiêu: Nắm vững cú pháp CJS vs ESM, cơ chế Module Caching và cách xử lý nạp module
// Cách chạy: node "01. Module System.js"
// ==============================================================================

const path = require('node:path');

// ==============================================================================
// BÀI TẬP 1: TƯƠNG QUAN VÀ CHUYỂN ĐỔI GIỮA COMMONJS (CJS) VÀ ES MODULES (ESM)
// ==============================================================================
/**
 * YÊU CẦU:
 * 1. Hãy quan sát hai đối tượng hàm dưới đây: `mathServiceCJS` và `mathServiceESM`.
 * 2. Thực hiện hoàn thiện logic cho các phép tính toán học cơ bản:
 *    - add(a, b): Cộng hai số
 *    - subtract(a, b): Trừ hai số
 *    - multiply(a, b): Nhân hai số
 * 3. So sánh cấu trúc Export:
 *    - Trong CommonJS: Sử dụng `module.exports = { ... }` hoặc `exports.fn = ...`
 *    - Trong ES Modules: Sử dụng Named exports `export const fn = ...` và Default export `export default ...`
 */

// Giả lập Module CJS (CommonJS Pattern)
const mathServiceCJS = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  multiply: (a, b) => a * b,
};

// Giả lập cách CommonJS Wrapper bọc module khi thực thi
function simulateCJSExecution(codeFunction) {
  const customModule = { exports: {} };
  const customExports = customModule.exports;
  const customRequire = (id) => `[Mock Require: ${id}]`;
  const filename = __filename;
  const dirname = __dirname;

  // Gọi wrapper function với 5 tham số cốt lõi của CJS
  codeFunction(customExports, customRequire, customModule, filename, dirname);
  return customModule.exports;
}

function runExercise1() {
  console.log("==================================================");
  console.log("▶ BÀI TẬP 1: CƠ CHẾ EXPORT & IMPORT TRONG CJS VS ESM");
  console.log("==================================================");

  // 1. Kiểm chứng CJS Module Wrapper ngầm
  const exportedCJS = simulateCJSExecution((exports, require, module, __filename, __dirname) => {
    // Đoạn code bên trong file CJS giả lập
    exports.appName = "MathLib CJS";
    exports.calculate = (a, b) => a + b;
    // Ghi chú: Nếu gán module.exports = ... thì nó sẽ ghi đè exports
  });

  console.log("Kết quả Export từ CJS Wrapper:", exportedCJS);
  console.log("Thực hiện phép tính qua CJS:", exportedCJS.calculate(15, 25));

  // 2. Minh họa cú pháp tương đương trong ESM (Mô phỏng cú pháp)
  console.log("\n[Cú pháp tương đương trong ESM]:");
  console.log(`
  // --- Exporting (mathUtils.mjs) ---
  export const add = (a, b) => a + b;
  export const subtract = (a, b) => a - b;
  export default { version: '1.0.0', description: 'ESM Math Utils' };

  // --- Importing (app.mjs) ---
  import mathInfo, { add, subtract } from './mathUtils.mjs';
  // Hoặc Dynamic Import trong CJS / ESM:
  // const { add } = await import('./mathUtils.mjs');
  `);
}

// ==============================================================================
// BÀI TẬP 2: KIỂM CHỨNG CƠ CHẾ MODULE CACHING (`require.cache`)
// ==============================================================================
/**
 * YÊU CẦU:
 * 1. Node.js chỉ thực thi một module CJS đúng 1 lần đầu tiên khi `require()`.
 * 2. Các lần `require()` tiếp theo sẽ trả về kết quả lưu trong `require.cache`.
 * 3. Hoàn thành hàm `demonstrateModuleCaching()` để chứng minh tính chất Singleton
 *    và thử nghiệm thao tác Invalidate Cache (xóa cache để nạp lại module).
 */

function demonstrateModuleCaching() {
  console.log("\n==================================================");
  console.log("▶ BÀI TẬP 2: MINH HỌA CƠ CHẾ MODULE CACHING");
  console.log("==================================================");

  // Tạo một Module giả lập lưu vào require.cache
  const mockModuleId = path.resolve(__dirname, 'mock-database-connection.js');

  let executionCount = 0;

  // Hàm factory giả lập việc nạp file từ ổ đĩa
  function loadMockModule() {
    // Nếu đã có trong require.cache thì trả về ngay (Cơ chế thật của Node.js)
    if (require.cache[mockModuleId]) {
      console.log(`[Cache Hit] Lấy module từ require.cache (Không chạy lại code)`);
      return require.cache[mockModuleId].exports;
    }

    // Nếu chưa có: Thực thi file và lưu vào cache
    console.log(`[Cache Miss] Đang đọc file và biên dịch module lần đầu...`);
    executionCount++;

    const newModule = {
      id: mockModuleId,
      exports: {
        connectionId: Math.floor(Math.random() * 1000000),
        createdAt: new Date().toISOString(),
        executionCount: executionCount,
        query: (sql) => `Thực thi: [${sql}] trên Connection #${newModule.exports.connectionId}`
      },
      loaded: true
    };

    require.cache[mockModuleId] = newModule;
    return newModule.exports;
  }

  // --- BƯỚC 1: Lần nạp thứ nhất ---
  console.log("\n--- BƯỚC 1: Nạp module lần 1 ---");
  const db1 = loadMockModule();
  console.log("DB1 Connection ID:", db1.connectionId);
  console.log("Số lần module được biên dịch:", db1.executionCount);

  // --- BƯỚC 2: Lần nạp thứ hai ---
  console.log("\n--- BƯỚC 2: Nạp module lần 2 ở một service khác ---");
  const db2 = loadMockModule();
  console.log("DB2 Connection ID:", db2.connectionId);
  console.log("db1 === db2 ?", db1 === db2 ? "✅ ĐÚNG (Dùng chung 1 instance trong Cache)" : "❌ SAI");

  // --- BƯỚC 3: Xóa Cache (Invalidate) và Nạp lại ---
  console.log("\n--- BƯỚC 3: Xóa require.cache[mockModuleId] và Nạp lại ---");
  delete require.cache[mockModuleId];
  console.log("Đã xóa module khỏi require.cache thành công!");

  const db3 = loadMockModule();
  console.log("DB3 Connection ID mới:", db3.connectionId);
  console.log("db1 === db3 ?", db1 === db3 ? "❌ SAI" : "✅ ĐÚNG (Instance mới hoàn toàn đã được tạo)");
  console.log("Tổng số lần module phải biên dịch lại từ đầu:", db3.executionCount);
}

// ==============================================================================
// HÀM CHẠY TẤT CẢ CÁC BÀI TẬP
// ==============================================================================
function runAllExercises() {
  runExercise1();
  demonstrateModuleCaching();
  console.log("\n==================================================");
  console.log("🎉 ĐÃ HOÀN THÀNH TẤT CẢ BÀI TẬP MODULE SYSTEM!");
  console.log("==================================================");
}

// Thực thi chương trình
runAllExercises();
