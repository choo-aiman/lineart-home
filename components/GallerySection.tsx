// GallerySection 컴포넌트 생성
// 이유: 갤러리 페이지 — 3열 그리드, 호버 시 이름/성과 표시, 워터마크

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface GalleryItem {
    id: number;
    mode: string;
    student_name: string;
    result: string;
    image_url: string;
    focus_x: number;
    focus_y: number;
    order: number;
}

function maskName(name: string): string {
    if (name.length <= 1) return name;
    if (name.length === 2) return name[0] + 'O';
    const mid = Math.floor(name.length / 2);
    return name.slice(0, mid) + 'O' + name.slice(mid + 1);
}

export default function GallerySection({ mode }: { mode: string }) {
    const isAni = mode === 'ani';
    const mainColor = isAni ? '#FF1659' : '#515883';
    const aspectRatio = isAni ? '4/3' : '3/4';

    const [items, setItems] = useState<GalleryItem[]>([]);
    const [wmSize, setWmSize] = useState(14);
    const [wmOpacity, setWmOpacity] = useState(0.2);
    const [hoveredId, setHoveredId] = useState<number | null>(null);

    useEffect(() => {
        setItems([]);
        fetchItems();
        fetchWatermark();
      }, [mode]);
    async function fetchWatermark() {
        const { data } = await supabase
          .from('site_content')
          .select('key, value')
          .eq('mode', mode)
          .eq('section', 'gallery');
        if (data) {
          const size = data.find((r) => r.key === 'watermark_size');
          const opacity = data.find((r) => r.key === 'watermark_opacity');
          if (size) setWmSize(Number(size.value));
          if (opacity) setWmOpacity(Number(opacity.value));
        }
      }
    async function fetchItems() {
        const { data } = await supabase
            .from('gallery')
            .select('*')
            .eq('mode', mode)
            .order('order');
        if (data) setItems(data);
    }

    return (
        <section className="w-full bg-white">
            <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '80px 4vw 60px' }}>

                {/* 섹션 타이틀 */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '40px' }}>
                    <div>
                        <h2
                            className="font-black text-[#1A1A1A] mb-2"
                            style={{ fontFamily: "'Pretendard', sans-serif", fontSize: 'clamp(22px, 2vw, 32px)' }}
                        >
                            갤러리
                        </h2>
                        <p
                            className="text-[#888]"
                            style={{ fontFamily: "'Pretendard', sans-serif", fontSize: 'clamp(13px, 0.9vw, 16px)', fontWeight: 500 }}
                        >
                            학생들의 우수 작품과 입시 성과를 소개합니다
                        </p>
                    </div>
                    {/* 맨 위로 버튼 */}
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            border: '1px solid #E0E0E0',
                            backgroundColor: '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 12V4M4 8l4-4 4 4" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                {/* 갤러리 그리드 */}
                {items.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: "'Pretendard', sans-serif", fontSize: '14px', color: '#aaa' }}>
                        아직 등록된 작품이 없어요
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '16px',
                        }}
                    >
                        {items.map((item) => (
                            <div
                                key={item.id}
                                onMouseEnter={() => setHoveredId(item.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                style={{
                                    position: 'relative',
                                    aspectRatio,
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    backgroundColor: '#F0F0F0',
                                }}
                            >
                                {/* 이미지 */}
                                {item.image_url && (
                                    <img
                                        src={item.image_url}
                                        alt={maskName(item.student_name)}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            objectPosition: `${(item.focus_x ?? 0.5) * 100}% ${(item.focus_y ?? 0.5) * 100}%`,
                                            display: 'block',
                                            userSelect: 'none',
                                            pointerEvents: 'none',
                                        }}
                                        draggable={false}
                                        onContextMenu={(e) => e.preventDefault()}
                                    />
                                )}

                                {/* 워터마크 — 항상 표시 */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '12px',
                                        pointerEvents: 'none',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {[...Array(5)].map((_, rowIdx) => (
                                        <div
                                            key={rowIdx}
                                            style={{
                                                display: 'flex',
                                                gap: '24px',
                                                transform: rowIdx % 2 === 0 ? 'translateX(0)' : 'translateX(40px)',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {[...Array(4)].map((_, colIdx) => (
                                                <span
                                                    key={colIdx}
                                                    style={{
                                                        fontFamily: "'Black Han Sans', sans-serif",
                                                        fontSize: `${wmSize}px`,
                                                        color: `rgba(255,255,255,${wmOpacity})`,
                                                        letterSpacing: '0.05em',
                                                        userSelect: 'none',
                                                        transform: 'rotate(-20deg)',
                                                        display: 'inline-block',
                                                    }}
                                                >
                                                    라인아트 미술학원
                                                </span>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                                {/* 호버 오버레이 */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 50%)',
                                        opacity: hoveredId === item.id ? 1 : 0,
                                        transition: 'opacity 0.25s ease',
                                        pointerEvents: 'none',
                                    }}
                                />

                                {/* 호버 텍스트 */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        padding: '16px',
                                        transform: hoveredId === item.id ? 'translateY(0)' : 'translateY(8px)',
                                        opacity: hoveredId === item.id ? 1 : 0,
                                        transition: 'all 0.25s ease',
                                        pointerEvents: 'none',
                                        textAlign: 'center',
                                    }}
                                >
                                    <p
                                        style={{
                                            fontFamily: "'Pretendard', sans-serif",
                                            fontSize: 'clamp(15px, 1.1vw, 18px)',
                                            fontWeight: 700,
                                            color: '#ffffff',
                                            marginBottom: '4px',
                                        }}
                                    >
                                        {maskName(item.student_name)}
                                    </p>
                                    {item.result && (
                                        <p
                                            style={{
                                                fontFamily: "'Pretendard', sans-serif",
                                                fontSize: 'clamp(12px, 0.85vw, 14px)',
                                                color: 'rgba(255,255,255,0.85)',
                                            }}
                                        >
                                            {item.result}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 하단 CTA */}
                <div style={{ textAlign: 'center', marginTop: '60px', padding: '40px 0', borderTop: '1px solid #F0F0F0' }}>
                    <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: 'clamp(13px, 0.9vw, 16px)', color: '#555', marginBottom: '20px' }}>
                        학원 상담 방문 시 원본과 함께{' '}
                        <span style={{ color: mainColor, fontWeight: 700 }}>추가적인 생생한 학생의 합격 전략</span>
                        까지 안내해 드립니다.
                    </p>
                    <a
                        href={`/contact?mode=${mode}`}
                        style={{
                            display: 'inline-block',
                            padding: '14px 32px',
                            border: `1px solid #1A1A1A`,
                            borderRadius: '8px',
                            fontFamily: "'Pretendard', sans-serif",
                            fontSize: '15px',
                            fontWeight: 700,
                            color: '#1A1A1A',
                            textDecoration: 'none',
                            transition: 'all 0.15s',
                        }}
                    >
                        수강 문의하기 →
                    </a>
                </div>
            </div>
        </section>
    );
}