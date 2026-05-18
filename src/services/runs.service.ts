import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env'

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const MAX_RUNS = 10

export interface RunPayload {
  id:             string
  started_at:     string
  ended_at:       string
  distance_miles: number
  duration_secs:  number
  avg_pace_secs:  number
  difficulty_slug: string
  caught_flag:    boolean
  outcome:        'survived' | 'caught'
}

export class RunsService {
  async saveRun(userId: string, run: RunPayload): Promise<void> {
    // onConflict:'id' — client retries on network failure must not create duplicate rows
    const { error } = await supabase
      .from('runs')
      .upsert({ ...run, user_id: userId }, { onConflict: 'id' })

    if (error) throw new Error(error.message)

    // Server enforces the limit because client-side purge can be bypassed or silently fail
    await this.enforceRunLimit(userId)

    // Update permanent aggregate stats
    await this.updateStats(userId, run)
  }

  private async enforceRunLimit(userId: string): Promise<void> {
    const { data: runs, error: fetchError } = await supabase
      .from('runs')
      .select('id, started_at')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })

    if (fetchError) throw new Error(`Failed to fetch runs for limit check: ${fetchError.message}`)
    if (!runs || runs.length <= MAX_RUNS) return

    const idsToDelete = runs.slice(MAX_RUNS).map(r => r.id)
    const { error: deleteError } = await supabase.from('runs').delete().in('id', idsToDelete)
    if (deleteError) throw new Error(`Failed to prune excess runs: ${deleteError.message}`)
  }

  private async fetchStatsInputs(userId: string): Promise<{
    profile: { completed_difficulty_levels: unknown }
    runs: Array<{ outcome: string; distance_miles: number; avg_pace_secs: number; difficulty_slug: string; ended_at: string }>
  }> {
    const [profileResult, runsResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('completed_difficulty_levels')
        .eq('id', userId)
        .single(),
      supabase
        .from('runs')
        .select('outcome, distance_miles, avg_pace_secs, difficulty_slug, ended_at')
        .eq('user_id', userId)
        .order('ended_at', { ascending: false }),
    ])

    if (profileResult.error) throw new Error(`Failed to fetch profile for stats: ${profileResult.error.message}`)
    if (runsResult.error) throw new Error(`Failed to fetch runs for stats: ${runsResult.error.message}`)
    if (!profileResult.data || !runsResult.data) throw new Error('Missing data when computing stats')

    return { profile: profileResult.data, runs: runsResult.data }
  }

  private computeAggregates(
    run: RunPayload,
    runs: Array<{ outcome: string; distance_miles: number; avg_pace_secs: number; difficulty_slug: string }>,
    completedLevels: string[],
  ): {
    totalRuns: number
    totalSurvived: number
    totalMiles: number
    bestPace: number | null
    streak: number
    updatedLevels: string[]
  } {
    const totalRuns     = runs.length
    const totalSurvived = runs.filter(r => r.outcome === 'survived').length
    const totalMiles    = runs.reduce((sum, r) => sum + r.distance_miles, 0)
    const bestPace      = runs.reduce<number | null>((best, r) =>
      best === null || r.avg_pace_secs < best ? r.avg_pace_secs : best, null)

    // Break on first non-survival so we never count across a gap — order DESC guarantees recency
    let streak = 0
    for (const r of runs) {
      if (r.outcome === 'survived') streak++
      else break
    }

    const updatedLevels = completedLevels.includes(run.difficulty_slug)
      ? completedLevels
      : [...completedLevels, run.difficulty_slug]

    return { totalRuns, totalSurvived, totalMiles, bestPace, streak, updatedLevels }
  }

  private async updateStats(userId: string, run: RunPayload): Promise<void> {
    // Full recompute rather than increment — counter drift from retry storms made increments unreliable
    // Outside a transaction intentionally — transient stale stats are acceptable; serializable txn cost is not
    const { profile, runs } = await this.fetchStatsInputs(userId)

    const completedLevels = (profile.completed_difficulty_levels as string[] | null) ?? []
    const aggregates = this.computeAggregates(run, runs, completedLevels)

    const { error } = await supabase
      .from('profiles')
      .update({
        total_runs_completed:        aggregates.totalRuns,
        total_challenges_survived:   aggregates.totalSurvived,
        total_miles_run:             aggregates.totalMiles,
        personal_best_pace_secs:     aggregates.bestPace,
        consecutive_survival_streak: aggregates.streak,
        completed_difficulty_levels: aggregates.updatedLevels,
      })
      .eq('id', userId)

    if (error) throw new Error(`Failed to update profile stats: ${error.message}`)
  }
}
