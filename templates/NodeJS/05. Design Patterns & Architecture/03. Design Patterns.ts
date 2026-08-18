// Bài tập 03: Creational & Structural Design Patterns in Backend
// Yêu cầu: Viết một Singleton class quản lý Connection Pool cơ sở dữ liệu giả lập.

// 1. Viết Class `DbConnectionPool` áp dụng Singleton Pattern:
// - Có thuộc tính static private `instance`.
// - Khóa constructor bằng `private`.
// - Phương thức static `getInstance()` trả về thực thể duy nhất của Class.
// - Phương thức `connect()` in ra: "Connecting to database with pool size 10...".

class DbConnectionPool {
  // Hoàn thành Class Singleton tại đây
}

// Kiểm chứng:
// const pool1 = DbConnectionPool.getInstance();
// const pool2 = DbConnectionPool.getInstance();
// console.log(pool1 === pool2); // Phải in ra: true
