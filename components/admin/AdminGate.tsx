// AdminGate
// 이유: 로그인 전 / 권한 없음 화면을 관리자 페이지 여러 곳에서 똑같이 보여주기 위함

'use client';

import { useRouter } from 'next/navigation';
import type { AdminStatus } from '@/lib/useAdmin';

export default function AdminGate({
  status,
  deniedEmail,
  error,
  onLogin,
  onLogout,
  notice,
}: {
  status: AdminStatus;
  deniedEmail?: string;
  error?: string;
  onLogin: () => void;
  onLogout: () => void;
  notice?: string; // 로그인은 됐지만 이 페이지 권한이 없을 때 보여줄 문구
}) {
  const router = useRouter();

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
              onClick={onLogin}
              style={{ width: '100%', padding: '14px', backgroundColor: '#FF1659', color: '#ffffff', border: 'none', borderRadius: '10px', fontFamily: "'Pretendard', sans-serif", fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}
            >
              구글 계정으로 로그인
            </button>
          </>
        )}

        {(status === 'denied' || notice) && (
          <>
            <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', color: '#FF1659', textAlign: 'center', marginBottom: '8px', lineHeight: 1.6 }}>
              {notice ?? '등록되지 않았거나 비활성화된 계정이에요.'}
            </p>
            {deniedEmail && !notice && (
              <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#888', textAlign: 'center', marginBottom: '24px' }}>
                {deniedEmail}
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
              {notice && (
                <button
                  onClick={() => router.push('/admin')}
                  style={{ width: '100%', padding: '14px', backgroundColor: '#FF1659', color: '#ffffff', border: 'none', borderRadius: '10px', fontFamily: "'Pretendard', sans-serif", fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}
                >
                  선택 화면으로
                </button>
              )}
              <button
                onClick={onLogout}
                style={{ width: '100%', padding: '14px', backgroundColor: '#1A1A1A', color: '#ffffff', border: 'none', borderRadius: '10px', fontFamily: "'Pretendard', sans-serif", fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}
              >
                로그아웃
              </button>
            </div>
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
