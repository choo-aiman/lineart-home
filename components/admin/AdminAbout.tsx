// AdminAbout
// 이유: 기존 디자인 편집 탭이 너무 길어서 학원소개 페이지 편집만 따로 분리
//       + 페이지 제목("애니반 소개")과 부제목을 관리자에서 고칠 수 있게 추가

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminAboutSlides from '@/components/admin/AdminAboutSlides';
import AdminInstructors from '@/components/admin/AdminInstructors';
import AdminFacilities from '@/components/admin/AdminFacilities';

type Mode = 'ani' | 'fine';

interface ContentRow {
  id: number;
  mode: string;
  section: string;
  key: string;
  value: string;
}

// 애니/회화 각각 따로 저장됨 (site_content 의 mode 로 구분)
const HEADING_DEFAULTS: Record<Mode, { title: string; subtitle: string }> = {
  ani:  { title: '애니반 소개', subtitle: '라인아트 애니반을 소개합니다' },
  fine: { title: '회화반 소개', subtitle: '라인아트 회화반을 소개합니다' },
};

// PC(화면 100%) 기준 글자 크기 — 휴대폰에서는 같은 비율로 자동 축소됨
const DEFAULT_TITLE_SIZE = 32;
const DEFAULT_SUBTITLE_SIZE = 16;
// heading_ 접두사: site_content 에 예전부터 있던 title/subtitle 값과 겹치지 않게
const HEADING_KEYS = ['heading_title', 'heading_subtitle', 'heading_title_size', 'heading_subtitle_size'] as const;

type HeadingEdits = {
  heading_title: string;
  heading_subtitle: string;
  heading_title_size: string;
  heading_subtitle_size: string;
};

