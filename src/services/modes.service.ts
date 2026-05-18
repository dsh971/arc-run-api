import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env'

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

export interface Mode {
  id: string
  name: string
  slug: string
  chaser_type: 'zombie' | 'human' | 'robot'
  pace_min_secs: number
  pace_max_secs: number
  color_token: string
  descriptor: string | null
  is_free: boolean
  storekit_id: string | null
  sort_order: number
}

let cachedVersion = -1

export class ModesService {
  async getActiveModes(): Promise<Mode[]> {
    const { data, error } = await supabase
      .from('modes')
      .select('id, name, slug, chaser_type, pace_min_secs, pace_max_secs, color_token, descriptor, is_free, storekit_id, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw new Error(error.message)
    return (data ?? []) as Mode[]
  }

  async getVersion(): Promise<number> {
    return cachedVersion
  }
}
