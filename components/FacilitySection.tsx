// FacilitySection 컴포넌트 생성
// 이유: 시설 안내 섹션 — Supabase facilities 테이블에서 데이터 불러오기

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface Facility {
  id: number;
  mode: string;
  order: number;
  image_url: string;
  label: string;
}

export default function FacilitySection({ mode }: { mode: string }) {
  const isAni = mode === 'ani';
  const mainColor = isAni ? '#FF1659' : '#515883';
  const [facilities, setFacilities] = useState<Facility[]>([]);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('facilities')
        .select('*')
        .eq('mode', mode)
        .order('order');
      if (data && data.length > 0) setFacilities(data);
    }
    fetch();
  }, [mode]);

  if (facilities.length === 0) return null;

  return (
    <section className="w-full bg-white" style={{ borderTop: '1px solid #F0F0F0' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '60px 4vw 80px' }}>

        {/* 섹션 타이틀 */}
        <div className="mb-8">
          <h2
            className="font-black text-[#1A1A1A] mb-2"
            style={{ fontFamily: "'Pretendard', sans-serif", fontSize: 'clamp(22px, 2vw, 32px)' }}
          >
            시설 안내
          </h2>
        </div>

        {/* 2×2 그리드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {facilities.map((fac) => (
            <div key={fac.id}>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16/10',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: mainColor,
                  marginBottom: '10px',
                }}
              >
                {fac.image_url ? (
                  <Image
                    src={fac.image_url}
                    alt={fac.label}
                    width={600}
                    height={375}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', backgroundColor: mainColor }} />
                )}
              </div>
              <p
                style={{
                  fontFamily: "'Pretendard', sans-serif",
                  fontSize: 'clamp(12px, 0.85vw, 15px)',
                  fontWeight: 500,
                  color: '#555',
                  textAlign: 'center',
                }}
              >
                {fac.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}