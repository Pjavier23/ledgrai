import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('client_id')

  let query = supabase.from('bk_documents').select('*').order('created_at', { ascending: false })
  if (clientId) query = query.eq('client_id', clientId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ documents: data })
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const clientId = formData.get('client_id') as string

  if (!file || !clientId) {
    return NextResponse.json({ error: 'Missing file or client_id' }, { status: 400 })
  }

  const fileBuffer = await file.arrayBuffer()
  const fileName = `${clientId}/${Date.now()}-${file.name}`

  // Upload to Supabase Storage
  const { data: storageData, error: storageError } = await supabase.storage
    .from('bk-documents')
    .upload(fileName, fileBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (storageError) {
    // If bucket doesn't exist or other storage error, still save the record
    console.error('Storage error:', storageError)
  }

  const { data: urlData } = supabase.storage.from('bk-documents').getPublicUrl(fileName)
  const fileUrl = urlData?.publicUrl || ''

  // Save document record
  const { data: doc, error: dbError } = await supabase
    .from('bk_documents')
    .insert({
      client_id: clientId,
      file_name: file.name,
      file_url: fileUrl,
      extracted: false,
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  // Trigger extraction in background (non-blocking)
  if (fileUrl) {
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/documents/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: doc.id, file_url: fileUrl }),
    }).catch(console.error)
  }

  return NextResponse.json({ document: doc }, { status: 201 })
}
