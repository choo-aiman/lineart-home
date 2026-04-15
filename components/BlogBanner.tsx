// BlogBanner 수정
// 이유: mode 변경 시 이전 요청 결과 무시하여 배너 혼재 방지

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface Banner {
  id: number;
  mode: string;
  image_url: string;
  link_url: string;
}

export default function BlogBanner({ mode }: { mode: string }) {
  const [banner, setBanner] = useState<Banner | null>(null);

  useEffect(() => {
    setBanner(null);
    let cancelled = false;

    async function fetchBanner() {
      const { data } = await supabase
        .from('blog_banners')
        .select('*')
        .eq('mode', mode)
        .single();
      if (data && !cancelled) setBanner(data);
    }
    fetchBanner();

    return () => {
      cancelled = true;
    };
  }, [mode]);

  if (!banner) return null;

  return (
    <section className="w-full">
      <a
        href={banner.link_url || '#'}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'block', cursor: banner.link_url ? 'pointer' : 'default' }}
      >
        <div style={{ width: '100%', position: 'relative', aspectRatio: '1440 / 417' }}>
          <Image
            src={banner.image_url}
            alt="블로그 배너"
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
      </a>
    </section>
  );
}