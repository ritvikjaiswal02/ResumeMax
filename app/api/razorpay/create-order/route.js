import Razorpay from 'razorpay'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const PLANS = {
  sprint:    { amount: 14900, label: '1-Month Sprint'    },
  season:    { amount: 29900, label: 'Placement Season'  },
  grind:     { amount: 49900, label: 'Off-Campus Grind'  },
  // legacy fallbacks
  lifetime:  { amount: 79900, label: 'Lifetime Access'   },
  pro:       { amount: 49900, label: 'Pro Plan'          },
}

export async function POST(request) {
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let plan = 'season'
  try {
    const body = await request.json()
    if (body?.plan && PLANS[body.plan]) plan = body.plan
  } catch { /* no body or invalid JSON — use default */ }

  const { amount, label } = PLANS[plan]

  try {
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `receipt_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: { user_id: user.id, email: user.email, plan, label },
    })

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
      plan,
      label,
    })
  } catch (err) {
    console.error('[razorpay] create-order error:', err)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
