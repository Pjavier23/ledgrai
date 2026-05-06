import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  const queries = [
    `CREATE TABLE IF NOT EXISTS bk_clients (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid, business_name text NOT NULL, contact_name text, email text, phone text, industry text, subscription_status text DEFAULT 'trial', stripe_customer_id text, stripe_subscription_id text, monthly_fee numeric DEFAULT 100.00, invite_token text UNIQUE DEFAULT encode(gen_random_bytes(16),'hex'), onboarded_at timestamptz, created_at timestamptz DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS bk_documents (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), client_id uuid REFERENCES bk_clients(id) ON DELETE CASCADE, uploaded_by uuid, doc_type text, file_url text, thumbnail_url text, vendor text, amount numeric, doc_date date, category text, description text, ai_summary text, ai_processed boolean DEFAULT false, is_income boolean DEFAULT false, tax_deductible boolean DEFAULT true, notes text, created_at timestamptz DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS bk_tax_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), client_id uuid REFERENCES bk_clients(id) ON DELETE CASCADE, event_type text, due_date date NOT NULL, title text NOT NULL, description text, completed boolean DEFAULT false, completed_at timestamptz, created_at timestamptz DEFAULT now())`,
    `ALTER TABLE bk_clients ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE bk_documents ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE bk_tax_events ENABLE ROW LEVEL SECURITY`,
    `CREATE POLICY IF NOT EXISTS allow_all ON bk_clients FOR ALL USING (true) WITH CHECK (true)`,
    `CREATE POLICY IF NOT EXISTS allow_all ON bk_documents FOR ALL USING (true) WITH CHECK (true)`,
    `CREATE POLICY IF NOT EXISTS allow_all ON bk_tax_events FOR ALL USING (true) WITH CHECK (true)`,
    `INSERT INTO bk_clients (business_name,contact_name,email,industry,subscription_status,monthly_fee) SELECT 'SS Maryland Fence LLC','Carlos Rivera','ssmarylandfencellc@gmail.com','construction','active',100 WHERE NOT EXISTS (SELECT 1 FROM bk_clients WHERE business_name='SS Maryland Fence LLC')`,
    `INSERT INTO bk_clients (business_name,contact_name,email,industry,subscription_status,monthly_fee) SELECT 'Elite Wall Systems LLC','Yhaile','yhaile@elitewallsystemsllc.com','contractor','active',100 WHERE NOT EXISTS (SELECT 1 FROM bk_clients WHERE business_name='Elite Wall Systems LLC')`,
    `INSERT INTO bk_clients (business_name,contact_name,email,industry,subscription_status,monthly_fee) SELECT 'Vas Dynamic Mechanical LLC','Vas','vasdynamicmechanicalllc@gmail.com','hvac','trial',100 WHERE NOT EXISTS (SELECT 1 FROM bk_clients WHERE business_name='Vas Dynamic Mechanical LLC')`,
  ]

  const results: string[] = []
  for (const q of queries) {
    const res = await fetch(`${url}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q })
    })
    results.push(`${q.slice(0,40)}: ${res.status}`)
  }

  return NextResponse.json({ done: true, results })
}
