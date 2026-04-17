// AdminFacilities 컴포넌트 생성
// 이유: 시설 안내 관리 — 추가/삭제/수정/이미지 업로드

'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

type Mode = 'ani' | 'fine';

interface Facility {
  id: number;
  mode: string;
  order: number;
  image_url: string;
  label: string;
}

const SUPABASE_URL = 'https://pjqoanpmlunynhsumeso.supabase.co';
const IMG_BASE = `${SUPABASE_URL}/storage/v1/object/public/images`;

function FacilityImageUploader({
  facilityId,
  currentUrl,
  onUploaded,
}: {
  facilityId: number;
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
    const fileName = `facility_${facilityId}.jpg`;
    await supabase.storage.from('images').remove([fileName]);
    const { error } = await supabase.storage
      .from('images')
      .upload(fileName, file, { contentType: file.type });
    if (error) {
      alert('업로드 실패: ' + error.message);
      setUploading(false);
      return;
    }
    const url = `${IMG_BASE}/${fileName}?t=${Date.now()}`;
    await supabase.from('facilities').update({ image_url: url }).eq('id', facilityId);
    onUploaded(url);
    setDone(true);
    setTimeout(() => setDone(false), 2000);
    setUploading(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ width: '100%', aspectRatio: '16/10', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#F5F5F5' }}>
        {currentUrl ? (
          <img src={currentUrl} alt="시설 이미지" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
        <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: uploading ? '#FF1659' : done ? '#4CAF50' : '#888', margin: 0 }}>
          {uploading ? '업로드 중...' : done ? '✓ 업로드 완료!' : '클릭 또는 드래그'}
        </p>
      </div>
    </div>
  );
}

export default function AdminFacilities({ mode }: { mode: Mode }) {
  const isAni = mode === 'ani';
  const mainColor = isAni ? '#FF1659' : '#515883';

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [saving, setSaving] = useState<number | null>(null);
  const [saved, setSaved] = useState<number | null>(null);

  useEffect(() => {
    fetchFacilities();
  }, [mode]);

  async function fetchFacilities() {
    const { data } = await supabase
      .from('facilities')
      .select('*')
      .eq('mode', mode)
      .order('order');
    if (data) setFacilities(data);
  }

  function updateFacility(id: number, field: keyof Facility, value: string) {
    setFacilities((prev) => prev.map((f) => f.id === id ? { ...f, [field]: value } : f));
  }

  async function saveFacility(fac: Facility) {
    setSaving(fac.id);
    const { error } = await supabase
      .from('facilities')
      .update({
        label: fac.label,
        order: Number(fac.order),
      })
      .eq('id', fac.id);
    if (error) alert('저장 실패: ' + error.message);
    setSaving(null);
    setSaved(fac.id);
    setTimeout(() => setSaved(null), 2000);
  }

  async function addFacility() {
    const newOrder = facilities.length + 1;
    const { data } = await supabase
      .from('facilities')
      .insert({
        mode,
        order: newOrder,
        label: '새 시설',
        image_url: '',
      })
      .select()
      .single();
    if (data) setFacilities((prev) => [...prev, data]);
  }

  async function deleteFacility(id: number) {
    if (!confirm('이 시설을 삭제할까요?')) return;
    await supabase.from('facilities').delete().eq('id', id);
    fetchFacilities();
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Pretendard', sans-serif",
    fontSize: '12px',
    fontWeight: 600,
    color: '#888',
    marginBottom: '4px',
    display: 'block',
  };

  const inputStyle: React.CSSProperties = {
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

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '18px', fontWeight: 700, color: '#1A1A1A', marginBottom: '4px' }}>
            시설 안내 (800*500px jpg)
          </h3>
          <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888' }}>
            현재 {facilities.length}개
          </p>
        </div>
        <button
          onClick={addFacility}
          style={{
            padding: '8px 16px',
            backgroundColor: mainColor,
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontFamily: "'Pretendard', sans-serif",
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          + 시설 추가
        </button>
      </div>

      {/* 2열 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {facilities.map((fac) => (
          <div
            key={fac.id}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #E0E0E0',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* 이미지 업로더 */}
            <FacilityImageUploader
              facilityId={fac.id}
              currentUrl={fac.image_url}
              onUploaded={(url) => updateFacility(fac.id, 'image_url', url)}
            />

            {/* 라벨 + 순서 한 줄 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: '8px' }}>
              <div>
                <label style={labelStyle}>라벨</label>
                <input
                  type="text"
                  value={fac.label}
                  onChange={(e) => updateFacility(fac.id, 'label', e.target.value)}
                  style={inputStyle}
                  placeholder="실기실 5A"
                />
              </div>
              <div>
                <label style={labelStyle}>순서</label>
                <input
                  type="number"
                  value={fac.order}
                  onChange={(e) => updateFacility(fac.id, 'order', e.target.value)}
                  style={inputStyle}
                  min={1}
                />
              </div>
            </div>

            {/* 저장 + 삭제 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => deleteFacility(fac.id)}
                style={{
                  padding: '6px 14px',
                  backgroundColor: 'transparent',
                  color: '#FF1659',
                  border: '1px solid #FF1659',
                  borderRadius: '8px',
                  fontFamily: "'Pretendard', sans-serif",
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                삭제
              </button>
              <button
                onClick={() => saveFacility(fac)}
                disabled={saving === fac.id}
                style={{
                  padding: '6px 16px',
                  backgroundColor: saved === fac.id ? '#4CAF50' : mainColor,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontFamily: "'Pretendard', sans-serif",
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: saving === fac.id ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.3s',
                }}
              >
                {saving === fac.id ? '저장 중...' : saved === fac.id ? '저장 완료 ✓' : '저장'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}