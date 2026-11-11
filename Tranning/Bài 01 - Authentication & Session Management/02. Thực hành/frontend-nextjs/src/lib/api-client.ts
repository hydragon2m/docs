/**
 * =======================================================================
 * File: src/lib/api-client.ts
 * Bộ điều khiển HTTP Client chuyên nghiệp với cơ chế Silent Refresh & Token Queue
 * =======================================================================
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Lưu trữ Access Token trong Memory (RAM) để chống XSS đánh cắp từ localStorage
let inMemoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = () => inMemoryAccessToken;

// Cờ và hàng đợi chống gọi trùng lặp nhiều request refresh đồng thời (Race Condition)
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Hàm gọi API bọc ngoài tự động xử lý Access Token và Refresh Token
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // 1. Khởi tạo Headers
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (inMemoryAccessToken) {
    headers.set('Authorization', `Bearer ${inMemoryAccessToken}`);
  }

  // 2. BẮT BUỘC: credentials: 'include' để trình duyệt tự gửi và nhận Cookie
  const fetchConfig: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  const response = await fetch(url, fetchConfig);

  // 3. XỬ LÝ LỖI 401 UNAUTHORIZED (Access Token hết hạn hoặc không hợp lệ)
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    if (isRefreshing) {
      // Nếu đã có một tiến trình refresh đang chạy, đưa request này vào hàng đợi chờ
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: async (newAccessToken: string) => {
            headers.set('Authorization', `Bearer ${newAccessToken}`);
            try {
              const retryRes = await fetch(url, { ...options, headers, credentials: 'include' });
              resolve((await retryRes.json()) as T);
            } catch (err) {
              reject(err);
            }
          },
          reject: (err) => reject(err),
        });
      });
    }

    isRefreshing = true;

    try {
      // Gọi endpoint /auth/refresh (Trình duyệt TỰ ĐỘNG mang theo HttpOnly refreshToken)
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Mang cookie
      });

      if (!refreshRes.ok) {
        throw new Error('Refresh token không hợp lệ hoặc đã bị thu hồi');
      }

      const refreshData = await refreshRes.json();
      const newAccessToken = refreshData.accessToken;

      // Cập nhật Access Token mới vào Memory
      setAccessToken(newAccessToken);

      // Giải phóng hàng đợi chờ
      processQueue(null, newAccessToken);

      // Thực thi lại chính request ban đầu với token mới
      headers.set('Authorization', `Bearer ${newAccessToken}`);
      const retryOriginal = await fetch(url, { ...options, headers, credentials: 'include' });
      return (await retryOriginal.json()) as T;
    } catch (refreshError) {
      processQueue(refreshError, null);
      setAccessToken(null);

      // Điều hướng về trang đăng nhập nếu refresh thất bại
      if (typeof window !== 'undefined') {
        window.location.href = '/login?expired=1';
      }
      throw refreshError;
    } finally {
      isRefreshing = false;
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Lỗi HTTP: ${response.status}`);
  }

  return (await response.json()) as T;
}
