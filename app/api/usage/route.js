import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getEffectivePlan, freeUsesLeft, FREE_PRO_LIMIT, PRO_TOOLS } from '@/lib/plan'

export async function GET(request) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let { data: profile } = await supabase
    .from('profiles')
    .select('analyses_used, plan, plan_id, plan_expires_at, free_pro_uses, bonus_analyses, referral_code')
    .eq('id', user.id)
    .single()

  if (!profile) profile = { analyses_used: 0, plan: 'free', plan_id: null, plan_expires_at: null, free_pro_uses: {}, bonus_analyses: 0, referral_code: null }

  /* ── Auto-expire: if plan_expires_at is in the past, downgrade to free ── */
  const effectivePlan = getEffectivePlan(profile)
  if (profile.plan === 'pro' && effectivePlan !== 'pro') {
    /* Downgrade in DB (fire-and-forget). The expiry filter keeps this from
       undoing a renewal that lands between the read above and this write. */
    supabase
      .from('profiles')
      .update({ plan: 'free' })
      .eq('id', user.id)
      .lt('plan_expires_at', new Date().toISOString())
      .then(() => console.log(`[usage] auto-expired plan for user ${user.id}`))
      .catch(() => {})
  }

  const bonus = profile.bonus_analyses ?? 0
  return NextResponse.json({
    analyses_used:   profile.analyses_used,
    plan:            effectivePlan,
    plan_id:         profile.plan_id,
    plan_expires_at: profile.plan_expires_at,
    free_pro_left:   Object.fromEntries(PRO_TOOLS.map((t) => [t, freeUsesLeft(profile, t)])),
    free_pro_limit:  FREE_PRO_LIMIT,
    bonus_analyses:  bonus,
    referral_code:   profile.referral_code ?? null,
    limit:           5 + bonus,
  })
}
