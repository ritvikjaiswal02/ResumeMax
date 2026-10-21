/**
 * Shared server-side plan checks.
 * Import only in API routes (never in client components).
 */

/**
 * The plan the user has right now. A 'pro' row whose plan_expires_at has
 * passed counts as 'free', even before anything downgrades it in the DB.
 * Needs plan and plan_expires_at.
 */
export function getEffectivePlan(profile) {
  if (!profile?.plan) return 'free'
  if (profile.plan !== 'pro') return profile.plan
  if (!profile.plan_expires_at) return 'pro'

  return new Date(profile.plan_expires_at) < new Date() ? 'free' : 'pro'
}

/**
 * Access to the Pro features covered by the one free Pro use (cover letter,
 * cold outreach, interview prep): 'pro' on an active plan, 'trial' while the
 * free use is unspent, otherwise null.
 * Needs plan, plan_expires_at and free_pro_used.
 */
export function getProAccess(profile) {
  if (getEffectivePlan(profile) === 'pro') return 'pro'
  if (profile && !profile.free_pro_used) return 'trial'
  return null
}

/**
 * Spend the free Pro use. Call only after a successful generation.
 * The update only matches while the free use is unspent, so if parallel
 * trial requests race, exactly one gets true. Throws on DB errors.
 */
export async function consumeFreeProTrial(supabase, userId) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ free_pro_used: true })
    .eq('id', userId)
    .not('free_pro_used', 'is', true)
    .select('id')

  if (error) throw error
  return data.length > 0
}
