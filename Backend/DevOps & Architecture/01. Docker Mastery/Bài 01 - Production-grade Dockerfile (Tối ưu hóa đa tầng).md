## I. KHÁI QUÁT (OVERVIEW)

### 1. Tại sao Backend cần Docker?
Trong vận hành phần mềm, lỗi phát sinh do sự sai lệch môi trường (máy dev chạy Node v18 trên macOS, máy staging chạy Node v20 trên Ubuntu) là cực kỳ phổ biến.

**Docker** giải quyết vấn đề này bằng cách đóng gói ứng dụng Node.js cùng tất cả dependencies, thư viện hệ thống và cấu hình môi trường vào trong một **Container Image** duy nhất. Image này chạy giống hệt nhau trên bất kỳ máy tính hay đám mây nào (AWS, GCP, Azure).

---

### 2. Vấn đề của Dockerfile kiểu cũ (Đơn tầng - Single Stage)
Một Dockerfile cơ bản kiểu cũ thường viết như sau:
```dockerfile
FROM node:20
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "dist/main.js"]
```
*Hạn chế nghiêm trọng ở Production:*
* **Kích thước file ảnh cực lớn (1GB - 2GB):** Chứa toàn bộ compiler, thư viện C++, `devDependencies` (như typescript, jest) không cần thiết khi chạy.
* **Mất an toàn bảo mật:** Chạy ngầm dưới quyền người dùng **`root`** cao nhất của hệ thống. Nếu ứng dụng có lỗ hổng, hacker có thể chiếm toàn quyền kiểm soát máy chủ vật lý.

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Giải pháp tối thượng: Đóng gói đa tầng (Multi-stage Builds)

Multi-stage build cho phép chúng ta chia Dockerfile thành nhiều phân đoạn (stages) tạm thời. Chúng ta chỉ lấy ra sản phẩm cuối cùng (mã JS đã biên dịch và production `node_modules`) để đưa vào image chạy cuối cùng, vứt bỏ toàn bộ rác thải build.

```text
  [STAGE 1: BUILD] ──────────────────────────► [STAGE 2: PRODUCTION]
  - Dùng base image lớn (node:20)              - Dùng base image siêu nhẹ (node:20-alpine)
  - Cài cả devDependencies                    - Chỉ cài production dependencies
  - Biên dịch TS -> JS                         - Chỉ copy file JS đã biên dịch từ Stage 1
  (Sinh ra thư mục dist/ và rác build)         (Dung lượng cuối cùng: < 100MB)
```

---

### 2. Các chỉ dẫn bảo mật Docker Node.js quan trọng

* **Sử dụng Alpine Linux base image:** Bản phân phối Linux tối giản (chỉ khoảng 5MB), giúp giảm tối đa diện tích tấn công (Attack Surface).
* **Không chạy quyền root:** Image Node.js mặc định cung cấp sẵn một user thường tên là **`node`**. Bạn phải kích hoạt user này trước khi khởi chạy ứng dụng.
* **Sử dụng `.dockerignore`:** Ngăn không cho Docker copy thư mục `node_modules` local hoặc file log từ máy bạn vào container lúc build.

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE ANALYSIS)

Dưới đây là một Dockerfile đa tầng chuẩn doanh nghiệp dùng để đóng gói ứng dụng TypeScript Node.js:

```dockerfile
# ==========================================
# GIAI ĐOẠN 1: BUILD (Biên dịch mã nguồn)
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Chỉ copy package files để tối ưu hóa bộ nhớ đệm (Docker Cache Layer)
COPY package*.json ./

# Cài đặt tất cả dependencies (bao gồm cả devDependencies để build TS)
RUN npm ci

# Copy toàn bộ mã nguồn
COPY . .

# Biên dịch TypeScript sang JavaScript (dist/)
RUN npm run build

# Dọn dẹp devDependencies, chỉ giữ lại production dependencies
RUN npm prune --production

# ==========================================
# GIAI ĐOẠN 2: RUNTIME (Chạy ứng dụng thực tế)
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copy các file package cần thiết
COPY package*.json ./

# Copy production node_modules và code JS đã build từ Stage 1
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

# 🔒 Bảo mật: Chuyển sang dùng user thường 'node', không dùng root
USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

---

## IV. LƯU Ý, CẠM BẪY VÀ QUY TẮC CỐT LÕI (BEST PRACTICES)

> [!IMPORTANT]
> ### Tận dụng tối đa bộ đệm tầng của Docker (Docker Layer Caching)
> Docker build code theo từng dòng chỉ dẫn từ trên xuống dưới. Mỗi dòng lệnh tạo ra một Layer được lưu vào Cache. Nếu bạn không thay đổi file liên quan đến dòng lệnh đó, Docker sẽ tái sử dụng cache cực nhanh ở lần build sau.
>
> **Quy tắc vàng:** Luôn `COPY package*.json ./` và `RUN npm install` trước khi `COPY . .`. 
> Vì file `package.json` rất ít khi thay đổi, Docker sẽ cache lại bước cài đặt thư viện. Khi bạn sửa code JS ở máy local và build lại, Docker chỉ mất 1 giây để copy code mới mà không cần cài lại toàn bộ thư viện npm từ đầu!

> [!WARNING]
> ### file `.dockerignore` bắt buộc
> Luôn tạo một file tên là `.dockerignore` nằm cùng thư mục với Dockerfile chứa nội dung sau:
> ```text
> node_modules
> npm-debug.log
> dist
> .git
> ```