export default function AdminAbout() {
  const [mode, setMode] = useState<Mode>('ani');

  const [headingContents, setHeadingContents] = useState<ContentRow[]>([]);
  const [headingEdits, setHeadingEdits] = useState<HeadingEdits>({
    heading_title: HEADING_DEFAULTS.ani.title,
    heading_subtitle: HEADING_DEFAULTS.ani.subtitle,
    heading_title_size: String(DEFAULT_TITLE_SIZE),
    heading_subtitle_size: String(DEFAULT_SUBTITLE_SIZE),
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchHeading();
  }, [mode]);

  async function fetchHeading() {
    const { data } = await supabase
      .from('site_content')
      .select('*')
      .eq('mode', mode)
      .eq('section', 'about');
    const rows = data ?? [];
    setHeadingContents(rows);
    const pick = (key: string) => rows.find((r) => r.key === key)?.value;
    setHeadingEdits({
      heading_title: pick('heading_title') || HEADING_DEFAULTS[mode].title,
      heading_subtitle: pick('heading_subtitle') || HEADING_DEFAULTS[mode].subtitle,
      heading_title_size: pick('heading_title_size') || String(DEFAULT_TITLE_SIZE),
      heading_subtitle_size: pick('heading_subtitle_size') || String(DEFAULT_SUBTITLE_SIZE),
    });
  }

  async function saveHeading() {
    setSaving(true);
    for (const key of HEADING_KEYS) {
      const existing = headingContents.find((r) => r.key === key);
      if (existing) {
        await supabase.from('site_content').update({ value: headingEdits[key] }).eq('id', existing.id);
      } else {
        await supabase.from('site_content').insert({ mode, section: 'about', key, value: headingEdits[key] });
      }
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    fetchHeading();
  }

  const sectionBox: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #E0E0E0',
    padding: '24px',
    marginBottom: '20px',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Pretendard', sans-serif",
    fontSize: '12px',
    fontWeight: 600,
    color: '#888',
    marginBottom: '6px',
    display: 'block',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #E0E0E0',
    borderRadius: '8px',
    fontFamily: "'Pretendard', sans-serif",
    fontSize: '14px',
    color: '#1A1A1A',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const titleSize = Number(headingEdits.heading_title_size) || DEFAULT_TITLE_SIZE;
  const subtitleSize = Number(headingEdits.heading_subtitle_size) || DEFAULT_SUBTITLE_SIZE;

  // 글자 크기 조절바 (PC 100% 기준 px, 휴대폰에서는 비율대로 자동 축소)
  function sizeSlider(label: string, key: 'heading_title_size' | 'heading_subtitle_size', min: number, max: number, defaultSize: number) {
    const value = Number(headingEdits[key]) || defaultSize;
    return (
      <div style={{ marginTop: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>{label}</label>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', fontWeight: 700, color: '#1A1A1A' }}>
              {value}px
            </span>
            {value !== defaultSize && (
              <button
                onClick={() => setHeadingEdits((prev) => ({ ...prev, [key]: String(defaultSize) }))}
                style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '11px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                기본값({defaultSize})
              </button>
            )}
          </span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(e) => setHeadingEdits((prev) => ({ ...prev, [key]: e.target.value }))}
          style={{ width: '100%', accentColor: '#FF1659', cursor: 'pointer' }}
        />
      </div>
    );
  }

  return (
    <div>
      {/* 페이지 제목 + 모드 탭 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '22px', fontWeight: 900, color: '#1A1A1A' }}>
          학원소개 관리
        </h2>
        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#F5F5F5', borderRadius: '10px', padding: '4px' }}>
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
      </div>

      {/* ── 페이지 제목 ── */}
      <div style={sectionBox}>
        <h3 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '16px', fontWeight: 700, color: '#1A1A1A', marginBottom: '20px' }}>
          페이지 제목
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>제목</label>
            <input
              type="text"
              value={headingEdits.heading_title}
              onChange={(e) => setHeadingEdits((prev) => ({ ...prev, heading_title: e.target.value }))}
              placeholder={HEADING_DEFAULTS[mode].title}
              style={inputStyle}
            />
            {sizeSlider('제목 크기', 'heading_title_size', 18, 64, DEFAULT_TITLE_SIZE)}
          </div>
          <div>
            <label style={labelStyle}>부제목</label>
            <input
              type="text"
              value={headingEdits.heading_subtitle}
              onChange={(e) => setHeadingEdits((prev) => ({ ...prev, heading_subtitle: e.target.value }))}
              placeholder={HEADING_DEFAULTS[mode].subtitle}
              style={inputStyle}
            />
            {sizeSlider('부제목 크기', 'heading_subtitle_size', 11, 32, DEFAULT_SUBTITLE_SIZE)}
          </div>
        </div>

        {/* 미리보기 — 실제 화면(PC 100%)에서 보이는 크기 그대로 */}
        <div style={{ marginTop: '20px', border: '1px solid #F0F0F0', borderRadius: '10px', padding: '20px', backgroundColor: '#FAFAFA' }}>
          <span style={{ ...labelStyle, marginBottom: '12px' }}>미리보기 (PC 화면 100% 기준)</span>
          <p style={{ fontFamily: "'Pretendard', sans-serif", fontWeight: 900, color: '#1A1A1A', fontSize: `${titleSize}px`, margin: '0 0 8px' }}>
            {headingEdits.heading_title || HEADING_DEFAULTS[mode].title}
          </p>
          <p style={{ fontFamily: "'Pretendard', sans-serif", fontWeight: 500, color: '#888', fontSize: `${subtitleSize}px`, margin: 0 }}>
            {headingEdits.heading_subtitle || HEADING_DEFAULTS[mode].subtitle}
          </p>
        </div>
        <button
          onClick={saveHeading}
          disabled={saving}
          style={{
            marginTop: '20px',
            padding: '10px 24px',
            backgroundColor: saved ? '#4CAF50' : '#FF1659',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontFamily: "'Pretendard', sans-serif",
            fontSize: '14px',
            fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            transition: 'background-color 0.3s',
          }}
        >
          {saving ? '저장 중...' : saved ? '저장 완료 ✓' : '저장'}
        </button>
      </div>

      {/* ── 소개 슬라이드 ── */}
      <div style={sectionBox}>
        <AdminAboutSlides mode={mode} />
      </div>

      {/* ── 강사진 + 해시태그 ── */}
      <div style={sectionBox}>
        <AdminInstructors mode={mode} />
      </div>

      {/* ── 시설 안내 ── */}
      <div style={sectionBox}>
        <AdminFacilities mode={mode} />
      </div>
    </div>
  );
}
