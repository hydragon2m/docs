## I. KHÁI QUÁT (OVERVIEW)

### 1. Bản chất vô trạng thái (Stateless & Ephemeral) của Docker
Mặc định, vòng đời của một Docker Container là **ngắn hạn (ephemeral)**. Mọi dữ liệu được ghi bên trong tầng Container Layer (Writable Layer) sẽ **bị xóa sạch hoàn toàn** ngay khi container bị hủy (`docker rm`). Ngoài ra, các container khởi chạy độc lập sẽ bị cô lập mạng hoàn toàn với nhau.

Để triển khai các hệ thống Backend thực tế (bao gồm Web Server, CSDL PostgreSQL, Cache Redis), chúng ta cần giải quyết hai bài toán sống còn:
1. **Docker Networking:** Thiết lập kênh truyền thông nội bộ bảo mật, cho phép các container tự tìm thấy nhau qua tên miền nội bộ (Service Discovery).
2. **Docker Storage (Volumes & Bind Mounts):** Duy trì dữ liệu bền vững (Stateful persistence) cho Database và chia sẻ mã nguồn giữa máy Host với Container khi phát triển (Development Hot-reload).

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Các loại Docker Network Drivers

Docker cung cấp 4 driver mạng cốt lõi:

| Network Driver | Đặc điểm hoạt động | Khả năng DNS Discovery | Trường hợp sử dụng |
| :--- | :--- | :--- | :--- |
| **Default Bridge** | Mạng mặc định khi chạy `docker run`. Container nhận IP dạng `172.17.0.x`. | ❌ Không (chỉ ping qua IP) | Môi trường test cơ bản, không khuyến nghị cho backend |
| **Custom Bridge** *(User-Defined)* | Mạng cầu nối tự tạo. Tự động ánh xạ tên container sang IP nội bộ qua Docker DNS. | ✅ Có (qua Container Name) | **Chuẩn Production** cho multi-container trên 1 host |
| **Host** | Gỡ bỏ lớp cách ly mạng. Container dùng chung card mạng và dải port trực tiếp của Host. | ❌ Dùng localhost của Host | Xử lý gói tin tốc độ cao, stream video, benchmark mạng |
| **None** | Vô hiệu hóa toàn bộ mạng (chỉ còn loopback `127.0.0.1`). | ❌ Không có mạng | Chạy tác vụ tính toán bảo mật tuyệt đối, batch runner |

```text
[Máy Chủ Vật Lý (Host)]
  │
  ├── [Custom Bridge Network: "app-tier"]
  │     ├── Container: "nest-api"      (IP: 172.20.0.2) ◄──┐
  │     │                                                 │ Giao tiếp tự động
  │     └── Container: "postgres-db"   (IP: 172.20.0.3) ◄──┘ qua DNS nội bộ ("postgres-db")
  │
  └── [Default Bridge Network: "bridge"] (Không có DNS tự động)
```

> [!IMPORTANT]
> ### Tại sao bắt buộc dùng Custom Bridge thay vì Default Bridge?
> Trong Default Bridge, nếu container `postgres-db` khởi động lại và nhận IP mới (`172.17.0.4` thay vì `172.17.0.3`), ứng dụng Node.js sẽ đứt kết nối ngay lập tức. 
> 
> Trong **Custom Bridge Network**, Docker tích hợp sẵn một **DNS Server nội bộ** (127.0.0.11). Ứng dụng Node.js chỉ cần kết nối tới hostname `postgres-db:5432`, Docker DNS sẽ tự động phân giải đúng địa chỉ IP hiện tại của container mà không cần cấu hình thủ công.

#### Lệnh quản lý Docker Network:
```bash
# Tạo custom bridge network
docker network create --driver bridge backend-net

# Liệt kê danh sách network
docker network ls

# Kiểm tra chi tiết IP và các container trong network
docker network inspect backend-net

# Gắn hoặc gỡ một container đang chạy vào/ra network
docker network connect backend-net my-running-api
docker network disconnect backend-net my-running-api

# Xóa network (phải ngắt kết nối hết container trước)
docker network rm backend-net
```

