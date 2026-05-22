'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Nav from '@/components/Nav';
import LessonSection from '@/components/LessonSection';
import TuitionSection from '@/components/TuitionSection';

function LessonsContent() {
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

export default function LessonsPage() {
  return (
    <Suspense>
      <LessonsContent />
    </Suspense>
  );
}