-- ============================================================================
-- BÀI THỰC HÀNH 01: POSTGRESQL DEEP DIVE, INDEXING, TRANSACTIONS & EXPLAIN
-- Tác giả: Backend Engineering Masterclass
-- Mục tiêu: 
--   1. Thiết kế Schema chuẩn Production với đầy đủ các loại Index nâng cao
--   2. Mô phỏng và phân tích chi tiết Transaction Isolation Levels & Khóa (Locks)
--   3. Benchmark và đọc hiểu Execution Plan bằng EXPLAIN (ANALYZE, BUFFERS)
--   4. Tối ưu triệt để bài toán N+1 Query bằng SQL Aggregation & Lateral Join
-- ============================================================================

-- Dọn dẹp schema cũ nếu tồn tại
DROP SCHEMA IF EXISTS practice_pg CASCADE;
CREATE SCHEMA practice_pg;
SET search_path TO practice_pg, public;

-- ============================================================================
-- PHẦN 1: THIẾT KẾ SCHEMA VÀ CÁC CHIẾN LƯỢC INDEXING CHUYÊN SÂU
-- ============================================================================

-- 1.1 Bảng Khách hàng (Customers)
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    tier VARCHAR(20) NOT NULL DEFAULT 'STANDARD', -- STANDARD, VIP, PLATINUM
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.2 Bảng Danh mục Sản phẩm (Categories)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE
);

