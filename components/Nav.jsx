// Nav 수정
// 이유: 학원소개 클릭 시 /about 페이지로 이동, 나머지는 스크롤 이동 유지

'use client'

import { useRouter, usePathname } from 'next/navigation'

const menus = ['학원소개', '수업안내', '갤러리', '문의', '블로그']

const menuPaths = {
  '학원소개': '/about',
  '수업안내': '/lessons',
  '갤러리': '/gallery',
  '문의': '/contact',
  '블로그': '/blog',
}

export default function Nav({ mode, setMode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isAni = mode === 'ani'
  const bgColor = isAni ? '#FF1659' : '#292929'
  const activeTextColor = isAni ? '#FF1659' : '#292929'

  const activeMenu = Object.entries(menuPaths).find(([, path]) => pathname === path)?.[0] ?? null

  const handleMenuClick = (menu) => {
    const path = menuPaths[menu];
    if (path) router.push(`${path}?mode=${mode}`);
  };

  return (
    <nav style={{
      backgroundColor: bgColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 48px',
      height: '64px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      transition: 'background-color 0.3s',
    }}>

      {/* 로고 */}
      <button
        onClick={() => router.push(`/?mode=${mode}`)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: "'Black Han Sans', sans-serif",
          fontSize: '24px',
          color: '#ffffff',
          whiteSpace: 'nowrap',
        }}
      >
        라인아트 미술학원
      </button>

      {/* 메뉴 */}
      <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
        {menus.map((menu) => (
          <button
            key={menu}
            onClick={() => handleMenuClick(menu)}
            style={{
              background: activeMenu === menu ? '#ffffff' : 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeMenu === menu ? '700' : '500',
              color: activeMenu === menu ? activeTextColor : 'rgba(255,255,255,0.8)',
              padding: '6px 18px',
              borderRadius: '20px',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
              fontFamily: "'Pretendard', sans-serif",
            }}
          >
            {menu}
          </button>
        ))}
      </div>

      {/* 모드 토글 */}
      <div style={{
        display: 'flex',
        background: 'rgba(0,0,0,0.25)',
        borderRadius: '8px',
        padding: '3px',
        gap: '2px',
      }}>
        {['ani', 'fine'].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              background: mode === m ? '#ffffff' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '700',
              color: mode === m ? activeTextColor : 'rgba(255,255,255,0.5)',
              padding: '4px 14px',
              borderRadius: '6px',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              fontFamily: "'Pretendard', sans-serif",
            }}
          >
            {m === 'ani' ? '만화·애니' : '회화'}
          </button>
        ))}
      </div>

    </nav>
  )
}