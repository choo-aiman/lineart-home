// AdminGallery 수정
// 이유: 순서 버튼 좌우 화살표 + 분홍색으로 변경

'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

type Mode = 'ani' | 'fine';

interface GalleryItem {
  id: number;
  mode: string;
  student_name: string;
  result: string;
  image_url: string;
  focus_x: number;
  focus_y: number;
  order: number;
}

const SUPABASE_URL = 'https://pjqoanpmlunynhsumeso.supabase.co';
const IMG_BASE = `${SUPABASE_URL}/storage/v1/object/public/images`;

function maskName(name: string): string {
  if (name.length <= 1) return name;
  if (name.length === 2) return name[0] + 'O';
  const mid = Math.floor(name.length / 2);
  return name.slice(0, mid) + 'O' + name.slice(mid + 1);
}

function GalleryImageUploader({
  itemId,
  currentUrl,
  onUploaded,
}: {
  itemId: number;
  currentUrl: string;
  onUploaded: (url: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    const fileName = `gallery_${itemId}.jpg`;
    const { error } = await supabase.storage
      .from('images')
      .upload(fileName, file, { upsert: true, contentType: file.type });
    if (error) {
      alert('업로드 실패: ' + error.message);
      setUploading(false);
      return;
    }
    const url = `${IMG_BASE}/${fileName}?t=${Date.now()}`;
    await supabase.from('gallery').update({ image_url: url }).eq('id', itemId);
    onUploaded(url);
    setDone(true);
    setTimeout(() => setDone(false), 2000);
    setUploading(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ width: '100%', aspectRatio: '4/3', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#F5F5F5' }}>
        {currentUrl ? (
          <img src={currentUrl} alt="갤러리 이미지" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#aaa' }}>이미지 없음</span>
          </div>
        )}
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
          padding: '10px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: dragging ? '#FFF0F4' : '#FAFAFA',
          transition: 'all 0.15s',
        }}
      >
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadFile(file); }}
        />
        <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: uploading ? '#FF1659' : done ? '#4CAF50' : '#888', margin: 0 }}>
          {uploading ? '업로드 중...' : done ? '✓ 완료!' : '클릭 또는 드래그'}
        </p>
      </div>
    </div>
  );
}

