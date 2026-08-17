/**
 * ============================================================================
 * BÀI THỰC HÀNH 02: MONGODB ADVANCED MODELING, ESR INDEXING & AGGREGATION PIPELINE
 * Tác giả: Backend Engineering Masterclass
 * Môi trường: Node.js (MongoDB Driver / Mongoose) & mongosh (MongoDB Shell)
 * Mục tiêu:
 *   1. Khởi tạo Schema Validation chặt chẽ ở cấp độ Database với JSON Schema
 *   2. Thiết lập Index chuẩn quy tắc ESR (Equality - Sort - Range) & Benchmark explain()
 *   3. Xây dựng các Aggregation Pipelines phức tạp ($match, $lookup, $group, $facet, $bucket)
 *   4. Triển khai Multi-Document ACID Transactions an toàn với Retry Logic
 * ============================================================================
 */

// Kết nối tới Database (Chạy trong mongosh hoặc import vào Node.js script)
const DB_NAME = "ecommerce_mastery";
const db = typeof connect === "function" ? connect(`mongodb://localhost:27017/${DB_NAME}`) : null;

// ============================================================================
// PHẦN 1: SCHEMA VALIDATION VỚI $jsonSchema (BẢO VỆ TÍNH TOÀN VẸN DỮ LIỆU)
// ============================================================================

// Dọn dẹp collection cũ nếu có
try {
  db.orders.drop();
  db.products.drop();
  db.users.drop();
  db.sessions.drop();
} catch (e) {
  // Bỏ qua lỗi nếu collection chưa tồn tại
}

// 1.1 Tạo Collection Users kèm Schema Validation nghiêm ngặt
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "fullName", "role", "status", "createdAt"],
      properties: {
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          description: "Email phải là định dạng email hợp lệ và bắt buộc."
        },
        fullName: {
          bsonType: "string",
          minLength: 2,
          maxLength: 100,
          description: "Họ tên phải có độ dài từ 2 đến 100 ký tự."
        },
        role: {
          enum: ["CUSTOMER", "VENDOR", "ADMIN"],
          description: "Role chỉ nhận một trong 3 giá trị: CUSTOMER, VENDOR, ADMIN."
        },
        status: {
          enum: ["ACTIVE", "SUSPENDED", "PENDING_VERIFY"],
          description: "Trạng thái người dùng."
        },
        createdAt: {
          bsonType: "date",
          description: "Thời gian khởi tạo tài khoản."
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});

// 1.2 Tạo Collection Products
db.createCollection("products", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["sku", "name", "category", "price", "stockQuantity", "tags"],
      properties: {
        sku: { bsonType: "string" },
        name: { bsonType: "string" },
        category: { bsonType: "string" },
        price: { bsonType: "number", minimum: 0 },
        stockQuantity: { bsonType: "int", minimum: 0 },
        tags: {
          bsonType: "array",
          items: { bsonType: "string" },
          description: "Danh sách tags sản phẩm."
        },
        ratings: {
          bsonType: "object",
          properties: {
            average: { bsonType: "number", minimum: 0, maximum: 5 },
            count: { bsonType: "int", minimum: 0 }
          }
        }
      }
    }
  }
});

// 1.3 Tạo Collection Orders
db.createCollection("orders", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["orderCode", "customerId", "items", "totalAmount", "status", "orderDate"],
      properties: {
        orderCode: { bsonType: "string" },
        customerId: { bsonType: "objectId" },
        items: {
          bsonType: "array",
          minItems: 1,
          items: {
            bsonType: "object",
            required: ["productId", "quantity", "unitPrice"],
            properties: {
              productId: { bsonType: "objectId" },
              quantity: { bsonType: "int", minimum: 1 },
              unitPrice: { bsonType: "number", minimum: 0 }
            }
          }
        },
        totalAmount: { bsonType: "number", minimum: 0 },
        status: {
          enum: ["PENDING", "PROCESSING", "COMPLETED", "CANCELLED", "REFUNDED"]
        },
        orderDate: { bsonType: "date" }
      }
    }
  }
});

// ============================================================================
// PHẦN 2: THIẾT KẾ INDEXING THEO QUY TẮC ESR & CÁC INDEX CHUYÊN BIỆT
// ============================================================================