-- 1.3 Bảng Sản phẩm (Products)
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    category_id INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    attributes JSONB, -- Lưu các thông số kỹ thuật động: { "ram": "16GB", "color": "black" }
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.4 Bảng Đơn hàng (Orders)
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_code VARCHAR(32) NOT NULL UNIQUE,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED
    shipping_address JSONB NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 1.5 Bảng Chi tiết Đơn hàng (Order Items)
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- 1.6 Bảng Hàng đợi Tác vụ (Task Queue - Demo Explicit Row Locking)
CREATE TABLE task_queue (
    id BIGSERIAL PRIMARY KEY,
    task_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'QUEUED', -- QUEUED, PROCESSING, COMPLETED, FAILED
    attempts INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- ============================================================================
-- PHẦN 2: THIẾT LẬP CÁC LOẠI INDEX CHUYÊN BIỆT (INDEXING STRATEGIES)
-- ============================================================================

-- [1] Expression Index: Đảm bảo tra cứu email không phân biệt hoa thường với tốc độ tối đa
CREATE UNIQUE INDEX idx_customers_lower_email 
ON customers (LOWER(email));

-- [2] Composite Index (Đa cột) tuân thủ Leftmost Prefix: Phục vụ tra cứu danh mục & khoảng giá
CREATE INDEX idx_products_category_price 
ON products (category_id, price);

-- [3] Partial Index (Chỉ mục một phần): Chỉ index các sản phẩm chưa bị xóa mềm (is_deleted = false)
-- Tiết kiệm không gian RAM và tăng tốc độ Index Maintenance khi chèn mới
CREATE INDEX idx_products_active_stock 
ON products (stock_quantity) 
WHERE is_deleted = FALSE;

-- [4] GIN Index (Generalized Inverted Index) trên JSONB:
-- Tăng tốc độ truy vấn chứa thuộc tính JSONB (toán tử @>, ?, ?&)
CREATE INDEX idx_products_attributes_gin 
ON products USING GIN (attributes jsonb_path_ops);

-- [5] Covering Index (Sử dụng mệnh đề INCLUDE):
-- Cho phép Index Only Scan để lấy tổng tiền và trạng thái mà không cần chạm vào Heap Table
CREATE INDEX idx_orders_customer_covering 
ON orders (customer_id, created_at DESC) 
INCLUDE (total_amount, status);

-- [6] Partial Index cho Đơn hàng chờ xử lý (Hot Data):
CREATE INDEX idx_orders_pending_processing 
ON orders (created_at) 
WHERE status IN ('PENDING', 'PROCESSING');

-- ============================================================================
-- PHẦN 3: NẠP DỮ LIỆU MẪU MÔ PHỎNG QUY MÔ LỚN (DATA SEEDING)
-- ============================================================================

-- 3.1 Nạp danh mục
INSERT INTO categories (name, slug) VALUES 
('Electronics', 'electronics'),
('Laptops', 'laptops'),
('Smartphones', 'smartphones'),
('Accessories', 'accessories'),
('Home Appliances', 'home-appliances');

-- 3.2 Nạp 50,000 khách hàng mẫu
INSERT INTO customers (email, full_name, tier, is_active, metadata, created_at)
SELECT 
    'user_' || i || '@example.com',
    'Customer Name ' || i,
    (ARRAY['STANDARD', 'VIP', 'PLATINUM'])[floor(random() * 3 + 1)],
    (random() > 0.1), -- 90% active
    jsonb_build_object('preferred_lang', 'vi', 'device', (ARRAY['ios', 'android', 'web'])[floor(random() * 3 + 1)]),
    NOW() - (random() * 730 || ' days')::INTERVAL
FROM generate_series(1, 50000) AS i;

-- 3.3 Nạp 10,000 sản phẩm với thuộc tính JSONB phong phú
INSERT INTO products (category_id, sku, name, price, stock_quantity, attributes, is_deleted, created_at)
SELECT 
    floor(random() * 5 + 1)::INT,
    'SKU-' || lpad(i::TEXT, 8, '0'),
    'Product Title ' || i,
    (random() * 2000 + 10)::NUMERIC(12, 2),
    floor(random() * 500)::INT,
    jsonb_build_object(
        'brand', (ARRAY['Apple', 'Samsung', 'Sony', 'Asus', 'Dell'])[floor(random() * 5 + 1)],
        'color', (ARRAY['Black', 'Silver', 'Blue', 'White'])[floor(random() * 4 + 1)],
        'warranty_months', (ARRAY[12, 24, 36])[floor(random() * 3 + 1)]
    ),
    (random() < 0.05), -- 5% bị xóa mềm
    NOW() - (random() * 365 || ' days')::INTERVAL
FROM generate_series(1, 10000) AS i;

-- 3.4 Nạp 200,000 đơn hàng mẫu
INSERT INTO orders (customer_id, order_code, total_amount, status, shipping_address, payment_method, created_at)
SELECT 
    floor(random() * 50000 + 1)::BIGINT,
    'ORD-' || to_char(NOW(), 'YYYYMMDD') || '-' || lpad(i::TEXT, 8, '0'),
    (random() * 3000 + 50)::NUMERIC(14, 2),
    (ARRAY['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])[floor(random() * 5 + 1)],
    jsonb_build_object('city', 'Hanoi', 'district', 'Cau Giay', 'street', 'Duy Tan'),
    (ARRAY['COD', 'CREDIT_CARD', 'VNPAY', 'MOMO'])[floor(random() * 4 + 1)],
    NOW() - (random() * 180 || ' days')::INTERVAL
FROM generate_series(1, 200000) AS i;

-- 3.5 Nạp 500,000 chi tiết đơn hàng (Order Items)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT 
    floor(random() * 200000 + 1)::BIGINT,
    floor(random() * 10000 + 1)::BIGINT,
    floor(random() * 5 + 1)::INT,
    (random() * 500 + 20)::NUMERIC(12, 2)
FROM generate_series(1, 500000) AS i;

-- Cập nhật thống kê System Catalogs để Query Planner có dữ liệu chuẩn xác nhất
VACUUM ANALYZE customers;
VACUUM ANALYZE products;
VACUUM ANALYZE orders;
VACUUM ANALYZE order_items;

-- ============================================================================
-- PHẦN 4: BENCHMARK VÀ ĐỌC HIỂU EXECUTION PLAN VỚI EXPLAIN ANALYZE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Test 4.1: So sánh Sequential Scan vs Covering Index Only Scan
-- ----------------------------------------------------------------------------

-- [Truy vấn A] Lấy 10 đơn hàng gần nhất của khách hàng (Tận dụng Covering Index)
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, COSTS)
SELECT customer_id, created_at, total_amount, status 
FROM orders
WHERE customer_id = 12345
ORDER BY created_at DESC
LIMIT 10;

-- Nhận xét: Xem kế hoạch thấy "Index Only Scan using idx_orders_customer_covering".
-- Heap Fetches = 0 vì toàn bộ các cột cần SELECT đã nằm trong Leaf Node của Index!

-- ----------------------------------------------------------------------------
-- Test 4.2: Truy vấn JSONB với GIN Index
-- ----------------------------------------------------------------------------

-- Tìm tất cả sản phẩm thuộc hãng Apple và có màu 'Black'
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, sku, name, attributes 
FROM products
WHERE attributes @> '{"brand": "Apple", "color": "Black"}';

-- Nhận xét: Query Planner sử dụng "Bitmap Index Scan on idx_products_attributes_gin"
-- Bitmap quét cực nhanh qua mảng bit đảo ngược của GIN.

-- ----------------------------------------------------------------------------
-- Test 4.3: So sánh Partial Index vs Full Index
-- ----------------------------------------------------------------------------

-- Tìm các đơn hàng PENDING tạo trong 7 ngày gần đây
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, order_code, created_at 
FROM orders
WHERE status = 'PENDING' 
  AND created_at >= NOW() - INTERVAL '7 days';

-- Nhận xét: Sử dụng "Bitmap Index Scan on idx_orders_pending_processing".
-- Index này chỉ chứa khoảng 20% dữ liệu của bảng, giúp tiết kiệm bộ nhớ RAM Shared Buffers.

-- ============================================================================
-- PHẦN 5: TRANSACTION ISOLATION LEVELS & ROW LOCKING
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Test 5.1: Mô phỏng Non-Repeatable Read trong Read Committed vs Repeatable Read
-- ----------------------------------------------------------------------------

-- [SESSION 1 - READ COMMITTED (Mặc định)]:
-- BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
-- SELECT total_amount FROM orders WHERE id = 100; -- Kết quả ví dụ: 500.00
-- 
-- -- [SESSION 2 chạy đồng thời]:
-- -- UPDATE orders SET total_amount = 999.00 WHERE id = 100;
-- -- COMMIT;
-- 
-- -- [SESSION 1 đọc lại trong cùng transaction]:
-- SELECT total_amount FROM orders WHERE id = 100; -- Kết quả biến thành: 999.00 (Non-repeatable Read!)
-- COMMIT;

-- [SESSION 1 - REPEATABLE READ (Snapshot per Transaction)]:
-- BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
-- SELECT total_amount FROM orders WHERE id = 100; -- Kết quả: 999.00
-- 
-- -- [SESSION 2 chạy đồng thời]:
-- -- UPDATE orders SET total_amount = 1200.00 WHERE id = 100;
-- -- COMMIT;
-- 
-- -- [SESSION 1 đọc lại]:
-- SELECT total_amount FROM orders WHERE id = 100; -- Vẫn giữ nguyên: 999.00 (Bảo toàn tính lặp lại!)
-- COMMIT;

-- ----------------------------------------------------------------------------
-- Test 5.2: Xử lý Hàng đợi Job với SELECT ... FOR UPDATE SKIP LOCKED (Safe Concurrency)
-- ----------------------------------------------------------------------------

-- Nạp 5 tác vụ vào queue
INSERT INTO task_queue (task_type, payload) VALUES 
('SEND_WELCOME_EMAIL', '{"userId": 101}'),
('GENERATE_INVOICE', '{"orderId": 5001}'),
('SYNC_INVENTORY', '{"productId": 204}'),
('PUSH_NOTIFICATION', '{"userId": 102}'),
('CLEANUP_TEMP_FILES', '{"folder": "tmp"}');

-- Worker 1 lấy 2 jobs để xử lý đồng thời mà không bao giờ bị nghẽn (Lock Contention):
BEGIN;
SELECT id, task_type, payload 
FROM task_queue
WHERE status = 'QUEUED'
ORDER BY id ASC
LIMIT 2
FOR UPDATE SKIP LOCKED;

-- Giả lập cập nhật trạng thái đang xử lý
UPDATE task_queue 
SET status = 'PROCESSING', attempts = attempts + 1 
WHERE id IN (1, 2);

COMMIT;

-- ============================================================================
-- PHẦN 6: GIẢI QUYẾT TRIỆT ĐỂ VẤN ĐỀ N+1 QUERY BẰNG CÁC KỸ THUẬT SQL NÂNG CAO
-- ============================================================================

-- BÀI TOÁN NGHIỆP VỤ:
-- Lấy thông tin 10 khách hàng VIP cùng toàn bộ danh sách 3 đơn hàng gần nhất của họ
-- (bao gồm cả mã đơn, tổng tiền, ngày tạo và danh sách mặt hàng bên trong).

-- ----------------------------------------------------------------------------
-- Cách tiếp cận TỆ (N+1 Query Pattern):
-- Thường do ORM thực hiện:
-- 1 Query lấy Customers -> N Query lấy Orders -> N*M Query lấy Order Items
-- Tổng cộng tốn: 1 + 10 + 30 = 41 Round-trips mạng!
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- GIẢI PHÁP 1: Sử dụng LEFT JOIN LATERAL kết hợp JSON Aggregation
-- (Chỉ mất đúng 1 Single Query - Tối ưu 100% Round-trip)
-- ----------------------------------------------------------------------------
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
    c.id AS customer_id,
    c.full_name,
    c.email,
    c.tier,
    COALESCE(o.recent_orders, '[]'::json) AS recent_orders
FROM (
    SELECT id, full_name, email, tier 
    FROM customers 
    WHERE tier = 'VIP' AND is_active = TRUE 
    ORDER BY id ASC 
    LIMIT 10
) c
LEFT JOIN LATERAL (
    SELECT json_agg(
        json_build_object(
            'order_id', ord.id,
            'order_code', ord.order_code,
            'total_amount', ord.total_amount,
            'status', ord.status,
            'created_at', ord.created_at,
            'items', ord.items
        ) ORDER BY ord.created_at DESC
    ) AS recent_orders
    FROM (
        SELECT 
            o_sub.id,
            o_sub.order_code,
            o_sub.total_amount,
            o_sub.status,
            o_sub.created_at,
            COALESCE(
                (
                    SELECT json_agg(
                        json_build_object(
                            'product_name', p.name,
                            'quantity', oi.quantity,
                            'unit_price', oi.unit_price,
                            'subtotal', oi.subtotal
                        )
                    )
                    FROM order_items oi
                    JOIN products p ON p.id = oi.product_id
                    WHERE oi.order_id = o_sub.id
                ), '[]'::json
            ) AS items
        FROM orders o_sub
        WHERE o_sub.customer_id = c.id
        ORDER BY o_sub.created_at DESC
        LIMIT 3
    ) ord
) o ON TRUE;

-- ----------------------------------------------------------------------------
-- GIẢI PHÁP 2: Sử dụng Common Table Expressions (CTE) & Window Functions (ROW_NUMBER)
-- ----------------------------------------------------------------------------
EXPLAIN (ANALYZE, BUFFERS)
WITH TargetCustomers AS (
    SELECT id, full_name, email, tier 
    FROM customers 
    WHERE tier = 'VIP' AND is_active = TRUE 
    ORDER BY id ASC 
    LIMIT 10
),
RankedOrders AS (
    SELECT 
        o.id AS order_id,
        o.customer_id,
        o.order_code,
        o.total_amount,
        o.status,
        o.created_at,
        ROW_NUMBER() OVER (PARTITION BY o.customer_id ORDER BY o.created_at DESC) AS rn
    FROM orders o
    WHERE o.customer_id IN (SELECT id FROM TargetCustomers)
),
TopOrders AS (
    SELECT * FROM RankedOrders WHERE rn <= 3
),
OrderItemsAgg AS (
    SELECT 
        oi.order_id,
        json_agg(
            json_build_object(
                'product_name', p.name,
                'quantity', oi.quantity,
                'unit_price', oi.unit_price,
                'subtotal', oi.subtotal
            )
        ) AS items_json
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id IN (SELECT order_id FROM TopOrders)
    GROUP BY oi.order_id
)
SELECT 
    tc.id AS customer_id,
    tc.full_name,
    tc.email,
    tc.tier,
    COALESCE(
        json_agg(
            json_build_object(
                'order_id', tord.order_id,
                'order_code', tord.order_code,
                'total_amount', tord.total_amount,
                'status', tord.status,
                'created_at', tord.created_at,
                'items', COALESCE(oia.items_json, '[]'::json)
            )
        ) FILTER (WHERE tord.order_id IS NOT NULL), '[]'::json
    ) AS recent_orders
FROM TargetCustomers tc
LEFT JOIN TopOrders tord ON tord.customer_id = tc.id
LEFT JOIN OrderItemsAgg oia ON oia.order_id = tord.order_id
GROUP BY tc.id, tc.full_name, tc.email, tc.tier;

-- ============================================================================
-- PHẦN 7: PHÒNG CHỐNG DEADLOCK BẰNG DETERMINISTIC LOCK ORDERING
-- ============================================================================

-- Kịch bản chuyển tiền an toàn giữa 2 tài khoản không bao giờ bị Deadlock:
CREATE OR REPLACE FUNCTION transfer_funds_safe(
    sender_id BIGINT,
    receiver_id BIGINT,
    amount NUMERIC
) RETURNS VOID AS $$
DECLARE
    first_lock_id BIGINT;
    second_lock_id BIGINT;
BEGIN
    -- Sắp xếp thứ tự ID tăng dần để đảm bảo mọi transaction luôn lấy lock cùng thứ tự
    IF sender_id < receiver_id THEN
        first_lock_id := sender_id;
        second_lock_id := receiver_id;
    ELSE
        first_lock_id := receiver_id;
        second_lock_id := sender_id;
    END IF;

    -- Thực hiện khóa dòng theo thứ tự chuẩn hóa (Deterministic Order)
    PERFORM id FROM customers WHERE id = first_lock_id FOR UPDATE;
    PERFORM id FROM customers WHERE id = second_lock_id FOR UPDATE;

    -- Tiến hành trừ/cộng tiền (logic an toàn 100% không thể phát sinh Deadlock)
    -- UPDATE ...
END;
$$ LANGUAGE plpgsql;
