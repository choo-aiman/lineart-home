'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Graduate {
  year: number;
  category: string;
  student_name: string;
  university: string;
  department: string;
}

interface YearData {
  year: number;
  ani: Graduate[];
  fine: Graduate[];
  high: Graduate[];
  employ: Graduate[];
}

const COLORS = {
  employ: '#555555',
  high:   '#FFB3C6',
  fine:   '#515883',
  ani:    '#FF1659',
};

const TEXT_COLORS = {
  employ: '#ffffff',
  high:   '#FF1659',
  fine:   '#ffffff',
  ani:    '#ffffff',
};

const LABELS = {
  ani:    '애니',
  fine:   '회화',
  high:   '고입',
  employ: '임용',
};

const ROW_H = 16; // ← 20px에서 4px 줄임 (상하 2px씩)

function maskName(name: string): string {
  const len = name.length;
  if (len <= 1) return name;
  if (len === 2) return name[0] + 'O';
  if (len === 3) return name[0] + 'O' + name[2];
  return name[0] + 'O'.repeat(len - 2) + name[len - 1];
}

export default function GraduatesGraph() {
  const [data, setData]         = useState<YearData[]>([]);
  const [animated, setAnimated] = useState(false);
  const sectionRef              = useRef<HTMLElement>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: rows } = await supabase
        .from('graduates')
        .select('year, category, student_name, university, department')
        .order('year');
      if (!rows) return;

      const yearMap: Record<number, YearData> = {};
      rows.forEach((r) => {
        if (!yearMap[r.year]) {
          yearMap[r.year] = { year: r.year, ani: [], fine: [], high: [], employ: [] };
        }
        const cat = r.category as keyof Omit<YearData, 'year'>;
        if (yearMap[r.year][cat]) yearMap[r.year][cat].push(r);
      });
      setData(Object.values(yearMap).sort((a, b) => a.year - b.year));
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (data.length === 0) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated) {
          setTimeout(() => setAnimated(true), 200);
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [data, animated]);

  const maxCount = Math.max(
    ...data.map((y) =>
      y.employ.length + y.high.length + y.fine.length + y.ani.length
    ),
    1
  );
  const maxBarH = maxCount * ROW_H;
  const layerOrder: (keyof typeof COLORS)[] = ['employ', 'high', 'fine', 'ani'];

  return (
    <section ref={sectionRef} className="w-full bg-white py-16">
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 4vw' }}>

        {/* 제목 */}
        <div className="mb-10">
          <h2
            className="font-black text-[#1A1A1A] mb-2"
            style={{ fontFamily: "'Pretendard', sans-serif", fontSize: 'clamp(22px, 2vw, 32px)' }}
          >
            합격자 현황
          </h2>
          <p
            className="text-[#888]"
            style={{ fontFamily: "'Pretendard', sans-serif", fontSize: 'clamp(13px, 0.9vw, 16px)', fontWeight: 500 }}
          >
            역대 합격 실적을 한 눈에 볼 수 있도록 준비했습니다
          </p>

          {/* 범례 */}
          <div className="flex gap-5 mt-3 flex-wrap">
            {(Object.keys(LABELS) as (keyof typeof LABELS)[]).map((key) => (
              <div key={key} className="flex items-center gap-1.5">
                <span
                  className="inline-block rounded-full"
                  style={{
                    width: '10px',
                    height: '10px',
                    backgroundColor: COLORS[key],
                    border: key === 'high' ? '1px solid #FFB3C6' : 'none',
                  }}
                />
                <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', fontWeight: 500, color: '#555' }}>
                  {LABELS[key]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 그래프 */}
        <div className="w-full" style={{ overflowX: 'hidden' }}>
          <div style={{ width: '100%' }}>

            {/* 막대들 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                height: `${maxBarH + 16}px`,
                gap: '4px',
                width: '100%',
              }}
            >
              {data.map((yearData, colIdx) => {
                const totalCount = layerOrder.reduce(
                  (sum, cat) => sum + yearData[cat].length, 0
                );
                const barH = totalCount * ROW_H;

                return (
                  <div
                    key={yearData.year}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        height: animated ? `${barH}px` : '0px',
                        transition: `height 1s cubic-bezier(0.22,1,0.36,1) ${colIdx * 100}ms`,
                        overflow: 'hidden',
                        borderRadius: '4px 4px 0 0',
                        display: 'flex',
                        flexDirection: 'column-reverse',
                      }}
                    >
                      {layerOrder.map((cat) => {
                        const items = yearData[cat];
                        if (items.length === 0) return null;
                        return (
                          <div
                            key={cat}
                            style={{
                              backgroundColor: COLORS[cat],
                              height: `${items.length * ROW_H}px`,
                              flexShrink: 0,
                              overflow: 'hidden',
                            }}
                          >
                            {items.map((g, i) => (
                              <div
                                key={i}
                                style={{
                                  height: `${ROW_H}px`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '0 4px',
                                  overflow: 'hidden',
                                  gap: '3px',
                                }}
                              >
                                {/* 학교+학과 — 400 */}
                                <span
                                  style={{
                                    fontFamily: "'Pretendard', sans-serif",
                                    fontSize: '8px',
                                    fontWeight: 400,
                                    color: TEXT_COLORS[cat],
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    flex: '1 1 0',
                                    minWidth: 0,
                                  }}
                                >
                                  {g.university} {g.department}
                                </span>

                                {/* 이름 — 500 */}
                                <span
                                  style={{
                                    fontFamily: "'Pretendard', sans-serif",
                                    fontSize: '8px',
                                    fontWeight: 500,
                                    color: TEXT_COLORS[cat],
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                  }}
                                >
                                  {maskName(g.student_name)}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 연도 바 */}
            <div
              style={{
                display: 'flex',
                gap: '4px',
                width: '100%',
                marginTop: '6px',
              }}
            >
              {data.map((yearData, colIdx) => (
                <div
                  key={yearData.year}
                  style={{
                    flex: 1,
                    backgroundColor: '#555555',
                    padding: '5px 0',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: animated ? 1 : 0,
                    transition: `opacity 0.5s ease ${colIdx * 100}ms`,
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Pretendard', sans-serif",
                      fontSize: 'clamp(10px, 0.8vw, 13px)',
                      fontWeight: 700,
                      color: '#ffffff',
                    }}
                  >
                    {yearData.year}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}