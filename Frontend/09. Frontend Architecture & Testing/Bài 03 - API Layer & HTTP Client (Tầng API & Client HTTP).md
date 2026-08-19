## I. KHÁI QUÁT (OVERVIEW)

### 1. Tại sao cần tách biệt Tầng API (API Layer)?
Trong các dự án nhỏ, lập trình viên thường gọi trực tiếp hàm `fetch()` ở khắp nơi trong ứng dụng: trong component, trong actions, trong custom hooks.
#### Điểm yếu chí mạng của cách làm này:
*   **Trùng lặp cấu hình:** Bạn phải viết lặp đi lặp lại base URL (`https://api.example.com`), các headers như `Content-Type` hay token `Authorization` ở hàng trăm chỗ.
*   **Khó bảo trì:** Khi backend đổi cấu trúc API (ví dụ đổi `/api/v1/auth/login` thành `/api/v2/login`), bạn phải đi rà soát và sửa lỗi ở toàn bộ mã nguồn.
*   **Không có cơ chế xử lý lỗi tập trung:** Việc bắt lỗi mất mạng, token hết hạn (401) phải viết thủ công ở từng component.

**API Layer** là một tầng trừu tượng nằm giữa ứng dụng của bạn và API Server, sử dụng một thư viện HTTP Client chuyên nghiệp (như **Axios**) được cấu hình tập trung để quản lý toàn bộ các request, tự động xử lý token hết hạn và định dạng lỗi thống nhất.

```mermaid
flowchart LR
    Component["React Component"] -->|Gọi hàm api.getProfile()| APILayer["Tầng API (src/features/auth/api)"]
    
    APILayer -->|Thông qua Client cấu hình sẵn| Axios["Axios Instance (Cấu hình Base URL, Interceptors)"]
    Axios -->|Request mạng| Server["Backend API Server"]
    
    Server -->|Response lỗi 401| Axios
    Axios -->|Tự động gọi refresh token ngầm| Server
```

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Cơ chế hoạt động của Axios Interceptors
Axios cung cấp tính năng **Interceptors** (Bộ lọc trung gian) cho phép bạn can thiệp và xử lý request/response trước khi chúng được đẩy đi hoặc trả về ứng dụng:

1.  **Request Interceptor:** Tự động đọc token đăng nhập hiện tại từ bộ nhớ và chèn vào header `Authorization: Bearer <token>` cho mọi request đi ra ngoài.
2.  **Response Interceptor:** Lắng nghe kết quả trả về. Nếu phát hiện lỗi **`401 Unauthorized`** (Access Token hết hạn), nó sẽ tạm thời giữ các request lỗi lại (queue), gửi request ngầm xin token mới (Silent Refresh), và tự động gửi lại các request lỗi với token mới một cách mượt mà.

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE EXAMPLES & ANALYSIS)

### 1. Cấu hình Axios Instance & Auto-refresh Token hoàn chỉnh
Dưới đây là mã nguồn thực tế cấu hình một HTTP Client chuyên nghiệp bằng Axios, tích hợp sẵn tự động làm mới token khi Access Token hết hạn và tự động ánh xạ lỗi thân thiện cho người dùng.

```typescript
// File: src/api/apiClient.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Định nghĩa kiểu dữ liệu cho lỗi trả về từ Backend
interface APIErrorResponse {
  message: string;
  code?: string;
}

// 1. Tạo Instance Axios với cấu hình mặc định
export const apiClient = axios.create({
  baseURL: 'https://api.example.com/v1',
  timeout: 10000, // Hạn chế treo mạng quá 10 giây
  headers: {
    'Content-Type': 'application/json',
  }
});

// 2. Request Interceptor: Tự động chèn JWT Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Biến cờ theo dõi tiến trình refresh token để tránh spam API
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

// 3. Response Interceptor: Xử lý Lỗi và Tự động làm mới Token khi gặp lỗi 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<APIErrorResponse>) => {
    const originalRequest = error.config;
    
    if (!originalRequest) return Promise.reject(error);

    // Phát hiện lỗi 401 và request này chưa từng được retry trước đây
    if (error.response?.status === 401 && !(originalRequest as any)._retry) {
      if (isRefreshing) {
        // Nếu đang trong tiến trình xin token mới, xếp request này vào hàng đợi chờ
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      (originalRequest as any)._retry = true;
      isRefreshing = true;

      try {
        console.log('Access token hết hạn. Đang xin làm mới token ngầm...');
        
        // Gọi API refresh token ngầm
        const response = await axios.post('https://api.example.com/v1/auth/refresh', {
          refreshToken: localStorage.getItem('refresh_token')
        });

        const { accessToken, newRefreshToken } = response.data;
        
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', newRefreshToken);

        isRefreshing = false;
        processQueue(null, accessToken);

        // Gửi lại request bị lỗi ban đầu với token mới
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Nếu refresh token cũng hết hạn, ép buộc logout người dùng
        processQueue(refreshError, null);
        isRefreshing = false;
        console.warn('Phiên làm việc hết hạn. Yêu cầu đăng nhập lại.');
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Tự động định dạng lại tin nhắn lỗi thân thiện với người dùng
    const userFriendlyMessage = error.response?.data?.message || 'Đã xảy ra lỗi kết nối mạng.';
    error.message = userFriendlyMessage;

    return Promise.reject(error);
  }
);
```

---

## IV. LƯU Ý, CẠM BẪY VÀ QUY TẮC CỐT LÕI (PITFALLS & BEST PRACTICES)

### 1. Cạm bẫy tạo vòng lặp vô tận khi gọi refresh token lỗi
*   **Vấn đề:** Nếu API `/auth/refresh` của bạn cũng trả về lỗi `401 Unauthorized` và bạn không đánh dấu cờ kiểm tra request đã từng retry chưa (`_retry = true`).
*   **Hậu quả:** Axios Interceptor sẽ lại bắt lỗi 401 của chính API refresh token và kích hoạt gọi tiếp API refresh token $\rightarrow$ Tạo ra vòng lặp vô tận (infinite loop) gửi hàng nghìn request làm sập server API của bạn và làm đơ trình duyệt của người dùng.
*   ✅ *Best practice:* Luôn bọc API `/auth/refresh` bằng lệnh gọi axios gốc (không dùng instance apiClient có cài interceptor 401), và đánh dấu cờ `_retry = true` trên config để chặn đứng việc gửi lại lần thứ hai.

---

## 💡 5 QUY TẮC VÀNG VỀ HTTP CLIENT & API LAYER
1.  **Luôn bọc HTTP Client trong một Instance tập trung:** Quản lý base URL, cấu hình timeout đồng bộ.
2.  **Dùng Request Interceptor chèn JWT Token:** Tránh viết code truyền token thủ công ở từng request.
3.  **Bắt lỗi 401 để tự động Refresh Token ngầm:** Tăng trải nghiệm sử dụng, giúp phiên làm việc của người dùng diễn ra liền mạch.
4.  **Chặn đứng vòng lặp vô tận bằng cờ kiểm soát:** Không chạy lại interceptor 401 cho các request gọi refresh token hoặc request đã retry.
5.  **Ánh xạ lỗi API thành tin nhắn thân thiện:** Tránh hiển thị các mã lỗi kỹ thuật thô (`AxiosError`, `status 500`) trực tiếp lên màn hình của người dùng.
