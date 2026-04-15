// HeroSection 수정
// 이유: 캐릭터 10% 확대 + 하단 잘림 완전 방지 + 화살표 10px 아래로

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

const SUPABASE_URL = 'https://pjqoanpmlunynhsumeso.supabase.co';
const IMG_BASE = `${SUPABASE_URL}/storage/v1/object/public/images`;

interface ContentRow {
  key: string;
  value: string;
}

function getVal(contents: ContentRow[], key: string, fallback: string): string {
  return contents.find((r) => r.key === key)?.value ?? fallback;
}

export default function HeroSection({ mode }: { mode: string }) {
  const [contents, setContents] = useState<ContentRow[]>([]);
  const [visible, setVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isAni = mode === 'ani';

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, [mode]);

  useEffect(() => {
    async function fetchContents() {
      const { data } = await supabase
        .from('site_content')
        .select('key, value')
        .eq('mode', mode)
        .eq('section', 'hero');
      if (data) setContents(data);
    }
    fetchContents();
  }, [mode]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const title = getVal(
    contents, 'title',
    isAni ? '전북 만화·애니 입시의 정답,\n네 여기 맞아요!' : '전주 최고 회화 학원이요?\n오로지 결과로 말할게요.'
  ).replace(/\\n/g, '\n');

  const desc1    = getVal(contents, 'desc1',     isAni ? '전북·전주 유일' : '수시 9명 지원 중 5명 인서울 합격! *2026년 올해 기준');
  const desc2    = getVal(contents, 'desc2',     isAni ? '주요 7개 만화·애니과 대학 교수 출신 강사 입시 지도' : '베테랑 원장 직강·장학생 출신 전임 강사 상주');
  const desc3    = getVal(contents, 'desc3',     isAni ? '세종대 수석졸업, 한예종 차석 졸업 전임 강사진' : '꾸준한 시범과 연합 평가로 탄탄한 입시 준비!');
  const btnLabel = getVal(contents, 'btn_label', '수강 문의하기');

  const bgColor  = isAni ? '#FF1659' : '#292929';
  const btnColor = isAni ? '#FF1659' : '#515883';
  const charImg  = `${IMG_BASE}/hero_img_${isAni ? 'ani' : 'fine'}.png`;

  type FadeItem = {
    content: string;
    delay: string;
    isTitle: boolean;
    isBtn: boolean;
  };

  const fadeItems: FadeItem[] = [
    { content: title,    delay: 'delay-[0ms]',   isTitle: true,  isBtn: false },
    { content: desc1,    delay: 'delay-[200ms]', isTitle: false, isBtn: false },
    { content: desc2,    delay: 'delay-[350ms]', isTitle: false, isBtn: false },
    { content: desc3,    delay: 'delay-[500ms]', isTitle: false, isBtn: false },
    { content: btnLabel, delay: 'delay-[700ms]', isTitle: false, isBtn: true  },
  ];

  return (
    <>
      <style>{`
        @keyframes float {
          0%   { transform: translateY(0px); }
          50%  { transform: translateY(-12px); }
          100% { transform: translateY(0px); }
        }
        .char-float {
          animation: float 3.5s ease-in-out infinite;
        }
        @keyframes bounce-arrow {
          0%, 100% { transform: translateX(-50%) translateY(0px); opacity: 1; }
          50%       { transform: translateX(-50%) translateY(8px); opacity: 0.6; }
        }
        .scroll-arrow {
          animation: bounce-arrow 1.4s ease-in-out infinite;
        }
        @media (max-width: 1024px) {
          .hero-title { font-size: 28px !important; }
          .hero-desc  { font-size: 13px !important; }
        }
        @media (max-width: 767px) {
          .hero-char  { display: none !important; }
          .hero-text  { width: 100% !important; }
          .hero-title { font-size: 26px !important; }
          .hero-desc  { font-size: 13px !important; }
        }
      `}</style>

      <section
        style={{
          backgroundColor: bgColor,
          transition: 'background-color 0.5s ease',
          height: 'calc(100vh - 64px)',
          minHeight: '500px',
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
        }}
      >
        <div
          className="h-full flex relative"
          style={{ maxWidth: '1920px', margin: '0 auto', padding: '0 4vw' }}
        >
          {/* 왼쪽 텍스트 */}
          <div
            className="hero-text flex flex-col z-10 justify-center"
            style={{
              width: '50%',
              gap: 'clamp(8px, 1vw, 16px)',
              paddingBottom: 'clamp(20px, 3vw, 50px)',
              paddingTop: 'clamp(10px, 1.5vw, 25px)',
            }}
          >
            {fadeItems.map((item, i) => (
              <div
                key={i}
                className={[
                  'transform transition-all duration-700 ease-out',
                  item.delay,
                  visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4',
                ].join(' ')}
              >
                {item.isBtn && (
                  <button
                    type="button"
                    className="bg-white rounded-xl font-bold hover:bg-gray-100 hover:scale-105 transition-all duration-200 shadow-sm cursor-pointer"
                    style={{
                      fontFamily: "'Pretendard', sans-serif",
                      fontWeight: 700,
                      marginTop: 'clamp(4px, 0.8vw, 12px)',
                      padding: 'clamp(10px, 0.8vw, 14px) clamp(18px, 1.5vw, 28px)',
                      color: btnColor,
                      fontSize: 'clamp(13px, 0.85vw, 16px)',
                    }}
                  >
                    {item.content}
                  </button>
                )}
                {!item.isBtn && item.isTitle && (
                  <h1
                    className="hero-title font-black text-white leading-snug whitespace-pre-line"
                    style={{
                      fontFamily: "'Pretendard', sans-serif",
                      fontSize: 'clamp(24px, 2.8vw, 52px)',
                    }}
                  >
                    {item.content}
                  </h1>
                )}
                {!item.isBtn && !item.isTitle && (
                  <p
                    className="hero-desc text-white/80 leading-relaxed"
                    style={{
                      fontFamily: "'Pretendard', sans-serif",
                      fontSize: 'clamp(12px, 0.9vw, 18px)',
                    }}
                  >
                    {item.content}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* 오른쪽 캐릭터 — 10% 더 크게, 하단 잘림 완전 방지 */}
          <div
            className="hero-char absolute pointer-events-none"
            style={{
              right: 0,
              bottom: '-18px',
              width: '65%',
              height: '118%',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
            }}
          >
            <div
              className="char-float"
              style={{ height: '105%', display: 'flex', alignItems: 'flex-end' }}
            >
              <Image
                src={charImg}
                alt={isAni ? '만화애니반 캐릭터' : '회화반 캐릭터'}
                width={1700}
                height={1200}
                style={{
                  height: '100%',
                  width: 'auto',
                  objectFit: 'contain',
                  objectPosition: 'bottom right',
                  display: 'block',
                }}
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* 스크롤 유도 화살표 — 10px 아래로 이동 */}
      <div
        className="scroll-arrow fixed left-1/2"
        style={{
          bottom: '18px',
          zIndex: 50,
          opacity: scrolled ? 0 : 1,
          transition: 'opacity 0.4s ease',
          pointerEvents: 'none',
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polyline
            points="6,10 16,22 26,10"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.85"
          />
        </svg>
      </div>
    </>
  );
}