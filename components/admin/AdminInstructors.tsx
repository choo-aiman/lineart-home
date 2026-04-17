// AdminInstructors 수정
// 이유: 이미지 업로드 방식 변경 — remove 후 upload로 확실하게 교체

'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

type Mode = 'ani' | 'fine';

interface Instructor {
  id: number;
  mode: string;
  order: number;
  name: string;
  role: string;
  image_url: string;
  bullets: string;
}

interface Hashtag {
  id: number;
  mode: string;
  order: number;
  text: string;
}

const SUPABASE_URL = 'https://pjqoanpmlunynhsumeso.supabase.co';
const IMG_BASE = `${SUPABASE_URL}/storage/v1/object/public/images`;

function InstructorImageUploader({
  instructorId,
  currentUrl,
  onUploaded,
}: {
  instructorId: number;
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

    const fileName = `instructor_${instructorId}.jpg`;

    // 기존 파일 먼저 삭제 후 새로 업로드
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
    const { error: dbError } = await supabase
      .from('instructors')
      .update({ image_url: url })
      .eq('id', instructorId);

    if (dbError) {
      alert('DB 저장 실패: ' + dbError.message);
      setUploading(false);
      return;
    }

    onUploaded(url);
    setDone(true);
    setTimeout(() => setDone(false), 2000);
    setUploading(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '10px',
          overflow: 'hidden',
          backgroundColor: '#F5F5F5',
          flexShrink: 0,
        }}
      >
        {currentUrl ? (
          <img src={currentUrl} alt="강사 이미지" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '10px', color: '#aaa' }}>없음</span>
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
          padding: '8px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: dragging ? '#FFF0F4' : '#FAFAFA',
          transition: 'all 0.15s',
          width: '80px',
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
        <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '10px', color: uploading ? '#FF1659' : done ? '#4CAF50' : '#888', margin: 0 }}>
          {uploading ? '업로드중' : done ? '✓ 완료' : '교체'}
        </p>
      </div>
    </div>
  );
}

export default function AdminInstructors({ mode }: { mode: Mode }) {
  const isAni = mode === 'ani';
  const mainColor = isAni ? '#FF1659' : '#515883';

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [saving, setSaving] = useState<number | null>(null);
  const [saved, setSaved] = useState<number | null>(null);
  const [newHashtag, setNewHashtag] = useState('');

  useEffect(() => {
    fetchInstructors();
    fetchHashtags();
  }, [mode]);

  async function fetchInstructors() {
    const { data } = await supabase
      .from('instructors')
      .select('*')
      .eq('mode', mode)
      .order('order');
    if (data) setInstructors(data);
  }

  async function fetchHashtags() {
    const { data } = await supabase
      .from('hashtags')
      .select('*')
      .eq('mode', mode)
      .order('order');
    if (data) setHashtags(data);
  }

  function updateInstructor(id: number, field: keyof Instructor, value: string) {
    setInstructors((prev) => prev.map((ins) => ins.id === id ? { ...ins, [field]: value } : ins));
  }

  async function saveInstructor(inst: Instructor) {
    setSaving(inst.id);
    const { error } = await supabase
      .from('instructors')
      .update({
        name: inst.name,
        role: inst.role,
        bullets: inst.bullets,
        order: Number(inst.order),
      })
      .eq('id', inst.id);
    if (error) alert('저장 실패: ' + error.message);
    setSaving(null);
    setSaved(inst.id);
    setTimeout(() => setSaved(null), 2000);
  }

  async function addInstructor() {
    const newOrder = instructors.length + 1;
    const { data } = await supabase
      .from('instructors')
      .insert({
        mode,
        order: newOrder,
        name: '새 강사',
        role: '전임 강사',
        bullets: '',
        image_url: '',
      })
      .select()
      .single();
    if (data) setInstructors((prev) => [...prev, data]);
  }

  async function deleteInstructor(id: number) {
    if (!confirm('이 강사를 삭제할까요?')) return;
    await supabase.from('instructors').delete().eq('id', id);
    fetchInstructors();
  }

  async function addHashtag() {
    if (!newHashtag.trim()) return;
    const newOrder = hashtags.length + 1;
    const { data } = await supabase
      .from('hashtags')
      .insert({ mode, order: newOrder, text: newHashtag.trim() })
      .select()
      .single();
    if (data) setHashtags((prev) => [...prev, data]);
    setNewHashtag('');
  }

  async function updateHashtag(id: number, text: string) {
    setHashtags((prev) => prev.map((t) => t.id === id ? { ...t, text } : t));
    await supabase.from('hashtags').update({ text }).eq('id', id);
  }

  async function deleteHashtag(id: number) {
    await supabase.from('hashtags').delete().eq('id', id);
    setHashtags((prev) => prev.filter((t) => t.id !== id));
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
      {/* ── 강사진 ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '18px', fontWeight: 700, color: '#1A1A1A', marginBottom: '4px' }}>
            {isAni ? '애니반' : '회화반'} 강사진 소개 (200*200jpg)
          </h3>
          <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888' }}>
            현재 {instructors.length}명
          </p>
        </div>
        <button
          onClick={addInstructor}
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
          + 강사 추가
        </button>
      </div>

      {instructors.map((inst) => (
        <div
          key={inst.id}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #E0E0E0',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '16px' }}>
            <InstructorImageUploader
              instructorId={inst.id}
              currentUrl={inst.image_url}
              onUploaded={(url) => updateInstructor(inst.id, 'image_url', url)}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={labelStyle}>이름</label>
                  <input
                    type="text"
                    value={inst.name}
                    onChange={(e) => updateInstructor(inst.id, 'name', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>직함</label>
                  <input
                    type="text"
                    value={inst.role}
                    onChange={(e) => updateInstructor(inst.id, 'role', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>불릿 항목 (쉼표로 구분)</label>
                <textarea
                  value={inst.bullets}
                  onChange={(e) => updateInstructor(inst.id, 'bullets', e.target.value)}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  placeholder="항목1,항목2,항목3"
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <button
              onClick={() => deleteInstructor(inst.id)}
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
              onClick={() => saveInstructor(inst)}
              disabled={saving === inst.id}
              style={{
                padding: '6px 16px',
                backgroundColor: saved === inst.id ? '#4CAF50' : mainColor,
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontFamily: "'Pretendard', sans-serif",
                fontSize: '12px',
                fontWeight: 700,
                cursor: saving === inst.id ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.3s',
              }}
            >
              {saving === inst.id ? '저장 중...' : saved === inst.id ? '저장 완료 ✓' : '저장'}
            </button>
          </div>
        </div>
      ))}

      {/* ── 해시태그 ── */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #E0E0E0',
          borderRadius: '12px',
          padding: '20px',
          marginTop: '8px',
        }}
      >
        <h3 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '16px', fontWeight: 700, color: '#1A1A1A', marginBottom: '16px' }}>
          해시태그
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
          {hashtags.map((tag) => (
            <div key={tag.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={tag.text}
                onChange={(e) => updateHashtag(tag.id, e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={() => deleteHashtag(tag.id)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'transparent',
                  color: '#FF1659',
                  border: '1px solid #FF1659',
                  borderRadius: '8px',
                  fontFamily: "'Pretendard', sans-serif",
                  fontSize: '12px',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                삭제
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={newHashtag}
            onChange={(e) => setNewHashtag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addHashtag()}
            placeholder="#새 해시태그"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={addHashtag}
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
              flexShrink: 0,
            }}
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}