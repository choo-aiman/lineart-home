// BlogSection 수정
// 이유: site_content 테이블에서 제목/소제목 불러오기

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface BlogLink {
  id: number;
  name: string;
  url: string;
  icon: string;
  order: number;
}

export default function BlogSection({ mode }: { mode: string }) {
  const isAni = mode === 'ani';
  const mainColor = isAni ? '#FF1659' : '#515883';
  const [links, setLinks] = useState<BlogLink[]>([]);
  const [title, setTitle] = useState('블로그');
  const [subtitle, setSubtitle] = useState('유용한 입시·미술 정보가 가득! 라인아트 미술학원의 블로그를 방문해보세요');

  useEffect(() => {
    async function fetchData() {
      const [{ data: linkData }, { data: contentData }] = await Promise.all([
        supabase.from('blog_links').select('*').order('order'),
        supabase.from('site_content').select('key, value').eq('mode', mode).eq('section', 'blog'),
      ]);
      if (linkData) setLinks(linkData);
      if (contentData) {
        const t = contentData.find((d) => d.key === 'title');
        const s = contentData.find((d) => d.key === 'subtitle');
        if (t) setTitle(t.value);
        if (s) setSubtitle(s.value);
      }
    }
    fetchData();
  }, [mode]);

  return (
    <section id="블로그" className="w-full bg-white">
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '80px 4vw 60px' }}>

        {/* 섹션 타이틀 */}
        <div className="mb-10">
          <h2
            className="font-black text-[#1A1A1A] mb-2"
            style={{ fontFamily: "'Pretendard', sans-serif", fontSize: 'clamp(22px, 2vw, 32px)' }}
          >
            {title}
          </h2>
          <p
            className="text-[#888]"
            style={{ fontFamily: "'Pretendard', sans-serif", fontSize: 'clamp(13px, 0.9vw, 16px)', fontWeight: 500 }}
          >
            {subtitle}
          </p>
        </div>

        {/* 블로그 링크 그리드 */}
        {links.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '16px',
            }}
          >
            {links.map((link) => (
              <a 
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px 20px',
                  border: '1px solid #E0E0E0',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = mainColor;
                  e.currentTarget.style.backgroundColor = isAni ? '#FFF0F4' : '#ECEEF5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E0E0E0';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }}
              >
                {/* 아이콘 */}
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    backgroundColor: '#F5F5F5',
                  }}
                >
                  {link.icon && (
                    <Image
                      src={link.icon}
                      alt={link.name}
                      width={48}
                      height={48}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </div>

                {/* 이름 + 화살표 */}
                <span
                  style={{
                    fontFamily: "'Pretendard', sans-serif",
                    fontSize: 'clamp(13px, 0.9vw, 15px)',
                    fontWeight: 600,
                    color: '#1A1A1A',
                    flex: 1,
                  }}
                >
                  {link.name}
                </span>
                <span style={{ color: '#888', fontSize: '16px', flexShrink: 0 }}>→</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}