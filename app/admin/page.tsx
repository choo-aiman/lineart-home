'use client';
import AdminGraduates from '@/components/admin/AdminGraduates';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminHome from '@/components/admin/AdminHome';
import AdminAbout from '@/components/admin/AdminAbout';
import AdminLessons from '@/components/admin/AdminLessons';
import AdminBlog from '@/components/admin/AdminBlog';
import AdminContact from '@/components/admin/AdminContact';
import AdminGallery from '@/components/admin/AdminGallery';

// 로그인한 관리자 정보 (DB 함수 admin_whoami 가 돌려주는 값)
// 화면에서 탭을 숨기는 건 편의용이고, 실제 수정 권한은 Supabase 보안 규칙(RLS)이 막습니다.
export interface CurrentAdmin {
  id: number;
  name: string;
  email: string;
  role: string | null;
  level: number;
  permissions: string | null;
}

// key = 탭 구분, perm = 권한 이름 (홈 관리와 학원소개 관리는 'design' 권한 하나를 같이 씀)
const ALL_TABS = [
  { key: 'users',     perm: 'users',     label: '관리자 관리' },
  { key: 'home',      perm: 'design',    label: '홈 관리' },
  { key: 'about',     perm: 'design',    label: '학원소개 관리' },
  { key: 'lessons',   perm: 'lessons',   label: '수업안내 관리' },
  { key: 'gallery',   perm: 'gallery',   label: '갤러리 관리' },
  { key: 'board',     perm: 'board',     label: '문의·게시판 관리' },
  { key: 'blog',      perm: 'blog',      label: '블로그 관리' },
  { key: 'graduates', perm: 'graduates', label: '합격자 관리' },
];

type Status = 'checking' | 'signedOut' | 'denied' | 'ok';

