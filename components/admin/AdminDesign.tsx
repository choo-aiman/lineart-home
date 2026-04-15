// AdminDesign 수정
// 이유: 푸터 섹션 추가 + Footer.tsx Supabase 연동

'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import AdminAboutSlides from '@/components/admin/AdminAboutSlides';

type Mode = 'ani' | 'fine';

interface ContentRow {
  id: number;
  mode: string;
  section: string;
  key: string;
  value: string;
}

const SUPABASE_URL = 'https://pjqoanpmlunynhsumeso.supabase.co';
const IMG_BASE = `${SUPABASE_URL}/storage/v1/object/public/images`;

const HERO_KEYS = [
  { key: 'title',     label: '메인 제목', multiline: true },
  { key: 'desc1',     label: '설명 1',    multiline: false },
  { key: 'desc2',     label: '설명 2',    multiline: false },
  { key: 'desc3',     label: '설명 3',    multiline: false },
  { key: 'btn_label', label: '버튼 라벨', multiline: false },
];

const STATS_KEYS = [
  'stat1_value', 'stat1_suffix', 'stat1_label',
  'stat2_value', 'stat2_suffix', 'stat2_label',
  'stat3_value', 'stat3_suffix', 'stat3_label',
  'stat4_value', 'stat4_suffix', 'stat4_label',
];

const ALL_CARD_KEYS = [
  'section_title', 'section_subtitle',
  'card1_tag', 'card1_title', 'card1_desc',
  'card2_tag', 'card2_title', 'card2_desc',
  'card3_tag', 'card3_title', 'card3_desc',
];

function ImageUploader({
  label,
  fileName,
  hint,
  onUploaded,
}: {
  label: string;
  fileName: string;
  hint?: string;
  onUploaded: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [preview, setPreview] = useState(`${IMG_BASE}/${fileName}?t=${Date.now()}`);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    const { error } = await supabase.storage
      .from('images')
      .upload(fileName, file, { upsert: true, contentType: file.type });
    if (!error) {
      setPreview(`${IMG_BASE}/${fileName}?t=${Date.now()}`);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
      onUploaded();
    }
    setUploading(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', fontWeight: 600, color: '#888' }}>
        {label}
      </span>
      {hint && (
        <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '11px', color: '#aaa' }}>
          {hint}
        </span>
      )}
      <div style={{ width: '100%', aspectRatio: '4/3', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#F5F5F5' }}>
        <img
          src={preview}
          alt={label}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) uploadFile(file);
        }}
        style={{
          border: `2px dashed ${dragging ? '#FF1659' : '#E0E0E0'}`,
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: dragging ? '#FFF0F4' : '#FAFAFA',
          transition: 'all 0.15s',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadFile(file);
          }}
        />
        <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: uploading ? '#FF1659' : done ? '#4CAF50' : '#888', margin: 0 }}>
          {uploading ? '업로드 중...' : done ? '✓ 업로드 완료!' : '이미지를 드래그하거나 클릭해서 업로드'}
        </p>
      </div>
    </div>
  );
}

