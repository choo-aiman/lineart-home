// 홈페이지 관리 (예전 /admin 화면이 이리로 옮겨짐)
// 이유: 어드민 진입 시 '통합 운영 시스템'과 '홈페이지 관리' 중 고르도록 분리

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminGate from '@/components/admin/AdminGate';
import { useAdmin, canUseSite, hasPerm } from '@/lib/useAdmin';
import AdminHome from '@/components/admin/AdminHome';
import AdminAbout from '@/components/admin/AdminAbout';
import AdminLessons from '@/components/admin/AdminLessons';
import AdminBlog from '@/components/admin/AdminBlog';
import AdminContact from '@/components/admin/AdminContact';
import AdminGallery from '@/components/admin/AdminGallery';
import AdminGraduates from '@/components/admin/AdminGraduates';

// key = 탭 구분, perm = 권한 이름 (홈 관리와 학원소개 관리는 'design' 권한 하나를 같이 씀)
const ALL_TABS = [
  { key: 'home',      perm: 'design',    label: '홈 관리' },
  { key: 'about',     perm: 'design',    label: '학원소개 관리' },
  { key: 'lessons',   perm: 'lessons',   label: '수업안내 관리' },
  { key: 'gallery',   perm: 'gallery',   label: '갤러리 관리' },
  { key: 'board',     perm: 'board',     label: '문의·게시판 관리' },
  { key: 'blog',      perm: 'blog',      label: '블로그 관리' },
  { key: 'graduates', perm: 'graduates', label: '합격자 관리' },
];

export default function AdminSitePage() {
  const router = useRouter();
  const { admin, status, deniedEmail, error, login, logout } = useAdmin();
  const [activeTab, setActiveTab] = useState('');

  if (status !== 'ok' || !admin) {
    return (
      <AdminGate
        status={status}
        deniedEmail={deniedEmail}
        error={error}
        onLogin={login}
        onLogout={logout}
      />
    );
  }

  if (!canUseSite(admin)) {
    return (
      <AdminGate
        status={status}
        onLogin={login}
        onLogout={logout}
        notice="홈페이지 관리 권한이 없어요."
      />
    );
  }

  const visibleTabs = ALL_TABS.filter((tab) => {
    return hasPerm(admin, tab.perm);
  });

  const currentTab = visibleTabs.some((t) => t.key === activeTab)
    ? activeTab
    : visibleTabs[0]?.key ?? '';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F5' }}>
      {/* 헤더 */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #E0E0E0', padding: '0 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '24px 0 16px', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '24px', fontWeight: 900, color: '#1A1A1A', marginBottom: '2px' }}>
                홈페이지 관리
              </h1>
              <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888' }}>
                {admin.email}
              </p>
            </div>
            <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', fontWeight: 700, color: admin.level === 1 ? '#FF1659' : '#515883', backgroundColor: admin.level === 1 ? '#FFF0F4' : '#ECEEF5', padding: '4px 12px', borderRadius: '20px' }}>
              {admin.level === 1 ? '슈퍼어드민' : '어드민'} — {admin.name}{admin.role ? ` (${admin.role})` : ''}
            </span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button
                onClick={() => router.push('/admin')}
                style={{ padding: '8px 16px', border: '1px solid #E0E0E0', borderRadius: '8px', backgroundColor: '#ffffff', fontFamily: "'Pretendard', sans-serif", fontSize: '13px', cursor: 'pointer', color: '#555' }}
              >
                선택 화면
              </button>
              <button
                onClick={async () => { await logout(); router.push('/'); }}
                style={{ padding: '8px 16px', border: '1px solid #E0E0E0', borderRadius: '8px', backgroundColor: '#ffffff', fontFamily: "'Pretendard', sans-serif", fontSize: '13px', cursor: 'pointer', color: '#555' }}
              >
                로그아웃
              </button>
            </div>
          </div>
          {/* 탭 메뉴 */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
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
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {currentTab === 'home' && <AdminHome />}
        {currentTab === 'about' && <AdminAbout />}
        {currentTab === 'lessons' && <AdminLessons />}
        {currentTab === 'gallery' && <AdminGallery />}
        {currentTab === 'board' && <AdminContact />}
        {currentTab === 'blog' && <AdminBlog />}
        {currentTab === 'graduates' && <AdminGraduates />}
      </div>
    </div>
  );
}
