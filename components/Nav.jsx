'use client'

import { useState } from 'react'

const menus = ['학원소개', '수업안내', '갤러리', '문의', '블로그']

export default function Nav({ mode, setMode }) {
  const [activeMenu, setActiveMenu] = useState(null)

  const isAni = mode === 'ani'
  const bgColor = isAni ? '#FF1659' : '#292929'
  const activeTextColor = isAni ? '#FF1659' : '#292929'

  const handleMenuClick = (menu) => {
    setActiveMenu(menu)
    const section = document.getElementById(menu)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' })
    }
  }

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

      {/* 로고 — Black Han Sans는 layout.tsx에서 등록한 CSS 변수로 적용 */}
      <button
        onClick={() => { setActiveMenu(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-black-han-sans)',
          fontSize: '20px',
          color: '#ffffff',
          whiteSpace: 'nowrap',
        }}
      >
        라인아트 미술학원
      </button>

      {/* 메뉴 — 기본 Medium(500), 활성 Bold(700) */}
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

      {/* 모드 토글 — Bold(700) */}
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