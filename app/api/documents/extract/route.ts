import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { document_id, file_url } = await req.json()

  if (!document_id || !file_url) {
    return NextResponse.json({ error: 'Missing document_id or file_url' }, { status: 400 })
  }

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'placeholder_add_real_key') {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 503 })
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this receipt or invoice image and extract the following information as JSON:
{
  "vendor": "company or person name",
  "amount": 0.00,
  "date": "YYYY-MM-DD",
  "is_income": false,
  "category": "one of: supplies, equipment, utilities, fuel, labor, insurance, rent, meals, software, other",
  "description": "brief description"
}

Rules:
- amount should be a number (no currency symbol)
- is_income: true if it's an invoice/payment received, false if it's an expense/receipt
- date in YYYY-MM-DD format
- Return ONLY valid JSON, no markdown`,
            },
            {
              type: 'image_url',
              image_url: { url: file_url, detail: 'low' },
            },
          ],
        },
      ],
      max_tokens: 300,
    })

    const content = response.choices[0].message.content || '{}'
    let extracted: Record<string, unknown>

    try {
      extracted = JSON.parse(content)
    } catch {
      // Try to extract JSON from response
      const match = content.match(/\{[\s\S]*\}/)
      extracted = match ? JSON.parse(match[0]) : {}
    }

    // Update document record
    const { data, error } = await supabase
      .from('bk_documents')
      .update({
        vendor: extracted.vendor || null,
        amount: typeof extracted.amount === 'number' ? extracted.amount : parseFloat(String(extracted.amount)) || null,
        doc_date: extracted.date || null,
        is_income: extracted.is_income || false,
        category: extracted.category || null,
        description: extracted.description || null,
        extracted: true,
      })
      .eq('id', document_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ document: data, extracted })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Extraction failed'
    console.error('OpenAI extraction error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