// 2.1 Indexing Users: Unique Index trên Email (không phân biệt hoa thường với collation)
db.users.createIndex(
  { email: 1 },
  { unique: true, name: "idx_users_unique_email" }
);

// 2.2 TTL Index: Tự động dọn dẹp các phiên đăng nhập hết hạn sau 24h (86400s)
db.sessions.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 86400, name: "idx_sessions_ttl" }
);

// 2.3 Multikey Index: Tăng tốc độ lọc sản phẩm theo tags
db.products.createIndex(
  { tags: 1 },
  { name: "idx_products_tags_multikey" }
);

// 2.4 Text Index: Tìm kiếm Full-Text Search trên tên sản phẩm
db.products.createIndex(
  { name: "text", category: "text" },
  { weights: { name: 10, category: 5 }, name: "idx_products_fulltext" }
);

// 2.5 Compound Index CHUẨN ESR (Equality -> Sort -> Range) trên Collection Orders:
// Nghiệp vụ: Lọc theo status (E), Sắp xếp theo orderDate giảm dần (S), Lọc theo khoảng giá totalAmount (R)
db.orders.createIndex(
  {
    status: 1,       // [E] Equality
    orderDate: -1,   // [S] Sort
    totalAmount: 1   // [R] Range
  },
  { name: "idx_orders_esr_status_date_amount" }
);

// 2.6 Partial Index: Chỉ index các đơn hàng có trạng thái PENDING hoặc PROCESSING
db.orders.createIndex(
  { orderDate: 1 },
  {
    name: "idx_orders_active_partial",
    partialFilterExpression: {
      status: { $in: ["PENDING", "PROCESSING"] }
    }
  }
);

// ============================================================================
// PHẦN 3: NẠP DỮ LIỆU MẪU (DATA SEEDING)
// ============================================================================

// 3.1 Nạp Users
const sampleUsers = [];
for (let i = 1; i <= 100; i++) {
  sampleUsers.push({
    _id: new ObjectId(),
    email: `customer${i}@example.com`,
    fullName: `Nguyen Van ${i}`,
    role: i === 1 ? "ADMIN" : i % 5 === 0 ? "VENDOR" : "CUSTOMER",
    status: "ACTIVE",
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 365) * 86400000)
  });
}
db.users.insertMany(sampleUsers);
const allUsers = db.users.find({}, { _id: 1 }).toArray();

// 3.2 Nạp Products
const categories = ["Laptops", "Smartphones", "Audio", "Accessories", "Gaming"];
const sampleProducts = [];
for (let i = 1; i <= 50; i++) {
  const cat = categories[i % categories.length];
  sampleProducts.push({
    _id: new ObjectId(),
    sku: `SKU-${1000 + i}`,
    name: `${cat} Model Pro ${i}`,
    category: cat,
    price: Math.floor(Math.random() * 1500 + 50),
    stockQuantity: NumberInt(Math.floor(Math.random() * 200 + 10)),
    tags: [cat.toLowerCase(), "bestseller", i % 2 === 0 ? "wireless" : "premium"],
    ratings: {
      average: parseFloat((Math.random() * 2 + 3).toFixed(1)),
      count: NumberInt(Math.floor(Math.random() * 500))
    }
  });
}
db.products.insertMany(sampleProducts);
const allProducts = db.products.find({}, { _id: 1, price: 1 }).toArray();

// 3.3 Nạp Orders
const statuses = ["PENDING", "PROCESSING", "COMPLETED", "CANCELLED", "REFUNDED"];
const sampleOrders = [];
for (let i = 1; i <= 1000; i++) {
  const user = allUsers[Math.floor(Math.random() * allUsers.length)];
  const itemCount = Math.floor(Math.random() * 3) + 1;
  const items = [];
  let total = 0;

  for (let j = 0; j < itemCount; j++) {
    const prod = allProducts[Math.floor(Math.random() * allProducts.length)];
    const qty = Math.floor(Math.random() * 2) + 1;
    items.push({
      productId: prod._id,
      quantity: NumberInt(qty),
      unitPrice: prod.price
    });
    total += prod.price * qty;
  }

  sampleOrders.push({
    orderCode: `ORD-${20260000 + i}`,
    customerId: user._id,
    items: items,
    totalAmount: total,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    orderDate: new Date(Date.now() - Math.floor(Math.random() * 180) * 86400000)
  });
}
db.orders.insertMany(sampleOrders);

