import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
// @ts-ignore - stripe version mismatch

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!) as any

export async function POST(req: NextRequest) {
  const { client_id, email, business_name } = await req.json()

  if (!client_id || !email) {
    return NextResponse.json({ error: 'Missing client_id or email' }, { status: 400 })
  }

  try {
    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      name: business_name,
      metadata: { client_id },
    })

    // Create $100/mo subscription
    // First, find or create the price
    const prices = await stripe.prices.list({
      lookup_keys: ['ledgrai_monthly'],
      expand: ['data.product'],
    })

    let priceId: string

    if (prices.data.length > 0) {
      priceId = prices.data[0].id
    } else {
      // Create product + price
      const product = await stripe.products.create({
        name: 'LedgrAI Monthly Bookkeeping',
        description: 'AI-powered bookkeeping for small businesses',
      })

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: 10000, // $100 in cents
        currency: 'usd',
        recurring: { interval: 'month' },
        lookup_key: 'ledgrai_monthly',
      })

      priceId = price.id
    }

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    })

    // Update client record with Stripe IDs
    const { error } = await supabase
      .from('bk_clients')
      .update({
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        status: 'active',
      })
      .eq('id', client_id)

    if (error) console.error('Supabase update error:', error)

    return NextResponse.json({
      customerId: customer.id,
      subscriptionId: subscription.id,
      status: subscription.status,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Subscription failed'
    console.error('Stripe error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
