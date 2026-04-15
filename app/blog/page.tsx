// app/blog/page.tsx 생성
// 이유: 블로그 전용 페이지

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Nav from '@/components/Nav';
import BlogSection from '@/components/BlogSection';
import BlogBanner from '@/components/BlogBanner';

export default function BlogPage() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState('ani');

  useEffect(() => {
    const m = searchParams.get('mode');
    if (m === 'fine' || m === 'ani') setMode(m);
  }, [searchParams]);

  const handleSetMode = (m: string) => {
    setMode(m);
    window.history.replaceState(null, '', `/blog?mode=${m}`);
  };

  return (
    <main>
      <Nav mode={mode} setMode={handleSetMode} />
      <BlogSection mode={mode} />
      <BlogBanner mode={mode} />
    </main>
  );
}