// ============================================================================
// PHẦN 4: BENCHMARK VÀ EXPLAIN() PHÂN TÍCH INDEX CHUẨN ESR
// ============================================================================

print("\n--- KIỂM TRA HIỆU NĂNG VỚI EXPLAIN ANALYZE ---");

const explainResult = db.orders.find({
  status: "COMPLETED",
  totalAmount: { $gte: 200, $lte: 1000 }
})
.sort({ orderDate: -1 })
.explain("executionStats");

print("Tên Index sử dụng:", explainResult.queryPlanner.winningPlan.inputStage.indexName || "None");
print("Số Documents trả về (nReturned):", explainResult.executionStats.nReturned);
print("Số Khóa quét qua (totalKeysExamined):", explainResult.executionStats.totalKeysExamined);
print("Số Document đọc từ đĩa/RAM (totalDocsExamined):", explainResult.executionStats.totalDocsExamined);
print("Có bị In-Memory Sort không?:", explainResult.executionStats.executionStages.stage === "SORT" ? "CÓ (XẤU)" : "KHÔNG (TỐI ƯU TUYỆT ĐỐI)");

// ============================================================================
// PHẦN 5: CÁC AGGREGATION PIPELINE PHỨC TẠP TRONG THỰC TẾ
// ============================================================================

// ----------------------------------------------------------------------------
// PIPELINE 1: Báo cáo Doanh thu & Mặt hàng bán chạy theo Danh mục ($match, $unwind, $lookup, $group)
// ----------------------------------------------------------------------------
const revenueReportPipeline = [
  // Bước 1: Lọc các đơn hàng COMPLETED (Sử dụng Index)
  {
    $match: {
      status: "COMPLETED"
    }
  },

  // Bước 2: Bung mảng các sản phẩm bên trong đơn
  {
    $unwind: {
      path: "$items",
      preserveNullAndEmptyArrays: false
    }
  },

  // Bước 3: JOIN với collection products bằng Correlated Subpipeline
  {
    $lookup: {
      from: "products",
      let: { targetProductId: "$items.productId" },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ["$_id", "$$targetProductId"] }
          }
        },
        {
          $project: {
            name: 1,
            category: 1,
            sku: 1
          }
        }
      ],
      as: "productInfo"
    }
  },

  // Bước 4: Chuyển đổi mảng productInfo thành object duy nhất
  {
    $set: {
      product: { $arrayElemAt: ["$productInfo", 0] }
    }
  },

  // Bước 5: Nhóm theo Danh mục và tính tổng doanh thu, số lượng bán
  {
    $group: {
      _id: "$product.category",
      totalRevenue: {
        $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] }
      },
      totalQuantitySold: { $sum: "$items.quantity" },
      distinctOrdersCount: { $addToSet: "$_id" },
      avgItemPrice: { $avg: "$items.unitPrice" }
    }
  },

  // Bước 6: Định dạng kết quả hiển thị
  {
    $project: {
      category: "$_id",
      _id: 0,
      totalRevenue: { $round: ["$totalRevenue", 2] },
      totalQuantitySold: 1,
      orderCount: { $size: "$distinctOrdersCount" },
      avgItemPrice: { $round: ["$avgItemPrice", 2] }
    }
  },

  // Bước 7: Sắp xếp danh mục mang lại doanh thu cao nhất lên đầu
  {
    $sort: { totalRevenue: -1 }
  }
];

print("\n--- KẾT QUẢ BÁO CÁO DOANH THU THEO DANH MỤC ---");
printjson(db.orders.aggregate(revenueReportPipeline).toArray());

