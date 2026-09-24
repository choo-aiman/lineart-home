/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 최적화한 이미지를 31일간 보관 (같은 사진을 반복해서 내려받지 않음)
    minimumCacheTTL: 2678400,
    // 90 = 눈으로 차이를 느끼기 어려운 고화질, 75 = 기본값
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pjqoanpmlunynhsumeso.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;