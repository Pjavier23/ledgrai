import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('client_id')

    let query = supabase.from('bk_documents').select('*').order('created_at', { ascending: false })
    if (clientId) query = query.eq('client_id', clientId)

    const { data, error } = await query
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('bk_documents') || error.message?.includes('schema cache')) {
        return NextResponse.json({ needsSetup: true, documents: [], error: 'Database tables not yet created.' }, { status: 503 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ documents: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, documents: [] }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const clientId = formData.get('client_id') as string

    if (!file || !clientId) {
      return NextResponse.json({ error: 'Missing file or client_id' }, { status: 400 })
    }

    const fileBuffer = await file.arrayBuffer()
    const fileName = `${clientId}/${Date.now()}-${file.name}`

    // Ensure the bucket exists (create if not)
    const { error: bucketCheckError } = await supabase.storage.getBucket('bk-documents')
    if (bucketCheckError) {
      // Try to create it
      await supabase.storage.createBucket('bk-documents', { public: true })
    }

    // Upload to Supabase Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('bk-documents')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (storageError) {
      console.error('Storage error:', storageError)
    }

    const { data: urlData } = supabase.storage.from('bk-documents').getPublicUrl(fileName)
    const fileUrl = urlData?.publicUrl || ''

    // Save document record
    const { data: doc, error: dbError } = await supabase
      .from('bk_documents')
      .insert({
        client_id: clientId,
        file_url: fileUrl,
        doc_type: file.type.startsWith('image/') ? 'receipt' : 'document',
        ai_processed: false,
        description: file.name,
      })
      .select()
      .single()

    if (dbError) {
      if (dbError.code === 'PGRST205' || dbError.message?.includes('bk_documents') || dbError.message?.includes('schema cache')) {
        return NextResponse.json({ needsSetup: true, error: 'Database tables not yet created. Visit /setup to initialize.' }, { status: 503 })
      }
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // Trigger extraction in background (non-blocking)
    if (fileUrl) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ledgrai-mu.vercel.app'
      fetch(`${appUrl}/api/documents/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: doc.id, file_url: fileUrl }),
      }).catch(console.error)
    }

    return NextResponse.json({ document: doc }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
