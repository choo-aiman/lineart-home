// lessons/page.tsx 수정
// 이유: URL mode 파라미터로 새로고침 시 mode 유지

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Nav from '@/components/Nav';
import LessonSection from '@/components/LessonSection';
import TuitionSection from '@/components/TuitionSection';

export default function LessonsPage() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState('ani');

  useEffect(() => {
    const m = searchParams.get('mode');
    if (m === 'fine' || m === 'ani') setMode(m);
  }, [searchParams]);

  const handleSetMode = (m: string) => {
    setMode(m);
    window.history.replaceState(null, '', `/lessons?mode=${m}`);
  };

  return (
    <main>
      <Nav mode={mode} setMode={handleSetMode} />
      <LessonSection mode={mode} />
      <TuitionSection mode={mode} />
    </main>
  );
}