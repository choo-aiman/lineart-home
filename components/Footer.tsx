// Footer 컴포넌트 생성
// 이유: 주소/전화번호 표시 + 어드민 히든 버튼 (접속 중 색상 변경)

'use client';

import { useRouter, usePathname } from 'next/navigation';

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();

  const isAdmin = pathname?.startsWith('/admin');

  return (
    <footer
      style={{ backgroundColor: '#222222' }}
      className="w-full px-8 py-4"
    >
      <div className="max-w-screen-xl mx-auto flex items-center justify-between">
        {/* 왼쪽: 주소 + 전화번호 */}
        <p className="text-white text-sm">
          전북 전주시 완산구 충경로 75 3층&nbsp;&nbsp;&nbsp;063-283-7771
        </p>

        {/* 오른쪽: 히든 어드민 버튼 — 어드민 접속 중이면 초록 배경으로 변경 */}
        <button
          onClick={() => router.push('/admin')}
          className="text-sm border-none px-3 py-1 rounded transition-all"
          style={{
            backgroundColor: isAdmin ? '#81FF8F' : 'transparent',
            color: isAdmin ? '#222222' : '#FFFFFF',
            cursor: 'pointer',
          }}
        >
          © 2025 라인아트 미술학원
        </button>
      </div>
    </footer>
  );
}