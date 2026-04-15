// Footer 수정
// 이유: 주소/저작권 텍스트를 Supabase site_content에서 불러오기

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Footer() {
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('전북 전주시 완산구 충경로 75 3층   063-283-7771');
  const [copyright, setCopyright] = useState('© 2025 라인아트 미술학원');
  const router = useRouter();

  // 세션 확인
  useEffect(() => {
    const check = () => {
      const saved = sessionStorage.getItem('admin');
      setIsLoggedIn(!!saved);
    };
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, []);

  // 푸터 텍스트 불러오기
  useEffect(() => {
    async function fetchFooter() {
      const { data } = await supabase
        .from('site_content')
        .select('key, value')
        .eq('mode', 'ani')
        .eq('section', 'footer');
      if (data) {
        const addr = data.find((r) => r.key === 'address');
        const copy = data.find((r) => r.key === 'copyright');
        if (addr) setAddress(addr.value);
        if (copy) setCopyright(copy.value);
      }
    }
    fetchFooter();
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

    if (data.code !== code.trim()) {
      const attempts = (data.failed_attempts || 0) + 1;
      const updateData: Record<string, unknown> = { failed_attempts: attempts };
      if (attempts >= 5) {
        updateData.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        updateData.failed_attempts = 0;
        setError('5회 오입력으로 15분간 잠금됩니다.');
      } else {
        setError(`코드가 틀렸어요. (${attempts}/5)`);
      }
      await supabase.from('admin_users').update(updateData).eq('id', data.id);
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
    setIsLoggedIn(true);
    setShowLogin(false);
    setCode('');
    router.push('/admin');
    setLoading(false);
  };

  const handleClose = () => {
    setShowLogin(false);
    setError('');
    setCode('');
  };

  const handleAdminButtonClick = () => {
    if (isLoggedIn) {
      router.push('/admin');
    } else {
      setShowLogin(true);
    }
  };

  return (
    <>
      <footer
        style={{ backgroundColor: '#222222', transition: 'background-color 0.3s' }}
        className="w-full px-8 py-4"
      >
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <p className="text-white text-sm">
            {address}
          </p>
          <button
            onClick={handleAdminButtonClick}
            className="text-sm border-none px-3 py-1 rounded transition-all"
            style={{
              backgroundColor: isLoggedIn ? '#81FF8F' : 'transparent',
              color: isLoggedIn ? '#222222' : '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            {copyright}
          </button>
        </div>
      </footer>

      {/* 로그인 팝업 */}
      {showLogin && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '48px 40px',
              width: '100%',
              maxWidth: '420px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
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
                onClick={() => { handleClose(); router.push('/'); }}
                style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                메인으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}