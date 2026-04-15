// TuitionSection 수정
// 이유: tuition_plans 대신 tuition_info 단일 테이블에서 모든 데이터 불러오기

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Info {
  id: number;
  section: string;
  key: string;
  value: string;
}

export default function TuitionSection({ mode }: { mode: string }) {
  const isAni = mode === 'ani';
  const mainColor = isAni ? '#FF1659' : '#515883';
  const lightBg = isAni ? '#FFF0F4' : '#ECEEF5';
  const [info, setInfo] = useState<Info[]>([]);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('tuition_info')
        .select('*')
        .eq('mode', mode)
        .order('id');
      if (data) setInfo(data);
    }
    fetch();
  }, [mode]);

  // 섹션별 데이터 파싱
  const get = (section: string, key: string) =>
    info.find((d) => d.section === section && d.key === key)?.value ?? '';

  const title = get('tuition', 'title');
  const subtitle = get('tuition', 'subtitle');

  // 플랜 카드 3개 조립
  const plans = [1, 2, 3].map((n) => ({
    category: get('plan', `category_${n}`),
    class_name: get('plan', `class_${n}`),
    price: get('plan', `price_${n}`),
    desc: get('plan', `desc_${n}`).replace(/\\n/g, '\n'),
  })).filter((p) => p.class_name);

  const scholarshipTags = info.filter((d) => d.section === 'scholarship' && d.key === 'tag');
  const scholarshipBody = get('scholarship', 'body').replace(/\\n/g, '\n');

  if (info.length === 0) return null;

  return (
    <section className="w-full bg-white" style={{ borderTop: '1px solid #F0F0F0' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '60px 4vw 80px' }}>

        {/* 섹션 타이틀 */}
        <div className="mb-8">
          <h2
            className="font-black text-[#1A1A1A] mb-2"
            style={{ fontFamily: "'Pretendard', sans-serif", fontSize: 'clamp(22px, 2vw, 32px)' }}
          >
            {title || '수강료 안내'}
          </h2>
          <p
            className="text-[#888]"
            style={{ fontFamily: "'Pretendard', sans-serif", fontSize: 'clamp(13px, 0.9vw, 16px)', fontWeight: 500 }}
          >
            {subtitle}
          </p>
        </div>

        {/* 수강료 카드 3개 */}
        {plans.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {plans.map((plan, i) => (
              <div
                key={i}
                style={{
                  border: '1px solid #E0E0E0',
                  borderRadius: '16px',
                  padding: '32px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  backgroundColor: '#ffffff',
                }}
              >
                <p
                  style={{
                    fontFamily: "'Pretendard', sans-serif",
                    fontSize: 'clamp(11px, 0.8vw, 13px)',
                    fontWeight: 500,
                    color: '#888',
                    textAlign: 'center',
                  }}
                >
                  {plan.category}
                </p>
                <p
                  style={{
                    fontFamily: "'Pretendard', sans-serif",
                    fontSize: 'clamp(14px, 1vw, 18px)',
                    fontWeight: 700,
                    color: '#1A1A1A',
                    textAlign: 'center',
                  }}
                >
                  {plan.class_name}
                </p>
                <p
                  style={{
                    fontFamily: "'Pretendard', sans-serif",
                    fontSize: 'clamp(24px, 2vw, 36px)',
                    fontWeight: 800,
                    color: mainColor,
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}
                >
                  {plan.price}
                </p>
                <p
                  style={{
                    fontFamily: "'Pretendard', sans-serif",
                    fontSize: 'clamp(11px, 0.8vw, 13px)',
                    color: '#888',
                    textAlign: 'center',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {plan.desc}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* 장학 혜택 박스 */}
        {(scholarshipTags.length > 0 || scholarshipBody) && (
          <div style={{ backgroundColor: lightBg, borderRadius: '16px', padding: '32px' }}>
            <h3
              style={{
                fontFamily: "'Pretendard', sans-serif",
                fontSize: 'clamp(15px, 1.1vw, 18px)',
                fontWeight: 700,
                color: '#1A1A1A',
                textAlign: 'center',
                marginBottom: '16px',
              }}
            >
              장학 혜택 및 할인 안내
            </h3>

            {scholarshipTags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
                {scholarshipTags.map((tag) => (
                  <span
                    key={tag.id}
                    style={{
                      fontFamily: "'Pretendard', sans-serif",
                      fontSize: 'clamp(11px, 0.75vw, 13px)',
                      fontWeight: 500,
                      color: mainColor,
                      backgroundColor: '#ffffff',
                      padding: '5px 14px',
                      borderRadius: '20px',
                      border: `1px solid ${mainColor}`,
                    }}
                  >
                    {tag.value}
                  </span>
                ))}
              </div>
            )}

            {scholarshipBody && (
              <p
                style={{
                  fontFamily: "'Pretendard', sans-serif",
                  fontSize: 'clamp(12px, 0.85vw, 15px)',
                  color: '#444',
                  textAlign: 'center',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-line',
                }}
                dangerouslySetInnerHTML={{ __html: scholarshipBody }}
              />
            )}
          </div>
        )}

      </div>
    </section>
  );
}