export default function AdminDesign() {
  const [mode, setMode] = useState<Mode>('ani');
  const [imgKey, setImgKey] = useState(0);

  // 히어로
  const [heroContents, setHeroContents] = useState<ContentRow[]>([]);
  const [heroEdits, setHeroEdits] = useState<Record<string, string>>({});
  const [heroSaving, setHeroSaving] = useState(false);
  const [heroSaved, setHeroSaved] = useState(false);

  // 클래스 카드
  const [cardContents, setCardContents] = useState<ContentRow[]>([]);
  const [cardEdits, setCardEdits] = useState<Record<string, string>>({});
  const [cardSaving, setCardSaving] = useState(false);
  const [cardSaved, setCardSaved] = useState(false);

  // 입시실적
  const [statsContents, setStatsContents] = useState<ContentRow[]>([]);
  const [statsEdits, setStatsEdits] = useState<Record<string, string>>({});
  const [statsSaving, setStatsSaving] = useState(false);
  const [statsSaved, setStatsSaved] = useState(false);

  // 푸터
  const [footerContents, setFooterContents] = useState<ContentRow[]>([]);
  const [footerEdits, setFooterEdits] = useState<Record<string, string>>({});
  const [footerSaving, setFooterSaving] = useState(false);
  const [footerSaved, setFooterSaved] = useState(false);

  useEffect(() => {
    fetchHero();
    fetchCards();
    fetchStats();
    fetchFooter();
  }, [mode]);

  async function fetchHero() {
    const { data } = await supabase
      .from('site_content')
      .select('*')
      .eq('mode', mode)
      .eq('section', 'hero');
    if (data) {
      setHeroContents(data);
      const edits: Record<string, string> = {};
      data.forEach((r) => { edits[r.key] = r.value; });
      setHeroEdits(edits);
    }
  }

  async function fetchCards() {
    const { data } = await supabase
      .from('site_content')
      .select('*')
      .eq('mode', mode)
      .eq('section', 'class_cards');
    if (data) {
      setCardContents(data);
      const edits: Record<string, string> = {};
      data.forEach((r) => { edits[r.key] = r.value; });
      setCardEdits(edits);
    }
  }

  async function fetchStats() {
    const { data } = await supabase
      .from('site_content')
      .select('*')
      .eq('mode', mode)
      .eq('section', 'stats_banner');
    if (data) {
      setStatsContents(data);
      const edits: Record<string, string> = {};
      data.forEach((r) => { edits[r.key] = r.value; });
      setStatsEdits(edits);
    }
  }

  async function fetchFooter() {
    const { data } = await supabase
      .from('site_content')
      .select('*')
      .eq('mode', 'ani')
      .eq('section', 'footer');
    if (data) {
      setFooterContents(data);
      const edits: Record<string, string> = {};
      data.forEach((r) => { edits[r.key] = r.value; });
      setFooterEdits(edits);
    }
  }

  async function saveSection(
    keys: string[],
    contents: ContentRow[],
    edits: Record<string, string>,
    section: string,
    setSaving: (v: boolean) => void,
    setSaved: (v: boolean) => void,
    refetch: () => void,
    fixedMode?: string,
  ) {
    setSaving(true);
    const targetMode = fixedMode ?? mode;
    for (const key of keys) {
      const existing = contents.find((r) => r.key === key);
      if (existing) {
        await supabase.from('site_content').update({ value: edits[key] ?? '' }).eq('id', existing.id);
      } else {
        await supabase.from('site_content').insert({ mode: targetMode, section, key, value: edits[key] ?? '' });
      }
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    refetch();
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

  const saveBtn = (saving: boolean, saved: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
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
  );

  const cardImageNames = mode === 'ani'
    ? ['classcard_img_ani1.jpg', 'classcard_img_ani2.jpg', 'classcard_img_ani3.jpg']
    : ['classcard_img_fine1.jpg', 'classcard_img_fine2.jpg', 'classcard_img_fine3.jpg'];

  const heroImageName = mode === 'ani' ? 'hero_img_ani.png' : 'hero_img_fine.png';

  return (
    <div>
      {/* 페이지 제목 + 모드 탭 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '22px', fontWeight: 900, color: '#1A1A1A' }}>
          홈&소개 디자인 편집
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

      {/* ── 히어로 섹션 ── */}
      <div style={sectionBox}>
        <h3 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '16px', fontWeight: 700, color: '#1A1A1A', marginBottom: '20px' }}>
          히어로 섹션
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {HERO_KEYS.map(({ key, label, multiline }) => (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              {multiline ? (
                <textarea
                  value={heroEdits[key] ?? ''}
                  onChange={(e) => setHeroEdits((prev) => ({ ...prev, [key]: e.target.value }))}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              ) : (
                <input
                  type="text"
                  value={heroEdits[key] ?? ''}
                  onChange={(e) => setHeroEdits((prev) => ({ ...prev, [key]: e.target.value }))}
                  style={inputStyle}
                />
              )}
            </div>
          ))}
        </div>
        {saveBtn(heroSaving, heroSaved, () =>
          saveSection(HERO_KEYS.map((k) => k.key), heroContents, heroEdits, 'hero', setHeroSaving, setHeroSaved, fetchHero)
        )}

        <div style={{ borderTop: '1px solid #F0F0F0', marginTop: '24px', paddingTop: '24px' }}>
          <h4 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', fontWeight: 700, color: '#1A1A1A', marginBottom: '16px' }}>
            히어로 캐릭터 이미지 교체 (1700*1200png)
          </h4>
          <div style={{ maxWidth: '280px' }}>
            <ImageUploader
              key={`${heroImageName}-${imgKey}`}
              label={mode === 'ani' ? '애니반 캐릭터 이미지' : '회화반 캐릭터 이미지'}
              fileName={heroImageName}
              hint="권장 사이즈: 1700 × 1200px / PNG"
              onUploaded={() => setImgKey((k) => k + 1)}
            />
          </div>
        </div>
      </div>

      {/* ── 클래스 카드 ── */}
      <div style={sectionBox}>
        <h3 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '16px', fontWeight: 700, color: '#1A1A1A', marginBottom: '20px' }}>
          클래스 카드
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div>
            <label style={labelStyle}>섹션 제목</label>
            <input
              type="text"
              value={cardEdits['section_title'] ?? ''}
              onChange={(e) => setCardEdits((prev) => ({ ...prev, section_title: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>섹션 소제목</label>
            <input
              type="text"
              value={cardEdits['section_subtitle'] ?? ''}
              onChange={(e) => setCardEdits((prev) => ({ ...prev, section_subtitle: e.target.value }))}
              style={inputStyle}
            />
          </div>
        </div>

        {[1, 2, 3].map((n) => (
          <div key={n} style={{ border: '1px solid #F0F0F0', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
            <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', fontWeight: 700, color: '#1A1A1A', marginBottom: '12px' }}>
              카드 {n}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={labelStyle}>태그</label>
                <input
                  type="text"
                  value={cardEdits[`card${n}_tag`] ?? ''}
                  onChange={(e) => setCardEdits((prev) => ({ ...prev, [`card${n}_tag`]: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>제목</label>
                <input
                  type="text"
                  value={cardEdits[`card${n}_title`] ?? ''}
                  onChange={(e) => setCardEdits((prev) => ({ ...prev, [`card${n}_title`]: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>설명</label>
              <textarea
                value={cardEdits[`card${n}_desc`] ?? ''}
                onChange={(e) => setCardEdits((prev) => ({ ...prev, [`card${n}_desc`]: e.target.value }))}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          </div>
        ))}

        {saveBtn(cardSaving, cardSaved, () =>
          saveSection(ALL_CARD_KEYS, cardContents, cardEdits, 'class_cards', setCardSaving, setCardSaved, fetchCards)
        )}

        <div style={{ borderTop: '1px solid #F0F0F0', marginTop: '24px', paddingTop: '24px' }}>
          <h4 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', fontWeight: 700, color: '#1A1A1A', marginBottom: '16px' }}>
            카드 이미지 교체 (800*600jpg)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {cardImageNames.map((fileName, i) => (
              <ImageUploader
                key={`${fileName}-${imgKey}`}
                label={`카드 ${i + 1} 이미지`}
                fileName={fileName}
                hint="권장 사이즈: 800 × 600px / JPG"
                onUploaded={() => setImgKey((k) => k + 1)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── 입시실적 배너 ── */}
      <div style={sectionBox}>
        <h3 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '16px', fontWeight: 700, color: '#1A1A1A', marginBottom: '20px' }}>
          입시실적 배너
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} style={{ border: '1px solid #F0F0F0', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
                카드 {n}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: '8px' }}>
                <div>
                  <label style={labelStyle}>숫자</label>
                  <input
                    type="number"
                    value={statsEdits[`stat${n}_value`] ?? ''}
                    onChange={(e) => setStatsEdits((prev) => ({ ...prev, [`stat${n}_value`]: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>단위</label>
                  <input
                    type="text"
                    value={statsEdits[`stat${n}_suffix`] ?? ''}
                    onChange={(e) => setStatsEdits((prev) => ({ ...prev, [`stat${n}_suffix`]: e.target.value }))}
                    style={inputStyle}
                    placeholder="명/%"
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>라벨</label>
                <input
                  type="text"
                  value={statsEdits[`stat${n}_label`] ?? ''}
                  onChange={(e) => setStatsEdits((prev) => ({ ...prev, [`stat${n}_label`]: e.target.value }))}
                  style={inputStyle}
                  placeholder="2026 입시 합격 개수"
                />
              </div>
            </div>
          ))}
        </div>
        {saveBtn(statsSaving, statsSaved, () =>
          saveSection(STATS_KEYS, statsContents, statsEdits, 'stats_banner', setStatsSaving, setStatsSaved, fetchStats)
        )}
      </div>

      {/* ── 푸터 ── */}
      <div style={sectionBox}>
        <h3 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '16px', fontWeight: 700, color: '#1A1A1A', marginBottom: '20px' }}>
          푸터
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>주소 · 전화번호</label>
            <input
              type="text"
              value={footerEdits['address'] ?? '전북 전주시 완산구 충경로 75 3층   063-283-7771'}
              onChange={(e) => setFooterEdits((prev) => ({ ...prev, address: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>저작권 텍스트</label>
            <input
              type="text"
              value={footerEdits['copyright'] ?? '© 2025 라인아트 미술학원'}
              onChange={(e) => setFooterEdits((prev) => ({ ...prev, copyright: e.target.value }))}
              style={inputStyle}
            />
          </div>
        </div>
        {saveBtn(footerSaving, footerSaved, () =>
          saveSection(['address', 'copyright'], footerContents, footerEdits, 'footer', setFooterSaving, setFooterSaved, fetchFooter, 'ani')
        )}
      </div>

      {/* ── 소개 슬라이드 ── */}
<div style={sectionBox}>
  <AdminAboutSlides mode={mode} />
</div>

{/* 이후 섹션들 구현 예정 */}
<div style={{ ...sectionBox, opacity: 0.4 }}>
  <p style={{ fontFamily: "'Pretendard', sans-serif", color: '#888', textAlign: 'center' }}>
    강사진, 시설 등 — 구현 예정
  </p>
</div>
    </div>
  );
}