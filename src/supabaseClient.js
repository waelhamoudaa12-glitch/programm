import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ekhhuhdoxoxddgmyfmzc.supabase.co'
const supabaseKey = 'sb_publishable_t9_vaYitbOswr0bf6eCIpg_FnooMtxN'

export const supabase = createClient(supabaseUrl, supabaseKey)