export default function AdminGallery() {
  const [mode, setMode] = useState<Mode>('ani');
  const isAni = mode === 'ani';
  const mainColor = isAni ? '#FF1659' : '#515883';

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [saving, setSaving] = useState<number | null>(null);
  const [saved, setSaved] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  const [wmSize, setWmSize] = useState(14);
  const [wmOpacity, setWmOpacity] = useState(0.2);
  const [wmSizeId, setWmSizeId] = useState<number | null>(null);
  const [wmOpacityId, setWmOpacityId] = useState<number | null>(null);
  const [savingWm, setSavingWm] = useState(false);
  const [savedWm, setSavedWm] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchWatermark();
  }, [mode]);

  async function fetchItems() {
    const { data } = await supabase
      .from('gallery')
      .select('*')
      .eq('mode', mode)
      .order('order');
    if (data) setItems(data);
  }

  async function fetchWatermark() {
    const { data } = await supabase
      .from('site_content')
      .select('id, key, value')
      .eq('mode', 'ani')
      .eq('section', 'gallery');
    if (data) {
      const size = data.find((r) => r.key === 'watermark_size');
      const opacity = data.find((r) => r.key === 'watermark_opacity');
      if (size) { setWmSize(Number(size.value)); setWmSizeId(size.id); }
      if (opacity) { setWmOpacity(Number(opacity.value)); setWmOpacityId(opacity.id); }
    }
  }

  async function saveWatermark() {
    setSavingWm(true);
    if (wmSizeId) await supabase.from('site_content').update({ value: String(wmSize) }).eq('id', wmSizeId);
    if (wmOpacityId) await supabase.from('site_content').update({ value: String(wmOpacity) }).eq('id', wmOpacityId);
    setSavingWm(false);
    setSavedWm(true);
    setTimeout(() => setSavedWm(false), 2000);
  }

  function updateItem(id: number, field: keyof GalleryItem, value: string | number) {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, [field]: value } : item));
  }

  async function saveItem(item: GalleryItem) {
    setSaving(item.id);
    const { error } = await supabase
      .from('gallery')
      .update({
        student_name: item.student_name,
        result: item.result,
        order: Number(item.order),
        focus_x: Number(item.focus_x),
        focus_y: Number(item.focus_y),
      })
      .eq('id', item.id);
    if (error) alert('저장 실패: ' + error.message);
    setSaving(null);
    setSaved(item.id);
    setTimeout(() => setSaved(null), 2000);
  }

  async function addItem() {
    setAdding(true);
    for (const item of items) {
      await supabase.from('gallery').update({ order: item.order + 1 }).eq('id', item.id);
    }
    await supabase.from('gallery').insert({
      mode, order: 1, student_name: '홍길동', result: '', image_url: '', focus_x: 0.5, focus_y: 0.5,
    });
    setAdding(false);
    fetchItems();
  }

  async function deleteItem(id: number) {
    if (!confirm('이 작품을 삭제할까요?')) return;
    await supabase.from('gallery').delete().eq('id', id);
    fetchItems();
  }

  async function moveItem(itemId: number, dir: 'left' | 'right') {
    const idx = items.findIndex((i) => i.id === itemId);
    if (dir === 'left' && idx === 0) return;
    if (dir === 'right' && idx === items.length - 1) return;
    const targetIdx = dir === 'left' ? idx - 1 : idx + 1;
    const current = items[idx];
    const target = items[targetIdx];
    await supabase.from('gallery').update({ order: target.order }).eq('id', current.id);
    await supabase.from('gallery').update({ order: current.order }).eq('id', target.id);
    fetchItems();
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Pretendard', sans-serif",
    fontSize: '11px',
    fontWeight: 600,
    color: '#888',
    marginBottom: '3px',
    display: 'block',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
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

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '22px', fontWeight: 900, color: '#1A1A1A' }}>
          갤러리 관리
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

      {/* 워터마크 설정 */}
      <div style={sectionBox}>
        <h3 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', fontWeight: 700, color: '#1A1A1A', marginBottom: '16px' }}>
          워터마크 설정
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>글자 크기 (px) · 현재 {wmSize}px</label>
            <input type="range" min={8} max={30} step={1} value={wmSize} onChange={(e) => setWmSize(Number(e.target.value))} style={{ width: '100%', marginBottom: '6px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '11px', color: '#aaa' }}>8px</span>
              <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '11px', color: '#aaa' }}>30px</span>
            </div>
          </div>
          <div>
            <label style={labelStyle}>투명도 · 현재 {Math.round(wmOpacity * 100)}%</label>
            <input type="range" min={0.05} max={0.6} step={0.05} value={wmOpacity} onChange={(e) => setWmOpacity(Number(e.target.value))} style={{ width: '100%', marginBottom: '6px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '11px', color: '#aaa' }}>5%</span>
              <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '11px', color: '#aaa' }}>60%</span>
            </div>
          </div>
        </div>
        <div style={{ width: '100%', height: '80px', backgroundColor: '#888', borderRadius: '8px', position: 'relative', overflow: 'hidden', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {[...Array(3)].map((_, rowIdx) => (
            <div key={rowIdx} style={{ position: 'absolute', top: `${rowIdx * 30}px`, display: 'flex', gap: '24px', transform: rowIdx % 2 === 0 ? 'translateX(0)' : 'translateX(40px)', whiteSpace: 'nowrap' }}>
              {[...Array(6)].map((_, colIdx) => (
                <span key={colIdx} style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: `${wmSize}px`, color: `rgba(255,255,255,${wmOpacity})`, letterSpacing: '0.05em', userSelect: 'none', transform: 'rotate(-20deg)', display: 'inline-block' }}>
                  라인아트 미술학원
                </span>
              ))}
            </div>
          ))}
          <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.5)', zIndex: 1 }}>미리보기</span>
        </div>
        <button onClick={saveWatermark} disabled={savingWm} style={{ padding: '8px 20px', backgroundColor: savedWm ? '#4CAF50' : mainColor, color: '#ffffff', border: 'none', borderRadius: '8px', fontFamily: "'Pretendard', sans-serif", fontSize: '13px', fontWeight: 700, cursor: savingWm ? 'not-allowed' : 'pointer', transition: 'background-color 0.3s' }}>
          {savingWm ? '저장 중...' : savedWm ? '저장 완료 ✓' : '워터마크 설정 저장'}
        </button>
      </div>

      {/* 안내문구 */}
      <div style={{ backgroundColor: '#FFF8E1', border: '1px solid #FFE082', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px' }}>
        <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#888', margin: 0 }}>
          ⚠️ 학생 이름은 가운데 글자가 자동으로 <strong>O</strong>로 표시돼요. 예) 홍길동 → <strong>홍O동</strong> / 김지우 → <strong>김O우</strong>
        </p>
        <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: '#888', margin: '4px 0 0' }}>
          📝 입시 성과는 최대 30자까지 입력할 수 있어요.
        </p>
      </div>

      {/* 추가 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button onClick={addItem} disabled={adding} style={{ padding: '8px 16px', backgroundColor: mainColor, color: '#ffffff', border: 'none', borderRadius: '8px', fontFamily: "'Pretendard', sans-serif", fontSize: '13px', fontWeight: 700, cursor: adding ? 'not-allowed' : 'pointer' }}>
          + 작품 추가
        </button>
      </div>

      {/* 갤러리 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {items.map((item, idx) => (
          <div key={item.id} style={{ backgroundColor: '#ffffff', border: '1px solid #E0E0E0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <GalleryImageUploader itemId={item.id} currentUrl={item.image_url} onUploaded={(url) => updateItem(item.id, 'image_url', url)} />

            <div>
              <label style={labelStyle}>
                학생 이름 →&nbsp;
                <span style={{ color: mainColor, fontWeight: 700 }}>{maskName(item.student_name || '홍길동')}</span>
                으로 표시됨
              </label>
              <input type="text" value={item.student_name} onChange={(e) => updateItem(item.id, 'student_name', e.target.value)} style={inputStyle} placeholder="홍길동" />
            </div>

            <div>
              <label style={labelStyle}>입시 성과 ({item.result?.length ?? 0}/30자)</label>
              <input type="text" value={item.result} onChange={(e) => { if (e.target.value.length <= 30) updateItem(item.id, 'result', e.target.value); }} style={inputStyle} placeholder="홍익대학교 만화애니메이션학과 합격" maxLength={30} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <div>
                <label style={labelStyle}>포커스 X (0~1)</label>
                <input type="number" value={item.focus_x} onChange={(e) => updateItem(item.id, 'focus_x', parseFloat(e.target.value))} style={inputStyle} min={0} max={1} step={0.1} />
              </div>
              <div>
                <label style={labelStyle}>포커스 Y (0~1)</label>
                <input type="number" value={item.focus_y} onChange={(e) => updateItem(item.id, 'focus_y', parseFloat(e.target.value))} style={inputStyle} min={0} max={1} step={0.1} />
              </div>
            </div>

            {/* 순서 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>순서 {item.order}</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => moveItem(item.id, 'left')}
                  disabled={idx === 0}
                  style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', backgroundColor: idx === 0 ? '#F5F5F5' : '#FFF0F4', color: idx === 0 ? '#ccc' : '#FF1659', fontSize: '14px', fontWeight: 700, cursor: idx === 0 ? 'not-allowed' : 'pointer' }}
                >←</button>
                <button
                  onClick={() => moveItem(item.id, 'right')}
                  disabled={idx === items.length - 1}
                  style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', backgroundColor: idx === items.length - 1 ? '#F5F5F5' : '#FFF0F4', color: idx === items.length - 1 ? '#ccc' : '#FF1659', fontSize: '14px', fontWeight: 700, cursor: idx === items.length - 1 ? 'not-allowed' : 'pointer' }}
                >→</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => deleteItem(item.id)} style={{ flex: 1, padding: '8px', backgroundColor: 'transparent', color: '#FF1659', border: '1px solid #FF1659', borderRadius: '8px', fontFamily: "'Pretendard', sans-serif", fontSize: '12px', cursor: 'pointer' }}>
                삭제
              </button>
              <button onClick={() => saveItem(item)} disabled={saving === item.id} style={{ flex: 2, padding: '8px', backgroundColor: saved === item.id ? '#4CAF50' : mainColor, color: '#ffffff', border: 'none', borderRadius: '8px', fontFamily: "'Pretendard', sans-serif", fontSize: '12px', fontWeight: 700, cursor: saving === item.id ? 'not-allowed' : 'pointer', transition: 'background-color 0.3s' }}>
                {saving === item.id ? '저장 중...' : saved === item.id ? '저장 완료 ✓' : '저장'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}