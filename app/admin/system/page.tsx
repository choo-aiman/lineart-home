// 라인아트 통합 운영 시스템
// 이유: 선택 화면에서 들어오는 자리. 기능을 하나씩 추가하는 중
// ※ 학생 개인정보를 다루므로, 새 표를 만들 때 RLS 규칙을 반드시 같이 작성할 것

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminGate from '@/components/admin/AdminGate';
import { useAdmin, canUseSystem } from '@/lib/useAdmin';
import SystemReservations from '@/components/system/SystemReservations';

const MENU = [
  { key: 'reservations', label: '상담예약 관리', ready: true },
  { key: 'records',      label: '상담 기록',     ready: false },
  { key: 'students',     label: '재원생 관리',   ready: false },
  { key: 'analysis',     label: '입시 데이터',   ready: false },
  { key: 'curation',     label: '학생별 큐레이팅', ready: false },
];

export default function AdminSystemPage() {
  const router = useRouter();
  const { admin, status, deniedEmail, error, login, logout } = useAdmin();
  const [menu, setMenu] = useState('reservations');

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

  if (!canUseSystem(admin)) {
    return (
      <AdminGate
        status={status}
        onLogin={login}
        onLogout={logout}
        notice="통합 운영 시스템 권한이 없어요."
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
              라인아트 통합 운영 시스템
            </h1>
            <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888' }}>
              {admin.email}
            </p>
          </div>
          <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', fontWeight: 700, color: '#FF1659', backgroundColor: '#FFF0F4', padding: '4px 12px', borderRadius: '20px' }}>
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
      </div>

      {/* 메뉴 */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #E0E0E0', padding: '0 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {MENU.map((m) => (
            <button
              key={m.key}
              onClick={() => setMenu(m.key)}
              style={{
                fontFamily: "'Pretendard', sans-serif", fontSize: '13px',
                fontWeight: menu === m.key ? 700 : 500,
                color: menu === m.key ? '#ffffff' : m.ready ? '#555' : '#bbb',
                backgroundColor: menu === m.key ? '#FF1659' : 'transparent',
                border: '1px solid', borderColor: menu === m.key ? '#FF1659' : '#E0E0E0',
                borderRadius: '8px 8px 0 0', padding: '8px 16px', cursor: 'pointer',
                transition: 'all 0.15s', marginBottom: '-1px',
              }}
            >
              {m.label}{!m.ready && ' (준비 중)'}
            </button>
          ))}
        </div>
      </div>

      {/* 내용 */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {menu === 'reservations' && <SystemReservations />}
        {menu !== 'reservations' && (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #E0E0E0', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', fontWeight: 700, color: '#1A1A1A', marginBottom: '8px' }}>
              아직 준비 중인 기능이에요
            </p>
            <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', color: '#888', lineHeight: 1.7 }}>
              필요한 순서를 알려주시면 하나씩 만들어 드릴게요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
