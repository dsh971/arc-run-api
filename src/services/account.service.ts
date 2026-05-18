import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env'

// Service role client required — auth.admin.deleteUser is an admin-only operation
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

export class AccountService {
  async deleteAccount(userId: string): Promise<void> {
    // Deleting the auth user is sufficient: the DB schema defines cascade deletes
    // on both profiles (references auth.users ON DELETE CASCADE) and
    // runs (references profiles ON DELETE CASCADE), so a single auth deletion
    // removes all associated data atomically at the DB level.
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)
    if (authError) throw new Error(`Failed to delete auth user: ${authError.message}`)
  }
}
