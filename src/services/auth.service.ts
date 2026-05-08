import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env'
import { ApiError } from '../types'

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)

const USERNAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_]{1,18}[a-zA-Z0-9]$/
const CONSECUTIVE_UNDERSCORE_REGEX = /__/

export class AuthService {
  async isUsernameAvailable(username: string): Promise<boolean> {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .ilike('username', username)
      .maybeSingle()

    return data === null
  }

  async setUsername(userId: string, username: string): Promise<void> {
    if (!USERNAME_REGEX.test(username) || CONSECUTIVE_UNDERSCORE_REGEX.test(username)) {
      const err: ApiError = new Error('Letters, numbers, and underscores only')
      err.statusCode = 400
      throw err
    }

    const available = await this.isUsernameAvailable(username)
    if (!available) {
      const err: ApiError = new Error('This call sign is taken. Choose another.')
      err.statusCode = 409
      throw err
    }

    const { error } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', userId)

    if (error) {
      throw new Error(error.message)
    }
  }
}
