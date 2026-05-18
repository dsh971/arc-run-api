import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env'
import { ApiError } from '../types'
import blocklist from '../config/username-blocklist.json'

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/

const BLOCKED_WORDS = new Set([
  ...blocklist.reserved.map(w => w.toLowerCase()),
  ...blocklist.profanity
    .filter(w => !w.startsWith('TODO'))
    .map(w => w.toLowerCase()),
])

function isBlocklisted(username: string): boolean {
  // BLOCKED_WORDS already contains all reserved words (lowercased at module load), so a single Set lookup suffices
  return BLOCKED_WORDS.has(username.toLowerCase())
}

// Raw DB row shape — Supabase generated types predate these stat columns; the select string
// in getProfile guarantees all fields are present at runtime, so the cast is sound.
interface ProfileRow {
  id: string
  username: string | null
  age_declaration_confirmed: boolean
  health_briefing_accepted: boolean
  total_runs_completed: number | null
  total_challenges_survived: number | null
  total_miles_run: number | null
  personal_best_pace_secs: number | null
  consecutive_survival_streak: number | null
}

export interface ProfileResponse {
  id: string
  username: string | null
  age_declaration_confirmed: boolean
  health_briefing_accepted: boolean
  total_runs_completed: number
  total_challenges_survived: number
  total_miles_run: number
  personal_best_pace_secs: number | null
  consecutive_survival_streak: number
}

export class AuthService {
  async getProfile(userId: string): Promise<ProfileResponse> {
    const { data, error } = await supabase
      .from('profiles')
      .select(
        'id, username, age_declaration_confirmed, health_briefing_accepted, ' +
        'total_runs_completed, total_challenges_survived, total_miles_run, ' +
        'personal_best_pace_secs, consecutive_survival_streak'
      )
      .eq('id', userId)
      .single()

    if (error) throw new Error(error.message)

    const row = data as unknown as ProfileRow

    return {
      id: row.id,
      // username stays nullable — the iOS onboarding flow sets it after sign-up, so new profiles legitimately have none
      username: row.username,
      age_declaration_confirmed: row.age_declaration_confirmed,
      health_briefing_accepted: row.health_briefing_accepted,
      // Coalesce to 0 — iOS decoder expects non-optional Int; a DB null on first-run profiles would crash the decoder
      total_runs_completed: row.total_runs_completed ?? 0,
      total_challenges_survived: row.total_challenges_survived ?? 0,
      total_miles_run: row.total_miles_run ?? 0,
      personal_best_pace_secs: row.personal_best_pace_secs ?? null,
      consecutive_survival_streak: row.consecutive_survival_streak ?? 0,
    }
  }

  async setUsername(userId: string, username: string): Promise<void> {
    if (!USERNAME_REGEX.test(username)) {
      const err: ApiError = new Error('Letters, numbers, and underscores only')
      err.statusCode = 400
      throw err
    }

    if (isBlocklisted(username)) {
      const err: ApiError = new Error("That call sign isn't allowed. Choose another.")
      err.statusCode = 400
      throw err
    }

    // No uniqueness check — usernames are display names, UUID is the identifier
    const { error } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', userId)

    if (error) throw new Error(error.message)
  }

  async confirmAgeDeclaration(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({
        age_declaration_confirmed: true,
        age_declaration_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) throw new Error(error.message)
  }

  async confirmHealthBriefing(userId: string, tosVersion: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({
        health_briefing_accepted: true,
        tos_accepted_at: new Date().toISOString(),
        tos_version: tosVersion,
      })
      .eq('id', userId)

    if (error) throw new Error(error.message)
  }
}
