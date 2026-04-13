'use client';

import { useState } from 'react';
import Nav from '@/components/Nav';
import HeroSection from '@/components/HeroSection';
import ClassCards from '@/components/ClassCards';
import StatsBanner from '@/components/StatsBanner';
import GraduatesGraph from '@/components/GraduatesGraph';

export default function Home() {
  const [mode, setMode] = useState('ani');

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