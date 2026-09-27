// 어드민 선택 화면
// 이유: 로그인 후 상담 관리 / 재원생 관리 / 홈페이지 관리 / 관리자 관리 중에서 고르도록
//       (권한은 관리자 관리 화면에서 사람마다 부여 — 명단은 하나로 관리)

'use client';

import { useRouter } from 'next/navigation';
import AdminGate from '@/components/admin/AdminGate';
import { useAdmin, canUseSite, canUseConsult, canUseStudents } from '@/lib/useAdmin';

export default function AdminHubPage() {
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

  const consultAllowed = canUseConsult(admin);
  const studentsAllowed = canUseStudents(admin);
  const siteAllowed = canUseSite(admin);

  const cardBase: React.CSSProperties = {
    // 카드는 개수와 상관없이 항상 같은 크기 (앞으로 카드가 늘어도 동일)
    minWidth: 0,
    borderRadius: '16px',
    padding: '32px 28px',
    border: '1px solid #E0E0E0',
    backgroundColor: '#ffffff',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  };

  const card = (
    {
      title,
      desc,
      items,
      color,
      allowed,
      href,
    }: { title: string; desc: string; items: string; color: string; allowed: boolean; href: string },
  ) => (
    <button
      onClick={() => allowed && router.push(href)}
      disabled={!allowed}
      onMouseEnter={(e) => {
        if (!allowed) return;
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
        e.currentTarget.style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
        e.currentTarget.style.borderColor = '#E0E0E0';
      }}
      style={{ ...cardBase, cursor: allowed ? 'pointer' : 'not-allowed', opacity: allowed ? 1 : 0.5 }}
    >
      <span
        style={{
          display: 'inline-block',
          width: '40px',
          height: '4px',
          borderRadius: '2px',
          backgroundColor: color,
          marginBottom: '18px',
        }}
      />
      <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '20px', fontWeight: 900, color: '#1A1A1A', marginBottom: '8px' }}>
        {title}
      </p>
      <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', color: '#555', lineHeight: 1.6, marginBottom: '14px' }}>
        {desc}
      </p>
      <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#888', lineHeight: 1.6 }}>
        {items}
      </p>
      {!allowed && (
        <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#FF1659', marginTop: '14px' }}>
          권한이 없어요. 슈퍼어드민에게 문의해주세요.
        </p>
      )}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F5' }}>
      {/* 헤더 */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #E0E0E0' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '20px', fontWeight: 900, color: '#1A1A1A', marginBottom: '2px' }}>
              라인아트 어드민
            </h1>
            <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888' }}>
              {admin.email}
            </p>
          </div>
          <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', fontWeight: 700, color: admin.level === 1 ? '#FF1659' : '#515883', backgroundColor: admin.level === 1 ? '#FFF0F4' : '#ECEEF5', padding: '4px 12px', borderRadius: '20px' }}>
            {admin.level === 1 ? '슈퍼어드민' : '어드민'} — {admin.name}{admin.role ? ` (${admin.role})` : ''}
          </span>
          <button
            onClick={async () => { await logout(); router.push('/'); }}
            style={{ marginLeft: 'auto', padding: '8px 16px', border: '1px solid #E0E0E0', borderRadius: '8px', backgroundColor: '#ffffff', fontFamily: "'Pretendard', sans-serif", fontSize: '13px', cursor: 'pointer', color: '#555' }}
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 선택 카드 */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px 24px' }}>
        <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', color: '#555', marginBottom: '24px' }}>
          어디로 들어갈까요?
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', alignItems: 'stretch' }}>
          {card({
            title: '상담 관리',
            desc: '상담 신청을 확인하고 상담 내용을 남기는 곳이에요.',
            items: '상담 예약 · 상담 기록',
            color: '#FF1659',
            allowed: consultAllowed,
            href: '/admin/consult',
          })}
          {card({
            title: '재원생 관리',
            desc: '다니고 있는 학생과 입시 데이터를 관리하는 곳이에요.',
            items: '재원생 명단 · 입시 데이터 분석 · 학생별 큐레이팅',
            color: '#515883',
            allowed: studentsAllowed,
            href: '/admin/students',
          })}
          {card({
            title: '홈페이지 관리',
            desc: '학원 홈페이지에 보이는 글과 사진을 고치는 곳이에요.',
            items: '홈 · 학원소개 · 수업안내 · 갤러리 · 문의 · 블로그 · 합격자',
            color: '#FF1659',
            allowed: siteAllowed,
            href: '/admin/site',
          })}
          {/* 관리자 관리는 슈퍼어드민에게만 보임 */}
          {admin.level === 1 && card({
            title: '관리자 관리',
            desc: '어드민에 들어올 사람과 권한을 정하는 곳이에요.',
            items: '계정 추가 · 직책 · 권한 부여 · 사용 중지',
            color: '#1A1A1A',
            allowed: true,
            href: '/admin/users',
          })}
        </div>

        {!consultAllowed && !studentsAllowed && !siteAllowed && admin.level !== 1 && (
          <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', color: '#888', marginTop: '28px' }}>
            아직 부여된 권한이 없어요. 슈퍼어드민에게 문의해주세요.
          </p>
        )}
      </div>
    </div>
  );
}
