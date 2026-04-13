'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const SUPABASE_URL = 'https://pjqoanpmlunynhsumeso.supabase.co';
const IMG_BASE = `${SUPABASE_URL}/storage/v1/object/public/images`;

function getVal(contents: Record<string, string>, key: string, fallback: string): string {
  return (contents[key] ?? fallback).replace(/\\n/g, '\n');
}

export default function ClassCards({ mode }: { mode: string }) {
  const [contents, setContents] = useState<Record<string, string>>({});

  const isAni = mode === 'ani';
  const mainColor = isAni ? '#FF1659' : '#515883';
  const tagBg     = isAni ? '#FFF0F4' : '#515883';
  const tagColor  = isAni ? '#FF1659' : '#ffffff';

  // 모드별 카드 이미지 경로
  const cardImages = isAni
    ? [
        `${IMG_BASE}/classcard_img_ani1.jpg`,
        `${IMG_BASE}/classcard_img_ani2.jpg`,
        `${IMG_BASE}/classcard_img_ani3.jpg`,
      ]
    : [
        `${IMG_BASE}/classcard_img_fine1.jpg`,
        `${IMG_BASE}/classcard_img_fine2.jpg`,
        `${IMG_BASE}/classcard_img_fine3.jpg`,
      ];

  useEffect(() => {
    async function fetchContents() {
      const { data } = await supabase
        .from('site_content')
        .select('key, value')
        .eq('mode', mode)
        .eq('section', 'class_cards');
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((r) => { map[r.key] = r.value; });
        setContents(map);
      }
    }
    fetchContents();
  }, [mode]);

  const sectionTitle    = getVal(contents, 'section_title',    isAni ? '만화·애니메이션 클래스' : '회화 클래스');
  const sectionSubtitle = getVal(contents, 'section_subtitle', '전북·전주 최고의 커리큘럼과 결과를 지향합니다.');

  const cards = [
    {
      tag:   getVal(contents, 'card1_tag',   '대입'),
      title: getVal(contents, 'card1_title', '대학 입시 종합반'),
      desc:  getVal(contents, 'card1_desc',  isAni
        ? '전문적인 커리큘럼과 입시·대학교 분석을 통해\n만화·애니메이션 계열 대학 입시를 준비합니다.'
        : '모든 유형별 합격자 배출! 압도적인 인원수 대비\nIn 서울 및 주요 대학 합격률, 라인아트 회화반.'),
    },
    {
      tag:   getVal(contents, 'card2_tag',   '고입'),
      title: getVal(contents, 'card2_title', '고등 입시반'),
      desc:  getVal(contents, 'card2_desc',  isAni
        ? '한국애니고·경기예고·전통고·전주예고 유형별 맞춤\n교육으로 꿈에 좀 더 빠르게 가까워집니다.'
        : '전통고·전주예고 역대 탈락자 ZERO!\n확실한 합격을 만들어 드립니다.'),
    },
    {
      tag:   getVal(contents, 'card3_tag',   '기타'),
      title: getVal(contents, 'card3_title', isAni ? '취미·편입·전문기술 교육반' : '취미·임용반'),
      desc:  getVal(contents, 'card3_desc',  isAni
        ? '단순 그림 실력 향상, 대학교 편입 및 3D, CG 등\n전문 기술을 보강하고 싶을 때 완벽한 선택!'
        : '취미 회화와 미술 교사 임용 준비 등 목적에 맞게\n최적의 커리큘럼과 교육을 제공합니다.'),
    },
  ];

  return (
    <section className="w-full bg-white py-16 px-6">
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 4vw' }}>

        {/* 섹션 제목 */}
        <div className="mb-10">
          <h2
            className="font-black text-[#1A1A1A] mb-2"
            style={{ fontFamily: "'Pretendard', sans-serif", fontSize: 'clamp(22px, 2vw, 32px)' }}
          >
            {sectionTitle}
          </h2>
          <p
            className="text-[#888888]"
            style={{ fontFamily: "'Pretendard', sans-serif", fontSize: 'clamp(13px, 0.9vw, 16px)', fontWeight: 500 }}
          >
            {sectionSubtitle}
          </p>
        </div>

        {/* 카드 3개 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden border border-[#E0E0E0] bg-white flex flex-col"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            >
              {/* 상단 이미지 영역 */}
              <div
                className="w-full overflow-hidden"
                style={{ aspectRatio: '4 / 3' }}
              >
                <img
                  src={cardImages[i]}
                  alt={card.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>

              {/* 하단 텍스트 영역 */}
              <div className="flex flex-col gap-3 p-6 flex-1">

                {/* 태그 뱃지 */}
                <span
                  className="inline-block w-fit text-xs font-bold px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: tagBg,
                    color: tagColor,
                    fontFamily: "'Pretendard', sans-serif",
                    transition: 'all 0.5s ease',
                  }}
                >
                  {card.tag}
                </span>

                {/* 카드 제목 */}
                <h3
                  className="font-black text-[#1A1A1A]"
                  style={{ fontFamily: "'Pretendard', sans-serif", fontSize: 'clamp(16px, 1.2vw, 22px)' }}
                >
                  {card.title}
                </h3>

                {/* 카드 설명 */}
                <p
                  className="text-[#555] leading-relaxed whitespace-pre-line flex-1"
                  style={{ fontFamily: "'Pretendard', sans-serif", fontSize: 'clamp(12px, 0.8vw, 15px)', fontWeight: 500 }}
                >
                  {card.desc}
                </p>

                {/* 자세히 보기 버튼 */}
                <button
                  type="button"
                  className="mt-2 w-fit px-5 py-2 rounded-lg border font-bold hover:scale-105 transition-all duration-200"
                  style={{
                    borderColor: mainColor,
                    color: mainColor,
                    fontFamily: "'Pretendard', sans-serif",
                    fontSize: 'clamp(12px, 0.8vw, 14px)',
                    fontWeight: 700,
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = mainColor;
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = mainColor;
                  }}
                >
                  자세히 보기 →
                </button>

              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}