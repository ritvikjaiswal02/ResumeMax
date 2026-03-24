import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

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
  const rawBody = await request.text()
  const signature = request.headers.get('x-razorpay-signature')
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET

  if (!secret) {
    console.error('[webhook] RAZORPAY_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  /* ── 1. Verify webhook signature ── */
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')

  if (expected !== signature) {
    console.error('[webhook] invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(rawBody)

  /* ── 2. Only handle payment.captured ── */
  if (event.event !== 'payment.captured') {
    return NextResponse.json({ received: true })
  }

  const payment = event.payload?.payment?.entity
  if (!payment) return NextResponse.json({ received: true })

  const userId   = payment.notes?.user_id
  const planId   = payment.notes?.plan || 'season'
  const paymentId = payment.id

  if (!userId) {
    console.error('[webhook] no user_id in payment notes — payment', paymentId)
    return NextResponse.json({ received: true })
  }

  const expiresAt = calcExpiry(planId)

  /* ── 3. Upgrade profile ── */
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      plan:                'pro',
      plan_id:             planId,
      plan_expires_at:     expiresAt,
      razorpay_payment_id: paymentId,
      upgraded_at:         new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('[webhook] upgrade failed for user', userId, error.message)
    /* Return 200 so Razorpay doesn't retry — log for manual fix */
    return NextResponse.json({ received: true, error: error.message })
  }

  console.log(`[webhook] ✓ user=${userId} plan=${planId} expires=${expiresAt ?? 'never'} payment=${paymentId}`)
  return NextResponse.json({ received: true, success: true })
}
