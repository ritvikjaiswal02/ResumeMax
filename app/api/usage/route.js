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
    .select('analyses_used, plan')
    .eq('id', user.id)
    .single()

  if (!profile) profile = { analyses_used: 0, plan: 'free' }

  return NextResponse.json({
    analyses_used: profile.analyses_used,
    plan: profile.plan,
    limit: 2,
  })
}