// ----------------------------------------------------------------------------
// PIPELINE 2: Tìm kiếm Phân trang đa chiều kết hợp Thống kê Facet ($facet, $bucket)
// Giải quyết bài toán: Trả về danh sách đơn hàng trang 1 VÀ thống kê trạng thái + phân bố khoảng giá trong 1 round-trip
// ----------------------------------------------------------------------------
const multiFacetedDashboardPipeline = [
  {
    $match: {
      orderDate: { $gte: new Date(Date.now() - 90 * 86400000) } // 90 ngày gần nhất
    }
  },
  {
    $facet: {
      // Nhánh 1: Dữ liệu phân trang đơn hàng (Paginated Data)
      paginatedOrders: [
        { $sort: { orderDate: -1 } },
        { $skip: 0 },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "customerId",
            foreignField: "_id",
            as: "customer"
          }
        },
        {
          $project: {
            orderCode: 1,
            totalAmount: 1,
            status: 1,
            orderDate: 1,
            customerEmail: { $arrayElemAt: ["$customer.email", 0] }
          }
        }
      ],

      // Nhánh 2: Tổng số lượng đơn hàng khớp bộ lọc (Pagination Metadata)
      totalCount: [
        { $count: "count" }
      ],

      // Nhánh 3: Thống kê số lượng đơn theo từng trạng thái (Status Breakdown)
      statusBreakdown: [
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalValue: { $sum: "$totalAmount" }
          }
        }
      ],

      // Nhánh 4: Phân bố đơn hàng theo dải giá trị ($bucket)
      priceBuckets: [
        {
          $bucket: {
            groupBy: "$totalAmount",
            boundaries: [0, 200, 500, 1000, 3000],
            default: "Other",
            output: {
              count: { $sum: 1 },
              orders: { $push: "$orderCode" }
            }
          }
        }
      ]
    }
  }
];

print("\n--- KẾT QUẢ DASHBOARD PHÂN TRANG ĐA CHIỀU ($FACET) ---");
printjson(db.orders.aggregate(multiFacetedDashboardPipeline).toArray());

// ============================================================================
// PHẦN 6: MULTI-DOCUMENT ACID TRANSACTION VỚI RETRY LOGIC (NODE.JS CLIENT)
// ============================================================================

/**
 * Hàm mẫu triển khai trong ứng dụng Node.js Backend xử lý Đặt hàng & Trừ kho an toàn
 * @param {import('mongodb').MongoClient} client 
 * @param {Object} orderPayload 
 */
async function placeOrderTransactionExample(client, orderPayload) {
  const session = client.startSession();

  // Transaction Options
  const transactionOptions = {
    readPreference: 'primary',
    readConcern: { level: 'snapshot' },
    writeConcern: { w: 'majority', j: true }
  };

  try {
    // Sử dụng withTransaction: Tự động retry khi gặp lỗi TransientTransactionError
    const transactionResult = await session.withTransaction(async () => {
      const dbInstance = client.db(DB_NAME);
      const productsColl = dbInstance.collection("products");
      const ordersColl = dbInstance.collection("orders");

      // 1. Kiểm tra và trừ tồn kho các mặt hàng (Atomic conditional update)
      for (const item of orderPayload.items) {
        const updateRes = await productsColl.updateOne(
          {
            _id: item.productId,
            stockQuantity: { $gte: item.quantity } // Điều kiện kho còn đủ
          },
          {
            $inc: { stockQuantity: -item.quantity }
          },
          { session }
        );

        if (updateRes.matchedCount === 0) {
          // Bắn exception để session tự động ROLLBACK toàn bộ thao tác trước đó
          throw new Error(`Sản phẩm [ID: ${item.productId}] không đủ số lượng tồn kho!`);
        }
      }

      // 2. Tạo bản ghi đơn hàng
      const insertedOrder = await ordersColl.insertOne(
        {
          orderCode: `ORD-${Date.now()}`,
          customerId: orderPayload.customerId,
          items: orderPayload.items,
          totalAmount: orderPayload.totalAmount,
          status: "PENDING",
          orderDate: new Date()
        },
        { session }
      );

      return {
        success: true,
        orderId: insertedOrder.insertedId
      };
    }, transactionOptions);

    console.log("Giao dịch đặt hàng thành công:", transactionResult);
    return transactionResult;

  } catch (error) {
    console.error("Giao dịch bị hủy bỏ (Rollback hoàn toàn):", error.message);
    throw error;
  } finally {
    await session.endSession();
  }
}
