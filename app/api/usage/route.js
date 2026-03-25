import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let { data: profile } = await supabase
    .from('profiles')
    .select('analyses_used, plan, plan_id, plan_expires_at')
    .eq('id', user.id)
    .single()

  if (!profile) profile = { analyses_used: 0, plan: 'free', plan_id: null, plan_expires_at: null }

  /* ── Auto-expire: if plan_expires_at is in the past, downgrade to free ── */
  let effectivePlan = profile.plan
  if (profile.plan === 'pro' && profile.plan_expires_at) {
    const expired = new Date(profile.plan_expires_at) < new Date()
    if (expired) {
      effectivePlan = 'free'
      /* Downgrade in DB (fire-and-forget) */
      supabase
        .from('profiles')
        .update({ plan: 'free' })
        .eq('id', user.id)
        .then(() => console.log(`[usage] auto-expired plan for user ${user.id}`))
        .catch(() => {})
    }
  }

  return NextResponse.json({
    analyses_used:   profile.analyses_used,
    plan:            effectivePlan,
    plan_id:         profile.plan_id,
    plan_expires_at: profile.plan_expires_at,
    limit:           5,
  })
}
