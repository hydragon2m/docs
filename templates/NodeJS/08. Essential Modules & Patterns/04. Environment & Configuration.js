// Bài tập 04: Environment & Configuration (Quản lý cấu hình & Biến môi trường)
// Yêu cầu: Xây dựng hàm kiểm tra (Validation) cấu hình lúc khởi động (Fail-Fast) và đóng gói Config Module tập trung.

// ============================================================================
// BÀI TẬP 1: Viết hàm Validation biến môi trường bắt buộc (Startup Fail-Fast)
// ============================================================================
// Yêu cầu:
// 1. Viết hàm `validateEnvironment(env = process.env)`:
//    - Kiểm tra danh sách các biến môi trường bắt buộc:
//        + `DATABASE_URL`: Bắt buộc phải có, không được là chuỗi rỗng.
//        + `JWT_SECRET`: Bắt buộc phải có, và độ dài chuỗi tối thiểu phải từ 32 ký tự.
//        + `PORT`: Nếu có thì phải là số hợp lệ nằm trong khoảng 1024 - 65535 (nếu không có thì gán mặc định 3000).
// 2. Nếu thiếu bất kỳ biến nào hoặc giá trị không hợp lệ:
//    - Gom tất cả các lỗi thành một mảng `missingOrInvalidKeys`.
//    - Ném (throw) ra một `Error` kèm thông điệp chi tiết liệt kê tất cả các lỗi để ứng dụng dừng ngay lập tức (Fail Fast).
// 3. Nếu hợp lệ, trả về `true`.

function validateEnvironment(env = process.env) {
  const errors = [];

  // 1. Kiểm tra DATABASE_URL
  if (!env.DATABASE_URL || typeof env.DATABASE_URL !== 'string' || env.DATABASE_URL.trim() === '') {
    errors.push('Thiếu biến môi trường bắt buộc: DATABASE_URL');
  }

  // 2. Kiểm tra JWT_SECRET
  if (!env.JWT_SECRET || typeof env.JWT_SECRET !== 'string') {
    errors.push('Thiếu biến môi trường bắt buộc: JWT_SECRET');
  } else if (env.JWT_SECRET.length < 32) {
    errors.push(`JWT_SECRET quá ngắn (${env.JWT_SECRET.length} ký tự). Độ dài tối thiểu phải là 32 ký tự.`);
  }

  // 3. Kiểm tra PORT (nếu có cung cấp)
  if (env.PORT !== undefined && env.PORT !== '') {
    const portNum = Number(env.PORT);
    if (isNaN(portNum) || portNum < 1024 || portNum > 65535) {
      errors.push(`PORT không hợp lệ: ${env.PORT}. PORT phải là số nguyên trong khoảng 1024 - 65535.`);
    }
  }

  // Nếu có lỗi -> Fail Fast
  if (errors.length > 0) {
    throw new Error(`[LỖI CẤU HÌNH KHỞI ĐỘNG]:\n - ${errors.join('\n - ')}`);
  }

  return true;
}

// ============================================================================
// BÀI TẬP 2: Thiết kế Config Module tập trung (Single Source of Truth)
// ============================================================================
// Yêu cầu:
// 1. Viết hàm `loadConfig(env = process.env)`:
//    - Gọi hàm `validateEnvironment(env)` trước tiên để đảm bảo tính hợp lệ.
//    - Ép kiểu dữ liệu (Type Casting) chính xác:
//        + `port`: Chuyển sang kiểu Number (mặc định 3000 nếu không có).
//        + `isProduction`: Boolean (`NODE_ENV === 'production'`).
//        + `enableNotification`: Chuyển chuỗi "true" sang Boolean `true`, còn lại là `false`.
//    - Trả về đối tượng config được cấu trúc phân cấp:
//        {
//          env: string,
//          isProduction: boolean,
//          server: { port: number },
//          db: { url: string },
//          auth: { jwtSecret: string, expiresIn: string },
//          features: { enableNotification: boolean }
//        }
//    - Sử dụng `Object.freeze()` để bảo vệ config khỏi bị chỉnh sửa runtime.

function loadConfig(env = process.env) {
  // Bước 1: Validate Fail-Fast
  validateEnvironment(env);

  // Bước 2: Ép kiểu và đóng gói
  const config = {
    env: env.NODE_ENV || 'development',
    isProduction: env.NODE_ENV === 'production',
    server: {
      port: env.PORT ? Number(env.PORT) : 3000,
    },
    db: {
      url: env.DATABASE_URL,
    },
    auth: {
      jwtSecret: env.JWT_SECRET,
      expiresIn: env.JWT_EXPIRES_IN || '15m',
    },
    features: {
      enableNotification: env.ENABLE_NOTIFICATION === 'true',
    },
  };

  // Bước 3: Đóng băng bất biến (Immutability)
  Object.freeze(config);
  Object.freeze(config.server);
  Object.freeze(config.db);
  Object.freeze(config.auth);
  Object.freeze(config.features);

  return config;
}

// ============================================================================
// KIỂM TRA MÃ NGUỒN (TEST RUN)
// ============================================================================
if (require.main === module) {
  console.log('--- TEST 1: Kiểm tra trường hợp thiếu biến môi trường (Fail Fast) ---');
  try {
    const invalidEnv = {
      NODE_ENV: 'development',
      PORT: 'invalid_port',
      // Thiếu DATABASE_URL và JWT_SECRET
    };
    validateEnvironment(invalidEnv);
  } catch (err) {
    console.log('✅ Bắt lỗi thành công khi thiếu config:');
    console.log(err.message);
  }

  console.log('\n--- TEST 2: Nạp cấu hình hợp lệ và kiểm tra ép kiểu ---');
  const validMockEnv = {
    NODE_ENV: 'production',
    PORT: '8080',
    DATABASE_URL: 'postgres://admin:secret@db.production.internal:5432/core_db',
    JWT_SECRET: 'this_is_a_very_secure_and_long_jwt_secret_key_32_chars',
    JWT_EXPIRES_IN: '1h',
    ENABLE_NOTIFICATION: 'true',
  };

  const appConfig = loadConfig(validMockEnv);
  console.log('Config Object:', appConfig);
  console.log('Port Type:', typeof appConfig.server.port, '(Giá trị:', appConfig.server.port, ')');
  console.log('Is Production:', appConfig.isProduction);
  console.log('Enable Notification Type:', typeof appConfig.features.enableNotification, '(Giá trị:', appConfig.features.enableNotification, ')');

  console.log('\n--- TEST 3: Kiểm tra tính bất biến (Object.freeze) ---');
  try {
    appConfig.server.port = 9999; // Thử sửa port
  } catch (e) {
    // Trong strict mode sẽ quăng error
  }
  console.log('Port sau khi cố tình sửa:', appConfig.server.port); // Vẫn là 8080

  console.log('\n✅ Hoàn thành kiểm tra bài tập 04!');
}

module.exports = {
  validateEnvironment,
  loadConfig,
};
