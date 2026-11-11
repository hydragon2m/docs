'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, setAccessToken } from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('Password123@');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Gọi API Login tới NestJS Backend
      // Backend sẽ trả về accessToken trong Body và Set-Cookie refreshToken vào trình duyệt
      const data = await apiClient<{
        message: string;
        accessToken: string;
        user: any;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          pass: password,
          deviceId: 'NextJS_Chrome_Client',
        }),
      });

      // 1. Lưu Access Token vào Memory biến toàn cục
      setAccessToken(data.accessToken);

      // 2. Chuyển hướng sang trang Dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '80px auto', padding: 24, border: '1px solid #e2e8f0', borderRadius: 8, fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: 8 }}>🔐 Đăng Nhập Hệ Thống</h2>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>
        Demo luồng JWT + HttpOnly Cookie + Redis Session JTI
      </p>

      {error && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: 12, borderRadius: 6, marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>Mật khẩu:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px 16px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Đang xác thực...' : 'Đăng nhập ngay'}
        </button>
      </form>

      <div style={{ marginTop: 20, padding: 12, background: '#f8fafc', borderRadius: 6, fontSize: 13, color: '#475569' }}>
        <strong>Tài khoản Demo sẵn có:</strong><br/>
        • Email: <code>admin@example.com</code><br/>
        • Mật khẩu: <code>Password123@</code>
      </div>
    </div>
  );
}
