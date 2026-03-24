import crypto from 'crypto'
import Razorpay from 'razorpay'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/* How many days each plan is valid. null = never expires */
const PLAN_DAYS = {
  sprint:   30,
  season:   90,
  grind:    180,
  lifetime: null,
  pro:      null,
}

function calcExpiry(planId) {
  const days = PLAN_DAYS[planId]
  if (days === null || days === undefined) return null
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

export async function POST(request) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json()

  /* ── 1. Verify HMAC signature ── */
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')

  if (expected !== razorpay_signature) {
    console.error('[razorpay/verify] signature mismatch — user', user.id)
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
  }

  /* ── 2. Fetch order notes to find which plan was purchased ── */
  let planId = 'season' // safe fallback
  try {
    const rzp = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
    const order = await rzp.orders.fetch(razorpay_order_id)
    if (order?.notes?.plan && PLAN_DAYS[order.notes.plan] !== undefined) {
      planId = order.notes.plan
    }
  } catch (e) {
    console.warn('[razorpay/verify] could not fetch order notes:', e.message)
  }

  const expiresAt = calcExpiry(planId)

  /* ── 3. Upgrade profile ── */
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      plan:                'pro',
      plan_id:             planId,
      plan_expires_at:     expiresAt,
      razorpay_payment_id,
      upgraded_at:         new Date().toISOString(),
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('[razorpay/verify] upgrade failed:', updateError.message)
    return NextResponse.json({ error: 'Payment verified but upgrade failed' }, { status: 500 })
  }

  console.log(`[razorpay/verify] ✓ user=${user.id} plan=${planId} expires=${expiresAt ?? 'never'} payment=${razorpay_payment_id}`)
  return NextResponse.json({ success: true, plan: 'pro', plan_id: planId, plan_expires_at: expiresAt })
}
