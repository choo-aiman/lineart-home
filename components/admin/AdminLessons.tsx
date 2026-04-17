// AdminLessons 수정
// 이유: 수업 시간표를 표 형태 인라인 편집으로 변경

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Mode = 'ani' | 'fine';

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

interface TuitionInfo {
  id: number;
  mode: string;
  section: string;
  key: string;
  value: string;
}

export default function AdminLessons() {
  const [mode, setMode] = useState<Mode>('ani');
  const isAni = mode === 'ani';
  const mainColor = isAni ? '#FF1659' : '#515883';

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [tuitionInfo, setTuitionInfo] = useState<TuitionInfo[]>([]);
  const [tuitionEdits, setTuitionEdits] = useState<Record<string, string>>({});
  const [savingTuition, setSavingTuition] = useState(false);
  const [savedTuition, setSavedTuition] = useState(false);

  useEffect(() => {
    fetchSchedules();
    fetchTuition();
  }, [mode]);

  async function fetchSchedules() {
    const { data } = await supabase
      .from('lesson_schedules')
      .select('*')
      .eq('mode', mode)
      .order('order');
    if (data) setSchedules(data);
  }

  async function fetchTuition() {
    const { data } = await supabase
      .from('tuition_info')
      .select('*')
      .eq('mode', mode)
      .order('id');
    if (data) {
      setTuitionInfo(data);
      const edits: Record<string, string> = {};
      data.forEach((r) => { edits[`${r.section}_${r.key}`] = r.value; });
      setTuitionEdits(edits);
    }
  }

  function updateSchedule(id: number, field: keyof Schedule, value: string) {
    setSchedules((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
  }

  async function saveAllSchedules() {
    setSaving(true);
    for (const sch of schedules) {
      const { error } = await supabase
        .from('lesson_schedules')
        .update({
          class_name: sch.class_name,
          days: sch.days,
          hours: sch.hours,
          contents: sch.contents,
          note: sch.note,
          order: Number(sch.order),
        })
        .eq('id', sch.id);
      if (error) alert('저장 실패: ' + error.message);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function addSchedule() {
    const newOrder = schedules.length + 1;
    const { data } = await supabase
      .from('lesson_schedules')
      .insert({
        mode,
        order: newOrder,
        class_name: '새 클래스',
        days: '',
        hours: '',
        contents: '',
        note: '',
      })
      .select()
      .single();
    if (data) setSchedules((prev) => [...prev, data]);
  }

  async function deleteSchedule(id: number) {
    if (!confirm('이 수업을 삭제할까요?')) return;
    await supabase.from('lesson_schedules').delete().eq('id', id);
    fetchSchedules();
  }

  async function saveTuition() {
    setSavingTuition(true);
    for (const row of tuitionInfo) {
      const editKey = `${row.section}_${row.key}`;
      const newValue = tuitionEdits[editKey] ?? row.value;
      await supabase.from('tuition_info').update({ value: newValue }).eq('id', row.id);
    }
    setSavingTuition(false);
    setSavedTuition(true);
    setTimeout(() => setSavedTuition(false), 2000);
    fetchTuition();
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid transparent',
    borderRadius: '6px',
    fontFamily: "'Pretendard', sans-serif",
    fontSize: '12px',
    color: '#1A1A1A',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: 'transparent',
    transition: 'border-color 0.15s, background-color 0.15s',
  };

  const inputFocusStyle = {
    borderColor: '#E0E0E0',
    backgroundColor: '#ffffff',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Pretendard', sans-serif",
    fontSize: '12px',
    fontWeight: 600,
    color: '#888',
    marginBottom: '4px',
    display: 'block',
  };

  const formInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #E0E0E0',
    borderRadius: '8px',
    fontFamily: "'Pretendard', sans-serif",
    fontSize: '13px',
    color: '#1A1A1A',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const sectionBox: React.CSSProperties = {
    backgroundColor: '#ffffff',
    border: '1px solid #E0E0E0',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
  };

  const thStyle: React.CSSProperties = {
    fontFamily: "'Pretendard', sans-serif",
    fontSize: '12px',
    fontWeight: 700,
    color: '#ffffff',
    backgroundColor: mainColor,
    padding: '12px 8px',
    textAlign: 'center',
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: '8px',
    borderBottom: '1px solid #F0F0F0',
    verticalAlign: 'top',
  };

  const scholarshipTags = tuitionInfo
    .filter((r) => r.section === 'scholarship' && r.key === 'tag')
    .map((r) => ({ id: r.id, value: r.value }));
  const scholarshipBody = tuitionEdits['scholarship_body'] ?? '';
  const tuitionTitle = tuitionEdits['tuition_title'] ?? '';
  const tuitionSubtitle = tuitionEdits['tuition_subtitle'] ?? '';

  return (
    <div>
      <h2 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '22px', fontWeight: 900, color: '#1A1A1A', marginBottom: '16px' }}>
        수업안내 관리
      </h2>

      {/* 모드 탭 */}
      <div style={{ display: 'flex', gap: '4px', backgroundColor: '#F5F5F5', borderRadius: '10px', padding: '4px', marginBottom: '24px', width: 'fit-content' }}>
        {(['ani', 'fine'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              fontFamily: "'Pretendard', sans-serif",
              fontSize: '13px',
              fontWeight: 600,
              padding: '6px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: mode === m ? '#ffffff' : 'transparent',
              color: mode === m ? '#1A1A1A' : '#888',
              boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {m === 'ani' ? '만화·애니' : '회화'}
          </button>
        ))}
      </div>

      {/* ── 수업 시간표 (표 형태) ── */}
      <div style={sectionBox}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '16px', fontWeight: 700, color: '#1A1A1A', marginBottom: '4px' }}>
              수업 시간표
            </h3>
            <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888' }}>
              셀을 클릭하면 바로 편집할 수 있어요
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={addSchedule}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: mainColor,
                border: `1px solid ${mainColor}`,
                borderRadius: '8px',
                fontFamily: "'Pretendard', sans-serif",
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              + 행 추가
            </button>
            <button
              onClick={saveAllSchedules}
              disabled={saving}
              style={{
                padding: '8px 16px',
                backgroundColor: saved ? '#4CAF50' : mainColor,
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontFamily: "'Pretendard', sans-serif",
                fontSize: '13px',
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.3s',
              }}
            >
              {saving ? '저장 중...' : saved ? '저장 완료 ✓' : '전체 저장'}
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr>
              <th style={{ ...thStyle, width: '140px' }}>클래스</th>
                <th style={{ ...thStyle, width: '100px' }}>요일</th>
                <th style={{ ...thStyle, width: '160px' }}>시간</th>
                <th style={{ ...thStyle, width: '350px' }}>수업 내용</th>
                <th style={{ ...thStyle, width: '150px' }}>비고</th>
                <th style={{ ...thStyle, width: '50px' }}>삭제</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((sch, i) => (
                <tr key={sch.id} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#FAFAFA' }}>
                  {/* 클래스명 */}
                  <td style={tdStyle}>
                    <input
                      type="text"
                      value={sch.class_name}
                      onChange={(e) => updateSchedule(sch.id, 'class_name', e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#E0E0E0';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'transparent';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    />
                  </td>

                  {/* 요일 */}
                  <td style={tdStyle}>
                    <input
                      type="text"
                      value={sch.days}
                      onChange={(e) => updateSchedule(sch.id, 'days', e.target.value)}
                      style={{ ...inputStyle, textAlign: 'center' }}
                      placeholder="화·수·목·금"
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#E0E0E0';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'transparent';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    />
                  </td>

                  {/* 시간 */}
                  <td style={tdStyle}>
                    <textarea
                      value={sch.hours}
                      onChange={(e) => updateSchedule(sch.id, 'hours', e.target.value)}
                      rows={5}
                      style={{ ...inputStyle, resize: 'none', textAlign: 'center' }}
                      placeholder="6pm-10pm"
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#E0E0E0';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'transparent';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    />
                  </td>

                  {/* 수업 내용 */}
                  <td style={tdStyle}>
                    <textarea
                      value={sch.contents}
                      onChange={(e) => updateSchedule(sch.id, 'contents', e.target.value)}
                      rows={5}
                      style={{ ...inputStyle, resize: 'none' }}
                      placeholder="내용1&#10;내용2"
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#E0E0E0';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'transparent';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    />
                  </td>

                  {/* 비고 */}
                  <td style={tdStyle}>
                    <textarea
                      value={sch.note}
                      onChange={(e) => updateSchedule(sch.id, 'note', e.target.value)}
                      rows={5}
                      style={{ ...inputStyle, resize: 'none' }}
                      placeholder="비고1&#10;비고2"
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#E0E0E0';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'transparent';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    />
                  </td>

                  {/* 삭제 */}
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button
                      onClick={() => deleteSchedule(sch.id)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: 'transparent',
                        color: '#FF1659',
                        border: '1px solid #FF1659',
                        borderRadius: '6px',
                        fontFamily: "'Pretendard', sans-serif",
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 수강료 안내 ── */}
      <div style={sectionBox}>
        <h3 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '16px', fontWeight: 700, color: '#1A1A1A', marginBottom: '16px' }}>
          수강료 안내
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>제목</label>
            <input
              type="text"
              value={tuitionTitle}
              onChange={(e) => setTuitionEdits((prev) => ({ ...prev, tuition_title: e.target.value }))}
              style={formInputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>소제목</label>
            <input
              type="text"
              value={tuitionSubtitle}
              onChange={(e) => setTuitionEdits((prev) => ({ ...prev, tuition_subtitle: e.target.value }))}
              style={formInputStyle}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{ border: '1px solid #F0F0F0', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
                플랜 {n}
              </p>
              <div>
                <label style={labelStyle}>카테고리</label>
                <input type="text" value={tuitionEdits[`plan_category_${n}`] ?? ''} onChange={(e) => setTuitionEdits((prev) => ({ ...prev, [`plan_category_${n}`]: e.target.value }))} style={formInputStyle} placeholder="만화·애니메이션" />
              </div>
              <div>
                <label style={labelStyle}>클래스명</label>
                <input type="text" value={tuitionEdits[`plan_class_${n}`] ?? ''} onChange={(e) => setTuitionEdits((prev) => ({ ...prev, [`plan_class_${n}`]: e.target.value }))} style={formInputStyle} placeholder="대입·고입 입시 대비반" />
              </div>
              <div>
                <label style={labelStyle}>가격</label>
                <input type="text" value={tuitionEdits[`plan_price_${n}`] ?? ''} onChange={(e) => setTuitionEdits((prev) => ({ ...prev, [`plan_price_${n}`]: e.target.value }))} style={formInputStyle} placeholder="월 70만원" />
              </div>
              <div>
                <label style={labelStyle}>설명</label>
                <input type="text" value={tuitionEdits[`plan_desc_${n}`] ?? ''} onChange={(e) => setTuitionEdits((prev) => ({ ...prev, [`plan_desc_${n}`]: e.target.value }))} style={formInputStyle} placeholder="주 6회, 풀타임 기준" />
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>장학 혜택 태그 (각 행이 태그 하나예요)</label>
          {scholarshipTags.map((tag) => (
            <div key={tag.id} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
              <input
                type="text"
                value={tag.value}
                onChange={async (e) => {
                  const newVal = e.target.value;
                  setTuitionInfo((prev) => prev.map((r) => r.id === tag.id ? { ...r, value: newVal } : r));
                  await supabase.from('tuition_info').update({ value: newVal }).eq('id', tag.id);
                }}
                style={{ ...formInputStyle, flex: 1 }}
              />
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>장학 본문</label>
          <textarea
            value={scholarshipBody}
            onChange={(e) => setTuitionEdits((prev) => ({ ...prev, scholarship_body: e.target.value }))}
            rows={4}
            style={{ ...formInputStyle, resize: 'vertical' }}
          />
        </div>

        <button
          onClick={saveTuition}
          disabled={savingTuition}
          style={{
            padding: '10px 24px',
            backgroundColor: savedTuition ? '#4CAF50' : mainColor,
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontFamily: "'Pretendard', sans-serif",
            fontSize: '14px',
            fontWeight: 700,
            cursor: savingTuition ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s',
          }}
        >
          {savingTuition ? '저장 중...' : savedTuition ? '저장 완료 ✓' : '수강료 전체 저장'}
        </button>
      </div>
    </div>
  );
}