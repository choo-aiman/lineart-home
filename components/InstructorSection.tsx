// InstructorSection 컴포넌트 생성
// 이유: 강사진 소개 섹션 — Supabase instructors, hashtags 테이블에서 데이터 불러오기

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface Instructor {
  id: number;
  mode: string;
  order: number;
  name: string;
  role: string;
  image_url: string;
  bullets: string;
}

interface Hashtag {
  id: number;
  mode: string;
  order: number;
  text: string;
}

export default function InstructorSection({ mode }: { mode: string }) {
  const isAni = mode === 'ani';
  const mainColor = isAni ? '#FF1659' : '#515883';
  const bgTag = isAni ? '#FFF0F4' : '#ECEEF5';

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);

  useEffect(() => {
    async function fetch() {
      const [{ data: inst }, { data: tags }] = await Promise.all([
        supabase.from('instructors').select('*').eq('mode', mode).order('order'),
        supabase.from('hashtags').select('*').eq('mode', mode).order('order'),
      ]);
      if (inst) setInstructors(inst);
      if (tags) setHashtags(tags);
    }
    fetch();
  }, [mode]);

  if (instructors.length === 0) return null;

  return (
    <section className="w-full bg-white" style={{ borderTop: '1px solid #F0F0F0' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '60px 4vw' }}>

        {/* 섹션 타이틀 */}
        <div className="mb-8">
          <h2
            className="font-black text-[#1A1A1A] mb-2"
            style={{ fontFamily: "'Pretendard', sans-serif", fontSize: 'clamp(22px, 2vw, 32px)' }}
          >
            강사진 소개
          </h2>
          <p
            className="text-[#888]"
            style={{ fontFamily: "'Pretendard', sans-serif", fontSize: 'clamp(13px, 0.9vw, 16px)', fontWeight: 500 }}
          >
            {isAni ? '차별화된 라인아트 애니반의 전문 강사진을 소개합니다' : '차별화된 라인아트 회화반의 전문 강사진을 소개합니다'}
          </p>
        </div>

        {/* 강사 카드 2열 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {instructors.map((inst) => {
            const bullets = inst.bullets
              ? inst.bullets.split(',').map((s) => s.trim()).filter(Boolean)
              : [];
            return (
              <div
                key={inst.id}
                style={{
                  border: '1px solid #E0E0E0',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start',
                  backgroundColor: '#FAFAFA',
                }}
              >
                {/* 프로필 이미지 */}
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    backgroundColor: mainColor,
                  }}
                >
                  {inst.image_url && (
                    <Image
                      src={inst.image_url}
                      alt={inst.name}
                      width={72}
                      height={72}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </div>

                {/* 텍스트 */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span
                      style={{
                        fontFamily: "'Pretendard', sans-serif",
                        fontSize: 'clamp(15px, 1vw, 18px)',
                        fontWeight: 700,
                        color: '#1A1A1A',
                      }}
                    >
                      {inst.name}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Pretendard', sans-serif",
                        fontSize: '12px',
                        fontWeight: 600,
                        color: mainColor,
                        backgroundColor: bgTag,
                        padding: '2px 8px',
                        borderRadius: '20px',
                      }}
                    >
                      {inst.role}
                    </span>
                  </div>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {bullets.map((b, i) => (
                      <li
                        key={i}
                        style={{
                          fontFamily: "'Pretendard', sans-serif",
                          fontSize: 'clamp(12px, 0.8vw, 14px)',
                          color: '#444',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '6px',
                        }}
                      >
                        <span style={{ color: mainColor, fontWeight: 700, flexShrink: 0 }}>•</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* 해시태그 */}
        {hashtags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '20px', justifyContent: 'center' }}>
            {hashtags.map((tag) => (
              <span
                key={tag.id}
                style={{
                  fontFamily: "'Pretendard', sans-serif",
                  fontSize: 'clamp(11px, 0.75vw, 13px)',
                  fontWeight: 500,
                  color: '#888',
                  backgroundColor: '#F5F5F5',
                  padding: '5px 12px',
                  borderRadius: '20px',
                }}
              >
                {tag.text}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}