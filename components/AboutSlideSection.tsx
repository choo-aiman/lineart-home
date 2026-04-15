// AboutSlideSection 컴포넌트 생성
// 이유: 학원소개 슬라이드 섹션 — Supabase about_slides 테이블에서 데이터 불러오기

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface Slide {
  id: number;
  mode: string;
  order: number;
  image_url: string;
  title: string;
  body: string;
  list_items: string;
  image_side: string;
}

export default function AboutSlideSection({ mode }: { mode: string }) {
  const isAni = mode === 'ani';
  const mainColor = isAni ? '#FF1659' : '#515883';
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    setCurrent(0);
    async function fetch() {
      const { data } = await supabase
        .from('about_slides')
        .select('*')
        .eq('mode', mode)
        .order('order');
      if (data && data.length > 0) setSlides(data);
    }
    fetch();
  }, [mode]);

  if (slides.length === 0) return null;

  const slide = slides[current];
  const listItems = slide.list_items
    ? slide.list_items.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <section id="학원소개" className="w-full bg-white">
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '80px 4vw 60px' }}>

        {/* 섹션 타이틀 */}
        <div className="mb-10">
          <h2
            className="font-black text-[#1A1A1A] mb-2"
            style={{ fontFamily: "'Pretendard', sans-serif", fontSize: 'clamp(22px, 2vw, 32px)' }}
          >
            {isAni ? '애니반 소개' : '회화반 소개'}
          </h2>
          <p
            className="text-[#888]"
            style={{ fontFamily: "'Pretendard', sans-serif", fontSize: 'clamp(13px, 0.9vw, 16px)', fontWeight: 500 }}
          >
            {isAni ? '라인아트 애니반을 소개합니다' : '라인아트 회화반을 소개합니다'}
          </p>
        </div>

        {/* 슬라이드 본문 */}
        <div
          style={{
            display: 'flex',
            flexDirection: slide.image_side === 'left' ? 'row' : 'row-reverse',
            gap: 'clamp(24px, 4vw, 64px)',
            alignItems: 'center',
            minHeight: '320px',
          }}
        >
          {/* 이미지 */}
          <div
            style={{
              flex: '0 0 42%',
              aspectRatio: '4/3',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: mainColor,
            }}
          >
            {slide.image_url ? (
              <Image
                src={slide.image_url}
                alt={slide.title}
                width={600}
                height={450}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', backgroundColor: mainColor }} />
            )}
          </div>

          {/* 텍스트 */}
          <div style={{ flex: 1 }}>
            <h3
              className="font-bold text-[#1A1A1A] mb-4"
              style={{ fontFamily: "'Pretendard', sans-serif", fontSize: 'clamp(16px, 1.3vw, 22px)', lineHeight: 1.4 }}
            >
              {slide.title}
            </h3>
            <p
              className="text-[#444] mb-5 leading-relaxed"
              style={{ fontFamily: "'Pretendard', sans-serif", fontSize: 'clamp(13px, 0.85vw, 15px)' }}
            >
              {slide.body}
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {listItems.map((item, i) => (
                <li
                  key={i}
                  style={{
                    fontFamily: "'Pretendard', sans-serif",
                    fontSize: 'clamp(13px, 0.85vw, 15px)',
                    color: '#333',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}
                >
                  <span style={{ color: mainColor, fontWeight: 700, flexShrink: 0 }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 도트 네비게이션 */}
        {slides.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '40px' }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                style={{
                  width: i === current ? '28px' : '10px',
                  height: '10px',
                  borderRadius: '5px',
                  backgroundColor: i === current ? mainColor : '#E0E0E0',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  padding: 0,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}