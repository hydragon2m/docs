'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, getAccessToken, setAccessToken } from '@/lib/api-client';

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${msg}`, ...prev]);
  };

  const fetchProfile = async () => {
    setLoading(true);
    addLog('📡 Đang gửi request GET /auth/profile với Bearer AccessToken...');
    try {
      const res = await apiClient<any>('/auth/profile');
      setProfile(res.user);
      addLog(`✅ Nhận dữ liệu thành công! User ID: ${res.user.userId}, Role: ${res.user.role}`);
    } catch (err: any) {
      addLog(`❌ Thất bại: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    addLog('🔄 Đang gửi request POST /auth/refresh (Trình duyệt tự động đính kèm Cookie)...');
    try {
      const res = await apiClient<any>('/auth/refresh', { method: 'POST' });
      setAccessToken(res.accessToken);
      addLog(`✅ Refresh thành công! Access Token mới đã được cấp.`);
    } catch (err: any) {
      addLog(`❌ Lỗi Refresh: ${err.message}`);
    }
  };

  const handleLogout = async () => {
    addLog('🚪 Đang gửi request POST /auth/logout (Hủy phiên trên thiết bị này)...');
    try {
      await apiClient('/auth/logout', { method: 'POST' });
      setAccessToken(null);
      addLog('✅ Đã đăng xuất! Cookie đã bị xóa. Chuyển về /login...');
      setTimeout(() => router.push('/login'), 1000);
    } catch (err: any) {
      addLog(`❌ Lỗi Logout: ${err.message}`);
    }
  };

  const handleLogoutAll = async () => {
    addLog('💥 Đang gửi request POST /auth/logout-all (Hủy toàn bộ phiên trên Redis)...');
    try {
      await apiClient('/auth/logout-all', { method: 'POST' });
      setAccessToken(null);
      addLog('✅ Toàn bộ phiên trên mọi thiết bị đã bị hủy!');
      setTimeout(() => router.push('/login'), 1000);
    } catch (err: any) {
      addLog(`❌ Lỗi Logout All: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <div style={{ maxWidth: 760, margin: '40px auto', padding: 24, fontFamily: 'sans-serif' }}>
      <h2>📊 Dashboard Xác Thực Thực Nghiệm</h2>
      <p style={{ color: '#64748b', fontSize: 14 }}>
        Thực nghiệm tương tác Trình duyệt $\leftrightarrow$ Next.js $\leftrightarrow$ NestJS $\leftrightarrow$ Redis
      </p>

      {/* Box Thông tin User & Access Token */}
      <div style={{ background: '#f1f5f9', padding: 16, borderRadius: 8, marginBottom: 20 }}>
        <h4>Thông tin Phiên hiện tại:</h4>
        <p>• <strong>User ID:</strong> {profile?.userId || 'Đang tải...'}</p>
        <p>• <strong>Email:</strong> {profile?.email || 'Đang tải...'}</p>
        <p>• <strong>Role:</strong> {profile?.role || 'Đang tải...'}</p>
        <p style={{ wordBreak: 'break-all', fontSize: 12, color: '#334155' }}>
          • <strong>Access Token (In-Memory RAM):</strong> {getAccessToken() || '(Trống hoặc chưa nạp)'}
        </p>
        <p style={{ fontSize: 13, color: '#047857' }}>
          • <strong>Refresh Token (Trình duyệt giữ):</strong> Nằm trong <code>HttpOnly Cookie</code> (JavaScript không xem được, F12 Application $\rightarrow$ Cookies để kiểm tra).
        </p>
      </div>

      {/* Các nút bấm thao tác trực quan */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
        <button
          onClick={fetchProfile}
          disabled={loading}
          style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          1. Gọi API Protected (/profile)
        </button>

        <button
          onClick={handleManualRefresh}
          style={{ padding: '8px 16px', background: '#0891b2', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          2. Thủ công Refresh Token (Rotate)
        </button>

        <button
          onClick={handleLogout}
          style={{ padding: '8px 16px', background: '#d97706', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          3. Đăng xuất thiết bị này
        </button>

        <button
          onClick={handleLogoutAll}
          style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          4. Đăng xuất MỌI thiết bị (Kick-out)
        </button>
      </div>

      {/* Khung Real-time Logs */}
      <div>
        <h4>Nhật ký Tương tác (Console Log Trực Quan):</h4>
        <div style={{
          background: '#0f172a',
          color: '#38bdf8',
          padding: 16,
          borderRadius: 8,
          fontFamily: 'monospace',
          fontSize: 13,
          maxHeight: 280,
          overflowY: 'auto'
        }}>
          {logs.length === 0 ? 'Chưa có hoạt động...' : logs.map((log, idx) => (
            <div key={idx} style={{ marginBottom: 4 }}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
