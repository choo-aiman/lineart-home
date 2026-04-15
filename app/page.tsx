// page.tsx 수정
// 이유: URL의 mode 파라미터 읽어서 애니/회화 초기값 설정

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Nav from '@/components/Nav';
import HeroSection from '@/components/HeroSection';
import ClassCards from '@/components/ClassCards';
import StatsBanner from '@/components/StatsBanner';
import GraduatesGraph from '@/components/GraduatesGraph';

export default function Home() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState('ani');

  useEffect(() => {
    const m = searchParams.get('mode');
    if (m === 'fine' || m === 'ani') setMode(m);
  }, [searchParams]);

  return (
    <main>
      <Nav mode={mode} setMode={setMode} />
      <HeroSection mode={mode} />
      <ClassCards mode={mode} />
      <StatsBanner mode={mode} />
      <GraduatesGraph />
    </main>
  );
}