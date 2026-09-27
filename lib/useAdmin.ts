// useAdmin
// 이유: 관리자 페이지 3곳(선택 화면 / 통합 운영 시스템 / 홈페이지 관리)이
//       같은 로그인·권한 확인을 쓰도록 한 곳에 모음
// 권한의 진짜 문지기는 Supabase 보안 규칙(RLS)입니다. 여기서는 화면 표시만 담당합니다.

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface CurrentAdmin {
  id: number;
  name: string;
  email: string;
  role: string | null;
  level: number;
  permissions: string | null;
}

export type AdminStatus = 'checking' | 'signedOut' | 'denied' | 'ok';

// 홈페이지 관리 탭 권한
export const SITE_PERMS = ['design', 'lessons', 'gallery', 'board', 'blog', 'graduates'];
// 상담 관리 권한 (예전 이름은 '통합 운영' — 저장된 값은 'system' 그대로 사용)
export const CONSULT_PERM = 'system';
// 재원생 관리 권한
export const STUDENTS_PERM = 'students';

export function hasPerm(admin: CurrentAdmin | null, perm: string): boolean {
  if (!admin) return false;
  if (admin.level === 1) return true;            // 슈퍼어드민은 전부 가능
  if (admin.permissions === 'all') return true;
  return admin.permissions?.split(',').map((p) => p.trim()).includes(perm) ?? false;
}

export function canUseSite(admin: CurrentAdmin | null): boolean {
  return SITE_PERMS.some((p) => hasPerm(admin, p));
}

export function canUseConsult(admin: CurrentAdmin | null): boolean {
  return hasPerm(admin, CONSULT_PERM);
}

export function canUseStudents(admin: CurrentAdmin | null): boolean {
  return hasPerm(admin, STUDENTS_PERM);
}

export function useAdmin() {
  const [admin, setAdmin] = useState<CurrentAdmin | null>(null);
  const [status, setStatus] = useState<AdminStatus>('checking');
  const [deniedEmail, setDeniedEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // 예전 접속 코드 방식의 흔적 정리
    sessionStorage.removeItem('admin');

    let cancelled = false;

    async function checkAdmin(email: string | undefined) {
      const { data, error } = await supabase.rpc('admin_whoami');
      if (cancelled) return;
      if (error || !data) {
        setAdmin(null);
        setDeniedEmail(email ?? '');
        setStatus('denied');
        return;
      }
      setAdmin(data as CurrentAdmin);
      setStatus('ok');
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAdmin(null);
        setStatus('signedOut');
        return;
      }
      // 이 콜백 안에서 바로 DB 를 부르면 멈출 수 있어 한 박자 뒤에 확인
      setTimeout(() => checkAdmin(session.user.email), 0);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const login = async () => {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/admin`,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) setError('구글 로그인을 시작하지 못했어요. 잠시 후 다시 시도해주세요.');
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAdmin(null);
  };

  return { admin, status, deniedEmail, error, login, logout };
}
