import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pjqoanpmlunynhsumeso.supabase.co'
const supabaseKey = 'sb_publishable_vdsL--_aY3tj4Y_3RROdcQ_zBZhF-bH'

export const supabase = createClient(supabaseUrl, supabaseKey)