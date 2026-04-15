// app/admin/page.tsx 수정
// 이유: 탭 메뉴 + 권한별 탭 표시 구현

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminDesign from '@/components/admin/AdminDesign';

interface AdminUser {
  id: number;
  code: string;
  name: string;
  level: number;
  permissions: string;
  is_active: boolean;
  last_login: string;
  failed_attempts: number;
  locked_until: string | null;
}

const ALL_TABS = [
  { key: 'users',    label: '관리자 관리' },
  { key: 'design',   label: '홈&소개 디자인 편집' },
  { key: 'lessons',  label: '수업안내 관리' },
  { key: 'gallery',  label: '갤러리 관리' },
  { key: 'board',    label: '문의·게시판 관리' },
  { key: 'blog',     label: '블로그 관리' },
  { key: 'graduates',label: '합격자 관리' },
];

export default function AdminPage() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const router = useRouter();

  useEffect(() => {
    const saved = sessionStorage.getItem('admin');
    if (saved) setAdmin(JSON.parse(saved));
  }, []);

  const handleLogin = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');

    const { data } = await supabase
      .from('admin_users')
      .select('*')
      .eq('code', code.trim())
      .single();

    if (!data) {
      setError('존재하지 않는 코드예요.');
      setLoading(false);
      return;
    }

    if (data.locked_until && new Date(data.locked_until) > new Date()) {
      const remaining = Math.ceil((new Date(data.locked_until).getTime() - Date.now()) / 60000);
      setError(`${remaining}분 후에 다시 시도해주세요.`);
      setLoading(false);
      return;
    }

    if (!data.is_active) {
      setError('비활성화된 계정이에요.');
      setLoading(false);
      return;
    }

    await supabase
      .from('admin_users')
      .update({
        last_login: new Date().toISOString(),
        failed_attempts: 0,
        locked_until: null,
      })
      .eq('id', data.id);

    sessionStorage.setItem('admin', JSON.stringify(data));
    setAdmin(data);
    setLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin');
    setAdmin(null);
    setCode('');
    router.push('/');
  };

  // 권한에 따라 보여줄 탭 필터링
  const visibleTabs = admin
    ? ALL_TABS.filter((tab) => {
        if (admin.level === 1) return true; // 슈퍼어드민은 모두 보임
        if (admin.permissions === 'all') return true;
        return admin.permissions?.split(',').map((p) => p.trim()).includes(tab.key);
      })
    : [];

  // ── 로그인 전 ──────────────────────────────────
  if (!admin) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#F5F5F5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '48px 40px',
            width: '100%',
            maxWidth: '420px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          }}
        >
          <h2 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '22px', fontWeight: 700, color: '#1A1A1A', textAlign: 'center', marginBottom: '8px' }}>
            어드민 접속
          </h2>
          <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', color: '#888', textAlign: 'center', marginBottom: '28px' }}>
            접속 코드를 입력해주세요
          </p>

          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="ART-XXXXX"
            style={{
              width: '100%',
              padding: '14px 16px',
              backgroundColor: '#1A1A1A',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontFamily: "'Pretendard', sans-serif",
              fontSize: '16px',
              textAlign: 'center',
              letterSpacing: '2px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          {error && (
            <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#FF1659', textAlign: 'center', marginTop: '12px' }}>
              {error}
            </p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%',
              marginTop: '20px',
              padding: '14px',
              backgroundColor: '#FF1659',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontFamily: "'Pretendard', sans-serif",
              fontSize: '15px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '확인 중...' : '접속'}
          </button>

          <div style={{ borderTop: '1px solid #F0F0F0', marginTop: '28px', paddingTop: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#aaa' }}>
              접속 코드는 슈퍼어드민에게 문의
            </p>
            <button
              onClick={() => router.push('/')}
              style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              메인으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 로그인 후 ──────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F5' }}>

      {/* 헤더 */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #E0E0E0', padding: '0 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* 상단: 제목 + 레벨 + 로그아웃 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px 0 16px' }}>
            <div>
              <h1 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '24px', fontWeight: 900, color: '#1A1A1A', marginBottom: '2px' }}>
                어드민 패널
              </h1>
              <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888' }}>
                접속 코드: {admin.code}
              </p>
            </div>
            <span
              style={{
                fontFamily: "'Pretendard', sans-serif",
                fontSize: '12px',
                fontWeight: 700,
                color: admin.level === 1 ? '#FF1659' : '#515883',
                backgroundColor: admin.level === 1 ? '#FFF0F4' : '#ECEEF5',
                padding: '4px 12px',
                borderRadius: '20px',
                marginLeft: '8px',
              }}
            >
              {admin.level === 1 ? 'Lv.1 슈퍼어드민' : 'Lv.2 어드민'} — {admin.name}
            </span>
            <button
              onClick={handleLogout}
              style={{
                marginLeft: 'auto',
                padding: '8px 16px',
                border: '1px solid #E0E0E0',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                fontFamily: "'Pretendard', sans-serif",
                fontSize: '13px',
                cursor: 'pointer',
                color: '#555',
              }}
            >
              로그아웃
            </button>
          </div>

          {/* 탭 메뉴 */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {visibleTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  fontFamily: "'Pretendard', sans-serif",
                  fontSize: '13px',
                  fontWeight: activeTab === tab.key ? 700 : 500,
                  color: activeTab === tab.key ? '#ffffff' : '#555',
                  backgroundColor: activeTab === tab.key ? '#333333' : 'transparent',
                  border: '1px solid',
                  borderColor: activeTab === tab.key ? '#333333' : '#E0E0E0',
                  borderRadius: '8px 8px 0 0',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  borderBottom: activeTab === tab.key ? '1px solid #ffffff' : '1px solid #E0E0E0',
                  marginBottom: '-1px',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 40px' }}>
        {activeTab === 'users' && (
            <AdminUsers currentAdmin={admin} />
        )}
        {activeTab === 'design' && (
          <p style={{ fontFamily: "'Pretendard', sans-serif", color: '#888' }}>소개 디자인 편집 — 구현 중...</p>
        )}
        {activeTab === 'lessons' && (
          <p style={{ fontFamily: "'Pretendard', sans-serif", color: '#888' }}>수업안내 관리 — 구현 중...</p>
        )}
        {activeTab === 'gallery' && (
          <p style={{ fontFamily: "'Pretendard', sans-serif", color: '#888' }}>갤러리 관리 — 구현 중...</p>
        )}
        {activeTab === 'board' && (
          <p style={{ fontFamily: "'Pretendard', sans-serif", color: '#888' }}>문의·게시판 관리 — 구현 중...</p>
        )}
        {activeTab === 'blog' && (
          <p style={{ fontFamily: "'Pretendard', sans-serif", color: '#888' }}>블로그 관리 — 구현 중...</p>
        )}
        {activeTab === 'graduates' && (
          <p style={{ fontFamily: "'Pretendard', sans-serif", color: '#888' }}>합격자 관리 — 구현 중...</p>
        )}
        {activeTab === 'design' && (
            <AdminDesign />
        )}
      </div>

    </div>
  );
}