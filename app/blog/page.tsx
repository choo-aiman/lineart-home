'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Nav from '@/components/Nav';
import BlogSection from '@/components/BlogSection';
import BlogBanner from '@/components/BlogBanner';

function BlogContent() {
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
      <BlogBanner mode={mode} />
      <BlogSection mode={mode} />
    </main>
  );
}

export default function BlogPage() {
  return (
    <Suspense>
      <BlogContent />
    </Suspense>
  );
}