---

### 2. So sánh các cơ chế Lưu trữ: Volumes vs Bind Mounts vs tmpfs

```text
                  ┌────────────────────────────────────────┐
                  │           Host File System             │
                  │                                        │
                  │   /var/lib/docker/volumes/             │
                  │   └── [Named Volume] ──────────┐       │
                  │                                │       │
                  │   /home/user/my-project/       │       │
                  │   └── [Bind Mount] ────┐       │       │
                  │                        │       │       │
                  │   [RAM / tmpfs] ──┐    │       │       │
                  └───────────────────┼────┼───────┼───────┘
                                      │    │       │
                                      ▼    ▼       ▼
                          ┌────────────────────────────────┐
                          │        Docker Container        │
                          └────────────────────────────────┘
```

| Tiêu chí | Named Volume | Bind Mount | tmpfs Mount |
| :--- | :--- | :--- | :--- |
| **Vị trí lưu trên Host** | `/var/lib/docker/volumes/` do Docker quản lý | Bất kỳ thư mục nào do người dùng chỉ định | Nằm trên bộ nhớ RAM của Host |
| **Tính bền vững** | Bền vững tuyệt đối, tách biệt vòng đời container | Bền vững, phụ thuộc vào hệ điều hành Host | Mất ngay khi container dừng |
| **Hiệu năng I/O** | Tối ưu hóa cao nhất trên Linux/Docker Desktop | Phụ thuộc ổ đĩa host (có thể chậm trên macOS/Windows) | Tốc độ đọc/ghi RAM cực cao |
| **Trường hợp sử dụng** | Lưu CSDL (Postgres, MongoDB, Redis, Upload files) | Mount mã nguồn để Live Hot-Reload khi dev | Lưu JWT Secrets, Session tạm thời, Cache nhạy cảm |

#### Lệnh quản lý Named Volumes:
```bash
# Tạo volume mới
docker volume create pg_data_volume

# Liệt kê các volume hiện có
docker volume ls

# Xem đường dẫn lưu trữ thực tế trên host
docker volume inspect pg_data_volume

# Xóa volume không còn sử dụng (dọn rác hệ thống)
docker volume prune -f
```

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE ANALYSIS)

### 1. Thiết lập hạ tầng hoàn chỉnh bằng Docker CLI
Dưới đây là chuỗi lệnh thiết lập mạng cô lập, gắn volume lưu trữ cho Database và khởi chạy ứng dụng Node.js:

```bash
# Bước 1: Tạo mạng nội bộ
docker network create --driver bridge ecommerce-network

# Bước 2: Tạo volume cho PostgreSQL
docker volume create pg_ecommerce_data

# Bước 3: Khởi chạy PostgreSQL gắn vào network và volume
docker run -d \
  --name ecommerce-db \
  --network ecommerce-network \
  -e POSTGRES_USER=app_user \
  -e POSTGRES_PASSWORD=secret_pass \
  -e POSTGRES_DB=shop_db \
  -v pg_ecommerce_data:/var/lib/postgresql/data \
  postgres:16-alpine

# Bước 4: Khởi chạy Node.js API kết nối tới DB qua DNS name "ecommerce-db"
docker run -d \
  --name ecommerce-api \
  --network ecommerce-network \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://app_user:secret_pass@ecommerce-db:5432/shop_db" \
  node-api:latest
```

---

### 2. Cấu hình Docker Compose chuẩn: Named Volume (Prod) + Bind Mount (Dev)

File `docker-compose.yml` kết hợp cả hai kỹ thuật: Bind Mount để live-reload code Node.js và Named Volume cho CSDL:

