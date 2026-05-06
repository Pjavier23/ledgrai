import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('bk_clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      // Check if it's a "table not found" error
      if (error.code === 'PGRST205' || error.message?.includes('bk_clients') || error.message?.includes('schema cache')) {
        return NextResponse.json({ needsSetup: true, error: 'Database tables not yet created. Visit /setup to initialize.' }, { status: 503 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ clients: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, needsSetup: true }, { status: 503 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { business_name, industry, email, phone, owner_name, monthly_fee, status } = body

    // Create client
    const { data: client, error } = await supabase
      .from('bk_clients')
      .insert({
        business_name,
        industry,
        email,
        phone,
        contact_name: owner_name,
        monthly_fee: monthly_fee || 100,
        subscription_status: status || 'active',
      })
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('bk_clients') || error.message?.includes('schema cache')) {
        return NextResponse.json({ needsSetup: true, error: 'Database tables not yet created. Visit /setup to initialize.' }, { status: 503 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Auto-create 4 quarterly tax events
    const currentYear = new Date().getFullYear()
    const taxEvents = [
      { client_id: client.id, title: 'Q1 Estimated Tax', quarter: 'Q1', due_date: `${currentYear}-04-15`, description: 'Q1 Estimated Tax (Jan–Mar)', completed: false },
      { client_id: client.id, title: 'Q2 Estimated Tax', quarter: 'Q2', due_date: `${currentYear}-06-15`, description: 'Q2 Estimated Tax (Apr–Jun)', completed: false },
      { client_id: client.id, title: 'Q3 Estimated Tax', quarter: 'Q3', due_date: `${currentYear}-09-15`, description: 'Q3 Estimated Tax (Jul–Sep)', completed: false },
      { client_id: client.id, title: 'Q4 Estimated Tax', quarter: 'Q4', due_date: `${currentYear + 1}-01-15`, description: 'Q4 Estimated Tax (Oct–Dec)', completed: false },
    ]

    await supabase.from('bk_tax_events').insert(taxEvents)

    return NextResponse.json({ client }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
