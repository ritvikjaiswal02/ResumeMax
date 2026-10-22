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

/** Free users get this many tries of each Pro tool. */
export const FREE_PRO_LIMIT = 2
export const PRO_TOOLS = ['cover', 'outreach', 'interview', 'portfolio']

/** Free tries left for one tool. Needs free_pro_uses. */
export function freeUsesLeft(profile, tool) {
  const used = Number(profile?.free_pro_uses?.[tool] ?? 0)
  return Math.max(0, FREE_PRO_LIMIT - used)
}

/**
 * Access to a Pro tool: 'pro' on an active plan, 'trial' while free tries
 * for that tool remain, otherwise null.
 * Needs plan, plan_expires_at and free_pro_uses.
 */
export function getProAccess(profile, tool) {
  if (getEffectivePlan(profile) === 'pro') return 'pro'
  if (profile && freeUsesLeft(profile, tool) > 0) return 'trial'
  return null
}

/**
 * Spend one free try of a tool. Call only after a successful generation.
 * The DB function only increments while under the limit, so racing requests
 * can't overspend. Throws on DB errors.
 */
export async function consumeFreeProUse(supabase, userId, tool) {
  const { data, error } = await supabase.rpc('use_free_pro', {
    p_user: userId,
    p_tool: tool,
    p_limit: FREE_PRO_LIMIT,
  })
  if (error) throw error
  return data === true
}