```yaml
version: '3.8'

services:
  # ==========================================
  # Node.js API Service (Development Mode)
  # ==========================================
  api:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: dev-api
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_HOST=dev-postgres
      - DATABASE_PORT=5432
      - DATABASE_USER=dev_user
      - DATABASE_PASSWORD=dev_pass
      - DATABASE_NAME=dev_db
    volumes:
      # 1. Bind Mount: Ánh xạ mã nguồn máy thật vào container để hot-reload
      - ./:/usr/src/app
      # 2. Anonymous Volume: Chặn không cho node_modules ở host đè lên container
      - /usr/src/app/node_modules
    networks:
      - internal-bridge-net
    depends_on:
      - postgres

  # ==========================================
  # PostgreSQL Database Service
  # ==========================================
  postgres:
    image: postgres:16-alpine
    container_name: dev-postgres
    environment:
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_pass
      POSTGRES_DB: dev_db
    volumes:
      # Named Volume: Đảm bảo dữ liệu DB tồn tại vĩnh viễn
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - internal-bridge-net

# Khai báo Named Volumes
volumes:
  postgres_data:
    driver: local

# Khai báo Custom Network
networks:
  internal-bridge-net:
    driver: bridge
```

---

## IV. LƯU Ý, CẠM BẪY VÀ QUY TẮC CỐT LÕI (BEST PRACTICES)

> [!CAUTION]
> ### 1. Cạm bẫy mất dữ liệu do Anonymous Volumes (Volume vô danh)
> Khi bạn chạy lệnh `docker run -v /var/lib/postgresql/data postgres`, Docker sẽ tạo một **Anonymous Volume** với mã Hash ngẫu nhiên (ví dụ: `8f3b2a...`). 
> - Khi bạn chạy `docker-compose down -v` hoặc dọn container, volume này rất dễ bị xóa mất hoặc trở thành "rác mồ côi" chiếm dụng hàng chục GB ổ cứng mà bạn không hay biết.
> - **Quy tắc cốt lõi:** Luôn đặt tên tường minh (**Named Volume**) cho tất cả các thư mục chứa dữ liệu stateful (CSDL, file upload).

> [!WARNING]
> ### 2. Lỗi Permission Denied do xung đột UID/GID khi Bind Mount
> Khi chạy container bằng user không phải root (ví dụ: `USER node` có UID là 1000), nếu thư mục trên máy host thuộc quyền sở hữu của user khác hoặc `root`, Node.js sẽ báo lỗi `EACCES: permission denied, open '/usr/src/app/dist'`.
> - **Cách xử lý:** Đảm bảo thư mục trên máy host có quyền sở hữu đồng nhất:
> ```bash
> # Cấp quyền sở hữu thư mục project cho UID 1000 trên Linux host
> sudo chown -R 1000:1000 ./
> ```

> [!IMPORTANT]
> ### 3. Kỹ thuật "Masking Volume" để bảo vệ `node_modules`
> Khi Bind Mount thư mục làm việc `.:/usr/src/app`, toàn bộ thư mục `node_modules` trên máy host (vốn được build cho macOS/Windows hoặc chưa cài) sẽ đè bẹp lên thư mục `node_modules` của Linux bên trong container, gây lỗi crash nhị phân (binary mismatch).
> - **Giải pháp:** Luôn thêm volume vô danh cho đường dẫn con: `- /usr/src/app/node_modules`. Kỹ thuật này báo cho Docker giữ nguyên thư mục `node_modules` bên trong container mà không bị ghi đè bởi máy host.

> [!TIP]
> ### 4. Cách Backup & Restore Named Volume an toàn
> Không cần truy cập trực tiếp vào `/var/lib/docker/volumes/`, bạn có thể dùng một container tạm thời để nén dữ liệu:
> ```bash
> # Sao lưu Named Volume ra file .tar trên máy host
> docker run --rm \
>   -v pg_ecommerce_data:/data \
>   -v $(pwd):/backup \
>   alpine tar -czvf /backup/db_backup.tar.gz -C /data .
>
> # Phục hồi dữ liệu từ file .tar vào Volume mới
> docker run --rm \
>   -v new_pg_data:/data \
>   -v $(pwd):/backup \
>   alpine sh -c "tar -xzvf /backup/db_backup.tar.gz -C /data"
> ```
