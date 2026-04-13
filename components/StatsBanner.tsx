'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

function CountUp({ target, suffix, color, duration = 2200 }: {
  target: number;
  suffix: string;
  color: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(target);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return (
    <span
      ref={ref}
      className="font-black"
      style={{
        color,
        fontFamily: "'Pretendard', sans-serif",
        fontSize: 'clamp(28px, 3vw, 48px)',
      }}
    >
      {count}{suffix}
    </span>
  );
}

export default function StatsBanner({ mode }: { mode: string }) {
  const [stats, setStats] = useState<Stat[]>([]);

  const isAni    = mode === 'ani';
  const bgColor  = isAni ? '#FFF0F4' : '#F4F4F6';
  const numColor = isAni ? '#FF1659' : '#515883';

  // 기본값 (DB에 값이 없을 때 사용)
  const fallbackStats: Stat[] = isAni
    ? [
        { value: 40,  suffix: '명', label: '2026 입시 합격 개수' },
        { value: 16,  suffix: '명', label: '2026 입시생 수' },
        { value: 83,  suffix: '%',  label: '수시 내 합격률' },
        { value: 100, suffix: '%',  label: '고입 합격률' },
      ]
    : [
        { value: 40,  suffix: '명', label: '2026 입시 합격 개수' },
        { value: 16,  suffix: '명', label: '2026 입시생 수' },
        { value: 60,  suffix: '%',  label: '인서울 합격률' },
        { value: 100, suffix: '%',  label: '고입 합격률' },
      ];

  useEffect(() => {
    async function fetchStats() {
      const { data } = await supabase
        .from('site_content')
        .select('key, value')
        .eq('mode', mode)
        .eq('section', 'stats_banner')
        .order('key');

      if (data && data.length > 0) {
        // DB 값으로 stats 구성
        // key 형식: stat1_value, stat1_suffix, stat1_label, stat2_value ...
        const map: Record<string, string> = {};
        data.forEach((r) => { map[r.key] = r.value; });

        const parsed: Stat[] = [1, 2, 3, 4].map((n) => ({
          value:  parseInt(map[`stat${n}_value`]  ?? '0'),
          suffix: map[`stat${n}_suffix`] ?? '',
          label:  map[`stat${n}_label`]  ?? '',
        }));
        setStats(parsed);
      } else {
        // DB에 값 없으면 기본값 사용
        setStats(fallbackStats);
      }
    }
    fetchStats();
  }, [mode]);

  const displayStats = stats.length > 0 ? stats : fallbackStats;

  return (
    <section
      style={{
        backgroundColor: bgColor,
        transition: 'background-color 0.5s ease',
        padding: 'clamp(20px, 3vw, 46px) clamp(16px, 4vw, 48px)',
      }}
      className="w-full"
    >
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 4vw' }}
      >
        {displayStats.map((stat, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl flex flex-col items-center justify-center"
            style={{
              padding: 'clamp(14px, 2vw, 30px)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
              textAlign: 'center',
            }}
          >
            <CountUp
              target={stat.value}
              suffix={stat.suffix}
              color={numColor}
            />
            <span
              className="text-[#888888]"
              style={{
                fontFamily: "'Pretendard', sans-serif",
                fontSize: 'clamp(12px, 0.8vw, 15px)',
                fontWeight: 500,
                marginTop: '6px',
              }}
            >
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}