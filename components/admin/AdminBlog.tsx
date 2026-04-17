// AdminBlog 컴포넌트 생성
// 이유: 블로그 관리 — 링크 추가/삭제/수정 + 배너 이미지 교체

'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface BlogLink {
  id: number;
  name: string;
  url: string;
  icon: string;
  order: number;
}

interface BlogBanner {
  id: number;
  mode: string;
  image_url: string;
  link_url: string;
}

const SUPABASE_URL = 'https://pjqoanpmlunynhsumeso.supabase.co';
const IMG_BASE = `${SUPABASE_URL}/storage/v1/object/public/images`;

function BannerUploader({
  mode,
  currentUrl,
  onUploaded,
}: {
  mode: string;
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
    const fileName = `blog_banner_${mode}.jpg`;
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
    await supabase.from('blog_banners').update({ image_url: url }).eq('mode', mode);
    onUploaded(url);
    setDone(true);
    setTimeout(() => setDone(false), 2000);
    setUploading(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ width: '100%', aspectRatio: '1440/417', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#F5F5F5' }}>
        {currentUrl ? (
          <img src={currentUrl} alt="블로그 배너" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#aaa' }}>배너 없음</span>
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
          {uploading ? '업로드 중...' : done ? '✓ 업로드 완료!' : '클릭 또는 드래그 (1440×417px / JPG)'}
        </p>
      </div>
    </div>
  );
}

function IconUploader({
  linkId,
  currentUrl,
  onUploaded,
}: {
  linkId: number;
  currentUrl: string;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    const fileName = `blog_icon_${linkId}.jpg`;
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
    await supabase.from('blog_links').update({ icon: url }).eq('id', linkId);
    onUploaded(url);
    setDone(true);
    setTimeout(() => setDone(false), 2000);
    setUploading(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '10px',
          overflow: 'hidden',
          backgroundColor: '#F5F5F5',
          flexShrink: 0,
        }}
      >
        {currentUrl ? (
          <img src={currentUrl} alt="아이콘" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '10px', color: '#aaa' }}>없음</span>
          </div>
        )}
      </div>
      <button
        onClick={() => inputRef.current?.click()}
        style={{
          padding: '3px 8px',
          backgroundColor: 'transparent',
          border: '1px solid #E0E0E0',
          borderRadius: '6px',
          fontFamily: "'Pretendard', sans-serif",
          fontSize: '10px',
          color: uploading ? '#FF1659' : done ? '#4CAF50' : '#888',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {uploading ? '업로드중' : done ? '✓완료' : '교체'}
      </button>
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
    </div>
  );
}

export default function AdminBlog() {
  const [links, setLinks] = useState<BlogLink[]>([]);
  const [banners, setBanners] = useState<BlogBanner[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [bannerLinks, setBannerLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchLinks();
    fetchBanners();
  }, []);

  async function fetchLinks() {
    const { data } = await supabase
      .from('blog_links')
      .select('*')
      .order('order');
    if (data) setLinks(data);
  }

  async function fetchBanners() {
    const { data } = await supabase
      .from('blog_banners')
      .select('*');
    if (data) {
      setBanners(data);
      const links: Record<string, string> = {};
      data.forEach((b) => { links[b.mode] = b.link_url ?? ''; });
      setBannerLinks(links);
    }
  }

  function updateLink(id: number, field: keyof BlogLink, value: string) {
    setLinks((prev) => prev.map((l) => l.id === id ? { ...l, [field]: value } : l));
  }

  async function saveAllLinks() {
    setSaving(true);
    for (const link of links) {
      const { error } = await supabase
        .from('blog_links')
        .update({
          name: link.name,
          url: link.url,
          order: Number(link.order),
        })
        .eq('id', link.id);
      if (error) alert('저장 실패: ' + error.message);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function addLink() {
    const newOrder = links.length + 1;
    const { data } = await supabase
      .from('blog_links')
      .insert({ name: '새 링크', url: '', icon: '', order: newOrder })
      .select()
      .single();
    if (data) setLinks((prev) => [...prev, data]);
  }

  async function deleteLink(id: number) {
    if (!confirm('이 링크를 삭제할까요?')) return;
    await supabase.from('blog_links').delete().eq('id', id);
    fetchLinks();
  }

  async function saveBannerLink(mode: string) {
    await supabase
      .from('blog_banners')
      .update({ link_url: bannerLinks[mode] ?? '' })
      .eq('mode', mode);
    alert('배너 링크 저장 완료!');
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

  const sectionBox: React.CSSProperties = {
    backgroundColor: '#ffffff',
    border: '1px solid #E0E0E0',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
  };

  return (
    <div>
      <h2 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '22px', fontWeight: 900, color: '#1A1A1A', marginBottom: '24px' }}>
        블로그 관리
      </h2>

      {/* ── 블로그 링크 목록 ── */}
      <div style={sectionBox}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '16px', fontWeight: 700, color: '#1A1A1A', marginBottom: '4px' }}>
              블로그 링크 목록
            </h3>
            <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: '#888' }}>
              현재 {links.length}개 · 최대 5개
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={addLink}
              disabled={links.length >= 5}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: links.length >= 5 ? '#aaa' : '#FF1659',
                border: `1px solid ${links.length >= 5 ? '#aaa' : '#FF1659'}`,
                borderRadius: '8px',
                fontFamily: "'Pretendard', sans-serif",
                fontSize: '13px',
                fontWeight: 700,
                cursor: links.length >= 5 ? 'not-allowed' : 'pointer',
              }}
            >
              + 링크 추가
            </button>
            <button
              onClick={saveAllLinks}
              disabled={saving}
              style={{
                padding: '8px 16px',
                backgroundColor: saved ? '#4CAF50' : '#FF1659',
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

        {/* 링크 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {links.map((link) => (
            <div
              key={link.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 1fr 50px 40px',
                gap: '10px',
                alignItems: 'center',
                padding: '12px',
                border: '1px solid #F0F0F0',
                borderRadius: '10px',
                backgroundColor: '#FAFAFA',
              }}
            >
              {/* 아이콘 */}
              <IconUploader
                linkId={link.id}
                currentUrl={link.icon}
                onUploaded={(url) => updateLink(link.id, 'icon', url)}
              />

              {/* 이름 */}
              <div>
                <label style={labelStyle}>이름</label>
                <input
                  type="text"
                  value={link.name}
                  onChange={(e) => updateLink(link.id, 'name', e.target.value)}
                  style={inputStyle}
                  placeholder="라인아트 메인 블로그"
                />
              </div>

              {/* URL */}
              <div>
                <label style={labelStyle}>URL</label>
                <input
                  type="text"
                  value={link.url}
                  onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                  style={inputStyle}
                  placeholder="https://..."
                />
              </div>

              {/* 순서 */}
              <div>
                <label style={labelStyle}>순서</label>
                <input
                  type="number"
                  value={link.order}
                  onChange={(e) => updateLink(link.id, 'order', e.target.value)}
                  style={inputStyle}
                  min={1}
                />
              </div>

              {/* 삭제 */}
              <button
                onClick={() => deleteLink(link.id)}
                style={{
                  padding: '6px 8px',
                  backgroundColor: 'transparent',
                  color: '#FF1659',
                  border: '1px solid #FF1659',
                  borderRadius: '6px',
                  fontFamily: "'Pretendard', sans-serif",
                  fontSize: '11px',
                  cursor: 'pointer',
                  marginTop: '18px',
                }}
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── 블로그 배너 ── */}
      <div style={sectionBox}>
        <h3 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '16px', fontWeight: 700, color: '#1A1A1A', marginBottom: '16px' }}>
          블로그 배너
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {['ani', 'fine'].map((mode) => {
            const banner = banners.find((b) => b.mode === mode);
            return (
              <div key={mode} style={{ border: '1px solid #F0F0F0', borderRadius: '10px', padding: '16px' }}>
                <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', fontWeight: 700, color: '#1A1A1A', marginBottom: '12px' }}>
                  {mode === 'ani' ? '만화·애니반' : '회화반'} 배너
                </p>

                <BannerUploader
                  mode={mode}
                  currentUrl={banner?.image_url ?? ''}
                  onUploaded={(url) => {
                    setBanners((prev) => prev.map((b) => b.mode === mode ? { ...b, image_url: url } : b));
                  }}
                />

                {/* 배너 클릭 링크 */}
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>배너 클릭 링크 (선택)</label>
                    <input
                      type="text"
                      value={bannerLinks[mode] ?? ''}
                      onChange={(e) => setBannerLinks((prev) => ({ ...prev, [mode]: e.target.value }))}
                      style={inputStyle}
                      placeholder="https://..."
                    />
                  </div>
                  <button
                    onClick={() => saveBannerLink(mode)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#FF1659',
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
                    링크 저장
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}