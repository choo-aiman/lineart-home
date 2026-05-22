'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Nav from '@/components/Nav';
import HeroSection from '@/components/HeroSection';
import ClassCards from '@/components/ClassCards';
import StatsBanner from '@/components/StatsBanner';
import GraduatesGraph from '@/components/GraduatesGraph';

function HomeContent() {
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

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}