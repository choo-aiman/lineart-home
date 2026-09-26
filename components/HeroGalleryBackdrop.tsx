// HeroGalleryBackdrop
// 이유: 히어로 캐릭터 뒤쪽에 갤러리 작품이 은은하게 떠다니는 배경
// 성능 설계:
//  - 갤러리에서 최대 6장만 가져오고, 화면에 보이는 크기(최대 220px)로 줄여서 WebP 로 받음
//  - 움직임은 CSS transform(위치·회전)만 사용 → 브라우저가 그래픽카드로 처리해서 버벅이지 않음
//  - 캐릭터·글자보다 나중에 불러오고(lazy), 다 받은 사진부터 서서히 나타남 → 첫 화면이 느려지지 않음
//  - 화면이 좁으면 장수를 줄이고, 휴대폰에서는 아예 받지 않음
//  - 사용자가 '동작 줄이기'를 켜 두었으면 움직이지 않음

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

const MAX_IMAGES = 8;

// 위치는 고정값 (무작위로 하면 새로고침마다 화면이 달라짐)
// 글자가 있는 왼쪽 가운데는 비워 두고 배치
// hideNarrow: 창이 좁을 때 숨길 사진

// 애니: 가로형(4:3) 작품이라 세로가 짧음 → 크게, 서로 붙여서 촘촘하게
const SLOTS_ANI = [
  { top: '1%',  left: '1%',  width: 300, duration: 24, delay: '0s',   rotate: -5, hideNarrow: true },
  { top: '5%',  left: '22%', width: 290, duration: 21, delay: '-11s', rotate: 4,  hideNarrow: false },
  { top: '1%',  left: '44%', width: 300, duration: 26, delay: '-3s',  rotate: -3, hideNarrow: false },
  { top: '7%',  left: '66%', width: 290, duration: 23, delay: '-15s', rotate: 6,  hideNarrow: false },
  { top: '31%', left: '85%', width: 280, duration: 29, delay: '-8s',  rotate: 8,  hideNarrow: true },
  { top: '50%', left: '60%', width: 300, duration: 25, delay: '-18s', rotate: -4, hideNarrow: false },
  { top: '66%', left: '33%', width: 300, duration: 27, delay: '-13s', rotate: 5,  hideNarrow: false },
  { top: '62%', left: '3%',  width: 290, duration: 22, delay: '-6s',  rotate: -7, hideNarrow: true },
];

// 회화: 세로형(3:4) 작품이라 세로가 길어서 지금 간격이 알맞음
const SLOTS_FINE = [
  { top: '4%',  left: '4%',  width: 210, duration: 24, delay: '0s',   rotate: -7, hideNarrow: true },
  { top: '66%', left: '8%',  width: 240, duration: 28, delay: '-6s',  rotate: 5,  hideNarrow: true },
  { top: '6%',  left: '34%', width: 220, duration: 21, delay: '-11s', rotate: 4,  hideNarrow: false },
  { top: '58%', left: '38%', width: 250, duration: 26, delay: '-3s',  rotate: -5, hideNarrow: false },
  { top: '5%',  left: '62%', width: 260, duration: 23, delay: '-15s', rotate: 6,  hideNarrow: false },
  { top: '54%', left: '70%', width: 230, duration: 29, delay: '-8s',  rotate: -4, hideNarrow: false },
  { top: '24%', left: '88%', width: 210, duration: 25, delay: '-18s', rotate: 8,  hideNarrow: true },
  { top: '30%', left: '52%', width: 190, duration: 27, delay: '-13s', rotate: -6, hideNarrow: true },
];