export default function AdminPage() {
  const [admin, setAdmin] = useState<CurrentAdmin | null>(null);
  const [status, setStatus] = useState<Status>('checking');
  const [deniedEmail, setDeniedEmail] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const router = useRouter();

  useEffect(() => {
    // 예전 접속 코드 방식의 흔적 정리
    sessionStorage.removeItem('admin');

    let cancelled = false;

    async function checkAdmin(email: string | undefined) {
      const { data, error } = await supabase.rpc('admin_whoami');
      if (cancelled) return;
      if (error || !data) {
        setAdmin(null);
        setDeniedEmail(email ?? '');
        setStatus('denied');
        return;
      }
      setAdmin(data as CurrentAdmin);
      setStatus('ok');
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAdmin(null);
        setStatus('signedOut');
        return;
      }
      // 이 콜백 안에서 바로 DB 를 부르면 멈출 수 있어 한 박자 뒤에 확인
      setTimeout(() => checkAdmin(session.user.email), 0);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/admin`,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) setError('구글 로그인을 시작하지 못했어요. 잠시 후 다시 시도해주세요.');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAdmin(null);
    router.push('/');
  };

  const visibleTabs = admin
    ? ALL_TABS.filter((tab) => {
        if (admin.level === 1) return true;
        if (tab.perm === 'users') return false; // 관리자 관리는 슈퍼어드민 전용
        if (admin.permissions === 'all') return true;
        return admin.permissions?.split(',').map((p) => p.trim()).includes(tab.perm);
      })
    : [];

  const currentTab = visibleTabs.some((t) => t.key === activeTab)
    ? activeTab
    : visibleTabs[0]?.key ?? '';

  if (status !== 'ok' || !admin) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '48px 40px', width: '100%', maxWidth: '420px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '22px', fontWeight: 700, color: '#1A1A1A', textAlign: 'center', marginBottom: '8px' }}>
            어드민 접속
          </h2>

          {status === 'checking' && (
            <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', color: '#888', textAlign: 'center' }}>
              확인 중...
            </p>
          )}

          {status === 'signedOut' && (
            <>
              <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', color: '#888', textAlign: 'center', marginBottom: '28px' }}>
                등록된 구글 계정으로 로그인해주세요
              </p>
              <button
                onClick={handleLogin}
                style={{ width: '100%', padding: '14px', backgroundColor: '#FF1659', color: '#ffffff', border: 'none', borderRadius: '10px', fontFamily: "'Pretendard', sans-serif", fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}
              >
                구글 계정으로 로그인
              </button>
            </>
          )}

          {status === 'denied' && (
            <>
              <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', color: '#FF1659', textAlign: 'center', marginBottom: '8px', lineHeight: 1.6 }}>
                등록되지 않았거나 비활성화된 계정이에요.
              </p>
              {deniedEmail && (
                <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#888', textAlign: 'center', marginBottom: '24px' }}>
                  {deniedEmail}
                </p>
              )}
              <button
                onClick={handleLogout}
                style={{ width: '100%', padding: '14px', backgroundColor: '#1A1A1A', color: '#ffffff', border: 'none', borderRadius: '10px', fontFamily: "'Pretendard', sans-serif", fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}
              >
                로그아웃
              </button>
            </>
          )}

          {error && (
            <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#FF1659', textAlign: 'center', marginTop: '12px' }}>
              {error}
            </p>
          )}
          <div style={{ borderTop: '1px solid #F0F0F0', marginTop: '28px', paddingTop: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#aaa' }}>계정 등록은 슈퍼어드민에게 문의</p>
            <button onClick={() => router.push('/')} style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              메인으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F5' }}>
      {/* 헤더 */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #E0E0E0', padding: '0 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px 0 16px' }}>
            <div>
              <h1 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '24px', fontWeight: 900, color: '#1A1A1A', marginBottom: '2px' }}>
                어드민 패널
              </h1>
              <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888' }}>
                {admin.email}
              </p>
            </div>
            <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', fontWeight: 700, color: admin.level === 1 ? '#FF1659' : '#515883', backgroundColor: admin.level === 1 ? '#FFF0F4' : '#ECEEF5', padding: '4px 12px', borderRadius: '20px', marginLeft: '8px' }}>
              {admin.level === 1 ? 'Lv.1 슈퍼어드민' : 'Lv.2 어드민'} — {admin.name}{admin.role ? ` (${admin.role})` : ''}
            </span>
            <button
              onClick={handleLogout}
              style={{ marginLeft: 'auto', padding: '8px 16px', border: '1px solid #E0E0E0', borderRadius: '8px', backgroundColor: '#ffffff', fontFamily: "'Pretendard', sans-serif", fontSize: '13px', cursor: 'pointer', color: '#555' }}
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
                style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', fontWeight: currentTab === tab.key ? 700 : 500, color: currentTab === tab.key ? '#ffffff' : '#555', backgroundColor: currentTab === tab.key ? '#333333' : 'transparent', border: '1px solid', borderColor: currentTab === tab.key ? '#333333' : '#E0E0E0', borderRadius: '8px 8px 0 0', padding: '8px 16px', cursor: 'pointer', transition: 'all 0.15s', borderBottom: currentTab === tab.key ? '1px solid #ffffff' : '1px solid #E0E0E0', marginBottom: '-1px' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 40px' }}>
        {visibleTabs.length === 0 && (
          <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', color: '#888' }}>
            아직 부여된 관리 권한이 없어요. 슈퍼어드민에게 문의해주세요.
          </p>
        )}
        {currentTab === 'users' && <AdminUsers currentAdmin={admin} />}
        {currentTab === 'home' && <AdminHome />}
        {currentTab === 'about' && <AdminAbout />}
        {currentTab === 'lessons' && <AdminLessons />}
        {currentTab === 'gallery' && <AdminGallery />}
        {currentTab === 'board' && <AdminContact />}
        {currentTab === 'blog' && <AdminBlog />}
        {currentTab === 'graduates' && (
  <AdminGraduates />
)}
      </div>
    </div>
  );
}
