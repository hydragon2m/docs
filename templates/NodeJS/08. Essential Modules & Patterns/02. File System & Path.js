// ==============================================================================
// BÀI TẬP THỰC HÀNH: FILE SYSTEM & PATH TRONG NODE.JS
// Mục tiêu: Thành thạo fs.promises, xử lý lỗi hệ thống ENOENT, quét thư mục đệ quy và path
// Cách chạy: node "02. File System & Path.js"
// ==============================================================================

const fs = require('node:fs/promises');
const path = require('node:path');

// Thư mục tạm dùng cho bài thực hành
const PRACTICE_DIR = path.resolve(__dirname, 'sandbox_fs_practice');

// ==============================================================================
// BÀI TẬP 1: ĐỌC VÀ GHI FILE AN TOÀN VỚI FS.PROMISES & BẮT LỖI ENOENT
// ==============================================================================
/**
 * YÊU CẦU:
 * 1. Hoàn thành hàm `safeReadFile(filePath)`:
 *    - Sử dụng `fs.readFile` với encoding 'utf-8'.
 *    - Bắt lỗi bằng khối `try...catch`.
 *    - Nếu file chưa tồn tại (mã lỗi 'ENOENT'), in ra thông báo cảnh báo và trả về `null`.
 *    - Nếu là lỗi khác (như quyền truy cập EACCES), ném lỗi (throw err).
 * 2. Viết hàm `setupPracticeFiles()` để tạo file văn bản mẫu và kiểm tra việc đọc file.
 */

async function safeReadFile(filePath) {
  try {
    const data = await fs.readFile(filePath, { encoding: 'utf-8' });
    return data;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`⚠️ [CẢNH BÁO ENOENT] Tệp tin không tồn tại: "${filePath}"`);
      return null;
    }
    // Ném lại các lỗi nghiêm trọng khác (EACCES, EPERM, ...)
    throw error;
  }
}

async function runExercise1() {
  console.log("==================================================");
  console.log("▶ BÀI TẬP 1: ĐỌC FILE BẤT ĐỒNG BỘ VỚI FS.PROMISES");
  console.log("==================================================");

  // 1. Tạo thư mục làm việc thực hành nếu chưa có
  await fs.mkdir(PRACTICE_DIR, { recursive: true });

  const sampleFilePath = path.join(PRACTICE_DIR, 'sample.txt');
  const sampleContent = `Xin chào! Đây là bài thực hành Node.js File System.\nThời gian tạo: ${new Date().toLocaleString()}`;

  // 2. Ghi file mẫu
  await fs.writeFile(sampleFilePath, sampleContent, { encoding: 'utf-8' });
  console.log(`✅ Đã tạo file mẫu tại: ${sampleFilePath}`);

  // 3. Đọc file tồn tại
  console.log("\n--- Thử nghiệm 1: Đọc file tồn tại ---");
  const content = await safeReadFile(sampleFilePath);
  console.log("Nội dung đọc được:\n" + content);

  // 4. Thử nghiệm đọc file không tồn tại để kiểm chứng bắt lỗi ENOENT
  console.log("\n--- Thử nghiệm 2: Đọc file không tồn tại ---");
  const missingPath = path.join(PRACTICE_DIR, 'khong-ton-tai.txt');
  const missingResult = await safeReadFile(missingPath);
  console.log("Kết quả trả về khi gặp lỗi ENOENT:", missingResult);
}

// ==============================================================================
// BÀI TẬP 2: DUYỆT ĐỆ QUY TẤT CẢ CÁC TỆP TRONG THƯ MỤC (RECURSIVE DIRECTORY SCAN)
// ==============================================================================
/**
 * YÊU CẦU:
 * 1. Hoàn thành hàm `scanFilesRecursively(dirPath)`:
 *    - Sử dụng `fs.readdir(dirPath, { withFileTypes: true })`.
 *    - Duyệt qua từng mục:
 *      - Nếu là Directory (`dirent.isDirectory()`): Gọi đệ quy vào thư mục con đó.
 *      - Nếu là File (`dirent.isFile()`): Lấy thông tin kích thước bằng `fs.stat()` 
 *        và lưu đường dẫn tuyệt đối kèm kích thước vào mảng kết quả.
 * 2. Trả về mảng danh sách toàn bộ các file trong cây thư mục.
 */

async function scanFilesRecursively(dirPath) {
  let fileList = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Duyệt đệ quy vào thư mục con
        const nestedFiles = await scanFilesRecursively(fullPath);
        fileList = fileList.concat(nestedFiles);
      } else if (entry.isFile()) {
        // Lấy thông tin tệp
        const stats = await fs.stat(fullPath);
        fileList.push({
          fileName: entry.name,
          fullPath: fullPath,
          sizeBytes: stats.size,
          extension: path.extname(entry.name)
        });
      }
    }
  } catch (error) {
    console.error(`Lỗi khi quét thư mục ${dirPath}:`, error.message);
  }

  return fileList;
}

async function runExercise2() {
  console.log("\n==================================================");
  console.log("▶ BÀI TẬP 2: DUYỆT CÂY THƯ MỤC ĐỆ QUY");
  console.log("==================================================");

  // 1. Tạo cấu trúc thư mục lồng nhau phức tạp để kiểm thử
  const nestedDir1 = path.join(PRACTICE_DIR, 'configs');
  const nestedDir2 = path.join(PRACTICE_DIR, 'logs', '2026', '08');
  await fs.mkdir(nestedDir1, { recursive: true });
  await fs.mkdir(nestedDir2, { recursive: true });

  // 2. Tạo một số file rải rác trong các thư mục
  await fs.writeFile(path.join(nestedDir1, 'app.json'), JSON.stringify({ port: 3000, env: 'dev' }, null, 2));
  await fs.writeFile(path.join(nestedDir2, 'server.log'), '[INFO] Server started\n[INFO] Connected to DB\n');
  await fs.writeFile(path.join(PRACTICE_DIR, 'README.md'), '# Thư mục thực hành File System');

  console.log(`Đã tạo cấu trúc cây thư mục mẫu tại: ${PRACTICE_DIR}`);

  // 3. Tiến hành quét đệ quy
  console.log("\n--- Bắt đầu quét đệ quy cây thư mục ---");
  const allFiles = await scanFilesRecursively(PRACTICE_DIR);

  console.log(`\n🎉 Đã tìm thấy tổng cộng ${allFiles.length} tệp tin:`);
  allFiles.forEach((file, index) => {
    console.log(`  ${index + 1}. [${file.extension || 'none'}] ${file.fileName} (${file.sizeBytes} bytes)`);
    console.log(`     Đường dẫn: ${file.fullPath}`);
  });

  // 4. Dọn dẹp thư mục tạm sau khi hoàn tất
  console.log("\n--- Dọn dẹp thư mục tạm (Clean up) ---");
  await fs.rm(PRACTICE_DIR, { recursive: true, force: true });
  console.log("✅ Đã dọn dẹp sạch sẽ sandbox_fs_practice!");
}

// ==============================================================================
// HÀM ĐIỀU PHỐI TOÀN BỘ CHƯƠNG TRÌNH THỰC HÀNH
// ==============================================================================
async function main() {
  try {
    await runExercise1();
    await runExercise2();
    console.log("\n==================================================");
    console.log("🏆 CHÚC MỪNG BẠN ĐÃ HOÀN THÀNH TOÀN BỘ BÀI THỰC HÀNH!");
    console.log("==================================================");
  } catch (error) {
    console.error("❌ Có lỗi xảy ra trong quá trình chạy thực hành:", error);
  }
}

// Chạy bài thực hành
main();
