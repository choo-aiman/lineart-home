// Footer 수정
// 이유: 주소/저작권 텍스트를 Supabase site_content에서 불러오기
//       관리자 접속 코드 팝업 제거 → 저작권 문구를 누르면 구글 로그인 화면(/admin)으로 이동

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Footer() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [address, setAddress] = useState('전북 전주시 완산구 충경로 75 3층   063-283-7771');
  const [copyright, setCopyright] = useState('© 2025 라인아트 미술학원');
  const router = useRouter();

  // 로그인 상태 확인 (표시용 — 실제 권한은 관리자 페이지와 DB 가 확인)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
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

  return (
    <footer
      style={{ backgroundColor: '#222222', transition: 'background-color 0.3s' }}
      className="w-full px-8 py-4"
    >
      <div className="max-w-screen-xl mx-auto flex items-center justify-between">
        <p className="text-white text-sm">
          {address}
        </p>
        <button
          onClick={() => router.push('/admin')}
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
  );
}
