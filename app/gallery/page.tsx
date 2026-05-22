'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Nav from '@/components/Nav';
import GallerySection from '@/components/GallerySection';

function GalleryContent() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState('ani');

  useEffect(() => {
    const m = searchParams.get('mode');
    if (m === 'fine' || m === 'ani') setMode(m);
  }, [searchParams]);

  const handleSetMode = (m: string) => {
    setMode(m);
    window.history.replaceState(null, '', `/gallery?mode=${m}`);
  };

  return (
    <main>
      <Nav mode={mode} setMode={handleSetMode} />
      <GallerySection key={mode} mode={mode} />
    </main>
  );
}

export default function GalleryPage() {
  return (
    <Suspense>
      <GalleryContent />
    </Suspense>
  );
}