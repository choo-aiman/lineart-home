// AdminAboutSlides 컴포넌트 생성
// 이유: 학원소개 슬라이드 관리 — 추가/삭제/수정/이미지 업로드

'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

type Mode = 'ani' | 'fine';

interface Slide {
  id: number;
  mode: string;
  order: number;
  image_url: string;
  title: string;
  body: string;
  list_items: string;
  image_side: string;
}

const SUPABASE_URL = 'https://pjqoanpmlunynhsumeso.supabase.co';
const IMG_BASE = `${SUPABASE_URL}/storage/v1/object/public/images`;

function SlideImageUploader({
  slideId,
  currentUrl,
  onUploaded,
}: {
  slideId: number;
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
    const fileName = `about_slide_${slideId}.jpg`;
    const { error } = await supabase.storage
      .from('images')
      .upload(fileName, file, { upsert: true, contentType: file.type });
    if (!error) {
      const url = `${IMG_BASE}/${fileName}?t=${Date.now()}`;
      await supabase.from('about_slides').update({ image_url: url }).eq('id', slideId);
      onUploaded(url);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    }
    setUploading(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* 미리보기 */}
      <div style={{ width: '100%', aspectRatio: '4/3', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#F5F5F5' }}>
        {currentUrl ? (
          <img src={currentUrl} alt="슬라이드 이미지" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#aaa' }}>이미지 없음</span>
          </div>
        )}
      </div>

      {/* 드래그앤드롭 */}
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
          padding: '12px',
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
          {uploading ? '업로드 중...' : done ? '✓ 완료!' : '클릭 또는 드래그'}
        </p>
      </div>
    </div>
  );
}

export default function AdminAboutSlides({ mode }: { mode: Mode }) {
  const isAni = mode === 'ani';
  const mainColor = isAni ? '#FF1659' : '#515883';

  const [slides, setSlides] = useState<Slide[]>([]);
  const [saving, setSaving] = useState<number | null>(null);
  const [saved, setSaved] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchSlides();
  }, [mode]);

  async function fetchSlides() {
    const { data } = await supabase
      .from('about_slides')
      .select('*')
      .eq('mode', mode)
      .order('order');
    if (data) setSlides(data);
  }

  function updateSlide(id: number, field: keyof Slide, value: string) {
    setSlides((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
  }

  async function saveSlide(slide: Slide) {
    setSaving(slide.id);
    const { error } = await supabase
      .from('about_slides')
      .update({
        title: slide.title,
        body: slide.body,
        list_items: slide.list_items,
        image_side: slide.image_side,
        order: Number(slide.order),
      })
      .eq('id', slide.id);
    
    setSaving(null);
    
    if (error) {
      alert('저장 실패: ' + error.message);
      return;
    }
    
    setSaved(slide.id);
    setTimeout(() => setSaved(null), 2000);
    // fetchSlides 제거 — 저장 후 목록 새로고침 안 함
  }

  async function addSlide() {
    if (slides.length >= 5) {
      alert('슬라이드는 최대 5개까지 추가할 수 있어요.');
      return;
    }
    setAdding(true);
    const newOrder = slides.length + 1;
    const { data } = await supabase
      .from('about_slides')
      .insert({
        mode,
        order: newOrder,
        title: '새 슬라이드 제목',
        body: '내용을 입력해주세요.',
        list_items: '',
        image_side: newOrder % 2 === 1 ? 'left' : 'right',
        image_url: '',
      })
      .select()
      .single();
    if (data) setSlides((prev) => [...prev, data]);
    setAdding(false);
  }

  async function deleteSlide(id: number) {
    if (slides.length <= 2) {
      alert('슬라이드는 최소 2개 이상 유지해야 해요.');
      return;
    }
    if (!confirm('이 슬라이드를 삭제할까요?')) return;
    await supabase.from('about_slides').delete().eq('id', id);
    fetchSlides();
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '18px', fontWeight: 700, color: '#1A1A1A', marginBottom: '4px' }}>
            {isAni ? '애니반' : '회화반'} 소개 슬라이드
          </h3>
          <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888' }}>
            최소 2개 · 최대 5개 · 현재 {slides.length}개
          </p>
        </div>
        <button
          onClick={addSlide}
          disabled={adding || slides.length >= 5}
          style={{
            padding: '8px 16px',
            backgroundColor: slides.length >= 5 ? '#E0E0E0' : mainColor,
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontFamily: "'Pretendard', sans-serif",
            fontSize: '13px',
            fontWeight: 700,
            cursor: slides.length >= 5 ? 'not-allowed' : 'pointer',
          }}
        >
          + 슬라이드 추가
        </button>
      </div>

      {/* 슬라이드 목록 */}
      {slides.map((slide, idx) => (
        <div
          key={slide.id}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #E0E0E0',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '16px',
          }}
        >
          {/* 슬라이드 번호 + 삭제 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', fontWeight: 700, color: mainColor }}>
              슬라이드 {idx + 1}
            </span>
            <button
              onClick={() => deleteSlide(slide.id)}
              style={{
                padding: '4px 12px',
                backgroundColor: 'transparent',
                color: '#FF1659',
                border: '1px solid #FF1659',
                borderRadius: '6px',
                fontFamily: "'Pretendard', sans-serif",
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              삭제
            </button>
          </div>

          {/* 이미지 + 텍스트 2열 */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '20px' }}>
            {/* 이미지 */}
            <div>
              <label style={labelStyle}>슬라이드 이미지</label>
              <SlideImageUploader
                slideId={slide.id}
                currentUrl={slide.image_url}
                onUploaded={(url) => updateSlide(slide.id, 'image_url', url)}
              />
            </div>

            {/* 텍스트 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* 이미지 위치 + 순서 한 줄 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '8px' }}>
                <div>
                  <label style={labelStyle}>이미지 위치</label>
                  <select
                    value={slide.image_side}
                    onChange={(e) => updateSlide(slide.id, 'image_side', e.target.value)}
                    style={{ ...inputStyle }}
                  >
                    <option value="left">왼쪽</option>
                    <option value="right">오른쪽</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>순서</label>
                  <input
                    type="number"
                    value={slide.order}
                    onChange={(e) => updateSlide(slide.id, 'order', e.target.value)}
                    style={inputStyle}
                    min={1}
                  />
                </div>
              </div>

              {/* 제목 */}
              <div>
                <label style={labelStyle}>제목</label>
                <input
                  type="text"
                  value={slide.title}
                  onChange={(e) => updateSlide(slide.id, 'title', e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* 본문 */}
              <div>
                <label style={labelStyle}>본문</label>
                <textarea
                  value={slide.body}
                  onChange={(e) => updateSlide(slide.id, 'body', e.target.value)}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {/* 불릿 항목 */}
              <div>
                <label style={labelStyle}>불릿 항목 (쉼표로 구분)</label>
                <textarea
                  value={slide.list_items}
                  onChange={(e) => updateSlide(slide.id, 'list_items', e.target.value)}
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  placeholder="항목1,항목2,항목3"
                />
              </div>
            </div>
          </div>

          {/* 저장 버튼 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button
              onClick={() => saveSlide(slide)}
              disabled={saving === slide.id}
              style={{
                padding: '8px 20px',
                backgroundColor: saved === slide.id ? '#4CAF50' : mainColor,
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontFamily: "'Pretendard', sans-serif",
                fontSize: '13px',
                fontWeight: 700,
                cursor: saving === slide.id ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.3s',
              }}
            >
              {saving === slide.id ? '저장 중...' : saved === slide.id ? '저장 완료 ✓' : '저장'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}