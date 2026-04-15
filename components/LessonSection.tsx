// LessonSection 컴포넌트 생성
// 이유: 수업 안내 표 — Supabase lesson_schedules 테이블에서 데이터 불러오기

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Schedule {
  id: number;
  mode: string;
  order: number;
  class_name: string;
  days: string;
  hours: string;
  contents: string;
  note: string;
}

export default function LessonSection({ mode }: { mode: string }) {
  const isAni = mode === 'ani';
  const mainColor = isAni ? '#FF1659' : '#515883';
  const lightBg = isAni ? '#FFF0F4' : '#ECEEF5';
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('lesson_schedules')
        .select('*')
        .eq('mode', mode)
        .order('order');
      if (data) setSchedules(data);
    }
    fetch();
  }, [mode]);

  return (
    <section className="w-full bg-white">
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '80px 4vw 60px' }}>

        {/* 섹션 타이틀 */}
        <div className="mb-10">
          <h2
            className="font-black text-[#1A1A1A] mb-2"
            style={{ fontFamily: "'Pretendard', sans-serif", fontSize: 'clamp(22px, 2vw, 32px)' }}
          >
            수업 안내
          </h2>
          <p
            className="text-[#888]"
            style={{ fontFamily: "'Pretendard', sans-serif", fontSize: 'clamp(13px, 0.9vw, 16px)', fontWeight: 500 }}
          >
            {isAni ? '만화·애니메이션반 클래스와 시간표를 확인하세요' : '회화반 클래스와 시간표를 확인하세요'}
          </p>
        </div>

        {/* 표 */}
        {schedules.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr style={{ backgroundColor: mainColor }}>
                  {['클래스', '요일', '시간', '수업 내용', '비고'].map((h) => (
                    <th
                      key={h}
                      style={{
                        fontFamily: "'Pretendard', sans-serif",
                        fontSize: 'clamp(12px, 0.85vw, 14px)',
                        fontWeight: 700,
                        color: '#ffffff',
                        padding: '14px 16px',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {schedules.map((row, i) => {
                  const contentItems = row.contents
                  ? row.contents.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
                  : [];
                const noteItems = row.note
                  ? row.note.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
                  : [];
                  return (
                    <tr
                      key={row.id}
                      style={{ borderBottom: '1px solid #F0F0F0', backgroundColor: i % 2 === 0 ? '#ffffff' : '#FAFAFA' }}
                    >
                      {/* 클래스 */}
                      <td
                        style={{
                          fontFamily: "'Pretendard', sans-serif",
                          fontSize: 'clamp(12px, 0.85vw, 14px)',
                          fontWeight: 600,
                          color: '#1A1A1A',
                          padding: '16px',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {row.class_name}
                      </td>

                      {/* 요일 */}
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span
                          style={{
                            fontFamily: "'Pretendard', sans-serif",
                            fontSize: 'clamp(11px, 0.8vw, 13px)',
                            fontWeight: 700,
                            color: mainColor,
                            backgroundColor: lightBg,
                            padding: '4px 10px',
                            borderRadius: '20px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {row.days}
                        </span>
                      </td>

                      {/* 시간 */}
                      <td
                        style={{
                          fontFamily: "'Pretendard', sans-serif",
                          fontSize: 'clamp(12px, 0.85vw, 14px)',
                          color: '#444',
                          padding: '16px',
                          textAlign: 'center',
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {row.hours}
                      </td>

                      {/* 수업 내용 */}
                      <td style={{ padding: '16px' }}>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: 0, padding: 0 }}>
                          {contentItems.map((item, j) => (
                            <li
                              key={j}
                              style={{
                                fontFamily: "'Pretendard', sans-serif",
                                fontSize: 'clamp(11px, 0.8vw, 13px)',
                                color: '#444',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '6px',
                                listStyle: 'none',
                              }}
                            >
                              <span style={{ color: mainColor, fontWeight: 700, flexShrink: 0 }}>•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </td>

                      {/* 비고 */}
                      <td style={{ padding: '16px' }}>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: 0, padding: 0 }}>
                          {noteItems.map((item, j) => (
                            <li
                              key={j}
                              style={{
                                fontFamily: "'Pretendard', sans-serif",
                                fontSize: 'clamp(11px, 0.8vw, 13px)',
                                color: '#444',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '6px',
                                listStyle: 'none',
                              }}
                            >
                              <span style={{ color: mainColor, fontWeight: 700, flexShrink: 0 }}>•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 해시태그 */}
        <LessonHashtags mode={mode} mainColor={mainColor} />

      </div>
    </section>
  );
}

function LessonHashtags({ mode, mainColor }: { mode: string; mainColor: string }) {
  const [tags, setTags] = useState<{ id: number; value: string }[]>([]);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('tuition_info')
        .select('id, value')
        .eq('mode', mode)
        .eq('section', 'lesson_hashtags')
        .order('id');
      if (data) setTags(data);
    }
    fetch();
  }, [mode]);

  if (tags.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '28px', justifyContent: 'center' }}>
      {tags.map((tag) => (
        <span
          key={tag.id}
          style={{
            fontFamily: "'Pretendard', sans-serif",
            fontSize: 'clamp(11px, 0.75vw, 13px)',
            fontWeight: 500,
            color: mainColor,
            backgroundColor: mode === 'ani' ? '#FFF0F4' : '#ECEEF5',
            padding: '5px 14px',
            borderRadius: '20px',
            border: `1px solid ${mainColor}`,
          }}
        >
          {tag.value}
        </span>
      ))}
    </div>
  );
}