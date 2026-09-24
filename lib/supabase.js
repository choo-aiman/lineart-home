import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 구글 로그인은 PKCE 방식(로그인 후 돌아올 때 한 번 쓰는 코드를 교환)으로 처리
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { flowType: 'pkce' },
})
