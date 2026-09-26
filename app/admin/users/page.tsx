// 관리자 관리 (슈퍼어드민 전용)
// 이유: 통합 운영 시스템 / 홈페이지 관리와 같은 위계로 분리
//       (홈페이지 관리 탭 안에 있으면 성격이 다른 기능이 섞여 보여서)

'use client';

import { useRouter } from 'next/navigation';
import AdminGate from '@/components/admin/AdminGate';
import { useAdmin } from '@/lib/useAdmin';
import AdminUsers from '@/components/admin/AdminUsers';

export default function AdminUsersPage() {
  const router = useRouter();
  const { admin, status, deniedEmail, error, login, logout } = useAdmin();

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

  // 관리자 명단은 슈퍼어드민만 (데이터베이스 규칙으로도 막혀 있음)
  if (admin.level !== 1) {
    return (
      <AdminGate
        status={status}
        onLogin={login}
        onLogout={logout}
        notice="관리자 관리는 슈퍼어드민만 들어갈 수 있어요."
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F5' }}>
      {/* 헤더 */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #E0E0E0', padding: '0 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px', padding: '24px 0', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '24px', fontWeight: 900, color: '#1A1A1A', marginBottom: '2px' }}>
              관리자 관리
            </h1>
            <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888' }}>
              {admin.email}
            </p>
          </div>
          <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', fontWeight: 700, color: '#FF1659', backgroundColor: '#FFF0F4', padding: '4px 12px', borderRadius: '20px' }}>
            슈퍼어드민 — {admin.name}{admin.role ? ` (${admin.role})` : ''}
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
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <AdminUsers currentAdmin={admin} />
      </div>
    </div>
  );
}
