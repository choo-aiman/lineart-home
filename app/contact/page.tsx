// app/contact/page.tsx 생성
// 이유: 문의 전용 페이지

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Nav from '@/components/Nav';
import ContactSection from '@/components/ContactSection';

export default function ContactPage() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState('ani');

  useEffect(() => {
    const m = searchParams.get('mode');
    if (m === 'fine' || m === 'ani') setMode(m);
  }, [searchParams]);

  const handleSetMode = (m: string) => {
    setMode(m);
    window.history.replaceState(null, '', `/contact?mode=${m}`);
  };

  return (
    <main>
      <Nav mode={mode} setMode={handleSetMode} />
      <ContactSection mode={mode} />
    </main>
  );
}