export default function HeroGalleryBackdrop({
  mode,
  veilOpacity,
  backdropScale,
}: {
  mode: string;
  veilOpacity?: string;  // 관리자(홈 관리)에서 정한 덮개 진하기 (%)
  backdropScale?: string; // 관리자에서 정한 작품 크기 (%, 100 = 기본)
}) {
  const isAni = mode === 'ani';
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    setUrls([]);

    async function fetchImages() {
      const { data } = await supabase
        .from('gallery')
        .select('image_url')
        .eq('mode', mode)
        .not('image_url', 'is', null)
        .order('order')
        .limit(MAX_IMAGES);
      if (cancelled || !data) return;
      setUrls(data.map((r) => r.image_url).filter(Boolean));
    }

    // 캐릭터·글자가 먼저 자리잡은 뒤에 불러옴
    const timer = setTimeout(fetchImages, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mode]);

  if (urls.length === 0) return null;

  // 갤러리 비율(가로÷세로): 애니는 가로형(4:3), 회화는 세로형(3:4)
  const ratio = isAni ? 4 / 3 : 3 / 4;
  const slots = isAni ? SLOTS_ANI : SLOTS_FINE;
  // 사진은 불투명하게 깔고, 그 위에 테마 색을 한 겹 덮어서 은은하게 만듦
  // (사진마다 투명도를 주면 겹치는 곳이 진해져서 어색해짐)
  // 진하기는 관리자 '홈 관리'에서 조절 (없으면 기본값)
  const defaultVeil = isAni ? 78 : 80;
  const parsed = Number(veilOpacity);
  const veilPercent = veilOpacity && !Number.isNaN(parsed) ? Math.min(100, Math.max(0, parsed)) : defaultVeil;
  const rgb = isAni ? '255, 22, 89' : '41, 41, 41';
  const veil = `rgba(${rgb}, ${veilPercent / 100})`;

  // 작품 크기 배율 (관리자에서 50~250% 조절, 없으면 100%)
  const parsedScale = Number(backdropScale);
  const scale = backdropScale && !Number.isNaN(parsedScale)
    ? Math.min(250, Math.max(50, parsedScale)) / 100
    : 1;

  return (
    <>
      <style>{`
        @keyframes heroFloatA {
          0%   { transform: translate3d(0, 0, 0) rotate(var(--rot)); }
          50%  { transform: translate3d(-14px, -22px, 0) rotate(calc(var(--rot) + 2deg)); }
          100% { transform: translate3d(0, 0, 0) rotate(var(--rot)); }
        }
        @keyframes heroFloatB {
          0%   { transform: translate3d(0, 0, 0) rotate(var(--rot)); }
          50%  { transform: translate3d(16px, 18px, 0) rotate(calc(var(--rot) - 2deg)); }
          100% { transform: translate3d(0, 0, 0) rotate(var(--rot)); }
        }
        .hero-bg-item {
          position: absolute;
          border-radius: 12px;
          overflow: hidden;
          will-change: transform;
        }
        @media (max-width: 1279px) {
          .hero-bg-item.hide-narrow { display: none; }
        }
        @media (max-width: 767px) {
          .hero-bg-layer { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-bg-item { animation: none !important; }
        }
      `}</style>

      <div
        className="hero-bg-layer"
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}
      >
        {urls.map((url, i) => {
          const slot = slots[i % slots.length];
          const width = Math.round(slot.width * scale);
          const height = Math.round(width / ratio);
          return (
            <div
              key={url}
              data-idx={i}
              className={[
                'hero-bg-item',
                slot.hideNarrow ? 'hide-narrow' : '',
              ].join(' ')}
              style={{
                top: slot.top,
                left: slot.left,
                width: `${width}px`,
                height: `${height}px`,
                ['--rot' as string]: `${slot.rotate}deg`,
                animation: `${i % 2 === 0 ? 'heroFloatA' : 'heroFloatB'} ${slot.duration}s ease-in-out ${slot.delay} infinite`,
              }}
            >
              <Image
                src={url}
                alt=""
                width={width}
                height={height}
                quality={75}
                sizes={`${width}px`}
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          );
        })}

        {/* 테마 색 한 겹 — 사진보다 위, 캐릭터·글자보다는 아래 */}
        <div style={{ position: 'absolute', inset: 0, backgroundColor: veil }} />
      </div>
    </>
  );
}
