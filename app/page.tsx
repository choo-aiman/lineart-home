'use client';

import { useState } from 'react';
import Nav from '@/components/Nav';
import HeroSection from '@/components/HeroSection';

export default function Home() {
  const [mode, setMode] = useState('ani');

  return (
    <main>
      <Nav mode={mode} setMode={setMode} />
      <HeroSection mode={mode} />
    </main>
  );
}