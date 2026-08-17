## I. KHÁI QUÁT (OVERVIEW)

### 1. Tại sao cần Docker Compose?
Một ứng dụng Backend hoàn chỉnh ở Production hầu như không bao giờ đứng một mình. Nó luôn đi kèm với các dịch vụ bổ trợ:
* Hệ quản trị cơ sở dữ liệu: **PostgreSQL / MySQL**.
* Hệ thống lưu trữ bộ đệm: **Redis**.
* Hệ thống hàng đợi tin nhắn: **RabbitMQ / Kafka**.

Nếu quản lý thủ công, bạn phải dùng hàng loạt câu lệnh `docker run` phức tạp, tự tay thiết lập cổng IP mạng kết nối chéo giữa các container này. Việc này cực kỳ dễ xảy ra lỗi cấu hình.

**Docker Compose** là công cụ cho phép bạn định nghĩa và vận hành một cụm ứng dụng gồm nhiều container (Multi-container Docker Application) một cách tự động thông qua một file cấu hình duy nhất viết bằng định dạng YAML: **`docker-compose.yml`**.

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Các thành phần cốt lõi của file `docker-compose.yml`

* **`services`**: Định nghĩa danh sách các container sẽ được tạo ra (ví dụ: `web`, `database`, `redis`).
* **`networks`**: Tạo ra một mạng nội bộ ảo (Virtual Network) để các container có thể tự do giao tiếp bảo mật với nhau mà không cần phơi bày (expose) cổng ra ngoài internet.
* **`volumes`**: Vùng lưu trữ dữ liệu bền vững (Persistent Storage). Nó gắn một thư mục của máy vật lý vào bên trong container của database để đảm bảo dữ liệu **không bị mất sạch** khi container bị khởi động lại hoặc bị xóa đi.

---

### 2. Giao tiếp mạng nội bộ giữa các Containers (Service Discovery)

> [!IMPORTANT]
> ### Nguyên lý kết nối
> Khi các container nằm chung trong một mạng ảo do Docker Compose tạo ra, chúng có khả năng tự động nhận diện tên dịch vụ làm địa chỉ kết nối (DNS Hostname).
>
> Thay vì dùng địa chỉ IP tĩnh không cố định, chuỗi kết nối Database (Connection String) trong code Node.js của bạn chỉ cần viết tên của Service làm Host:
> `postgres://postgres:password@postgres-db:5432/mydb`
> *(Trong đó `postgres-db` chính là tên service database định nghĩa trong file yaml).*

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE ANALYSIS)

Dưới đây là một file cấu hình `docker-compose.yml` hoàn chỉnh thiết lập cụm hạ tầng: **Node.js API + PostgreSQL DB + Redis Cache**:

```yaml
version: '3.8'

services:
  # Dịch vụ 1: Node.js Web API
  api-service:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000" # Map cổng 3000 của máy thật vào cổng 3000 của container
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://myuser:mypassword@postgres-db:5432/my_db
      - REDIS_URL=redis://redis-cache:6379
    depends_on:
      - postgres-db # Chỉ khởi chạy container này sau khi DB đã chạy xong
      - redis-cache
    networks:
      - backend-network

  # Dịch vụ 2: Cơ sở dữ liệu PostgreSQL
  postgres-db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=myuser
      - POSTGRES_PASSWORD=mypassword
      - POSTGRES_DB=my_db
    volumes:
      - pgdata:/var/lib/postgresql/data # Lưu dữ liệu DB bền vững
    ports:
      - "5432:5432"
    networks:
      - backend-network

  # Dịch vụ 3: Cache Redis
  redis-cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - backend-network

# Định nghĩa mạng nội bộ chung
networks:
  backend-network:
    driver: bridge

# Định nghĩa Volume lưu dữ liệu
volumes:
  pgdata:
    driver: local
```

---

## IV. LƯU Ý, CẠM BẪY VÀ QUY TẮC CỐT LÕI (BEST PRACTICES)

> [!CAUTION]
> ### 1. Cạm bẫy "depends_on" không đảm bảo DB sẵn sàng nhận kết nối
> Khi cấu hình `depends_on` cho `api-service`, Docker Compose chỉ đảm bảo container `postgres-db` **bắt đầu khởi chạy** trước container Node.js. 
> 
> Tuy nhiên, khi Postgres vừa khởi chạy, nó mất khoảng vài giây để nạp cấu hình hệ thống và mở cổng kết nối. Lúc này, Node.js khởi động xong lập tức chọc vào kết nối DB và sẽ bị sập nguồn ngay vì DB chưa sẵn sàng nhận kết nối (Connection Refused).
>
> **Quy tắc cốt lõi:**
> - Viết code Node.js có cơ chế tự động kết nối lại (Retry Connection Logic) với DB sau mỗi 2-3 giây nếu bị lỗi kết nối đầu tiên.
> - Hoặc sử dụng công cụ kiểm tra cổng như `wait-for-it.sh` trong Dockerfile trước khi khởi chạy lệnh node.

> [!WARNING]
> ### 2. Tuyệt đối không commit file mật khẩu `.env` lên Git
> Bạn nên đưa các mật khẩu DB (`POSTGRES_PASSWORD`) ra một file cấu hình biến môi trường ngoài là `.env` và dùng chỉ dẫn `env_file: .env` trong compose. Hãy thêm file `.env` này vào `.gitignore` để tránh rò rỉ mật khẩu hệ thống.
