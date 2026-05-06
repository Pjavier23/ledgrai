import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function tableExists(tableName: string): Promise<boolean> {
  const { error } = await supabase.from(tableName).select('id').limit(1)
  // If error code is PGRST205, table doesn't exist
  if (error && (error.code === 'PGRST205' || error.message?.includes('schema cache'))) {
    return false
  }
  return true
}

async function bucketExists(bucketName: string): Promise<boolean> {
  const { error } = await supabase.storage.getBucket(bucketName)
  return !error
}

export async function GET() {
  const tables = ['bk_clients', 'bk_documents', 'bk_tax_events']
  const status: Record<string, boolean> = {}

  for (const t of tables) {
    status[t] = await tableExists(t)
  }

  const bucket = await bucketExists('bk-documents')

  // Try to create storage bucket if missing
  let bucketCreated = false
  if (!bucket) {
    const { error } = await supabase.storage.createBucket('bk-documents', { public: false })
    bucketCreated = !error
  }

  const allTablesExist = Object.values(status).every(Boolean)

  const setupSql = `-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard/project/tkljofxcndnwqyqrtrnx/sql/new)

CREATE TABLE IF NOT EXISTS bk_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid,
  business_name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  industry text,
  subscription_status text DEFAULT 'trial',
  stripe_customer_id text,
  stripe_subscription_id text,
  monthly_fee numeric DEFAULT 100.00,
  invite_token text UNIQUE DEFAULT encode(gen_random_bytes(16),'hex'),
  onboarded_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bk_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES bk_clients(id) ON DELETE CASCADE,
  uploaded_by uuid,
  doc_type text,
  file_name text,
  file_url text,
  thumbnail_url text,
  vendor text,
  amount numeric,
  doc_date date,
  category text,
  description text,
  ai_summary text,
  ai_processed boolean DEFAULT false,
  is_income boolean DEFAULT false,
  tax_deductible boolean DEFAULT true,
  extracted boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bk_tax_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES bk_clients(id) ON DELETE CASCADE,
  event_type text,
  quarter text,
  title text NOT NULL,
  due_date date NOT NULL,
  description text,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bk_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE bk_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bk_tax_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS allow_all ON bk_clients;
DROP POLICY IF EXISTS allow_all ON bk_documents;
DROP POLICY IF EXISTS allow_all ON bk_tax_events;

CREATE POLICY allow_all ON bk_clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON bk_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON bk_tax_events FOR ALL USING (true) WITH CHECK (true);

-- Seed demo clients
INSERT INTO bk_clients (business_name, contact_name, email, industry, subscription_status, monthly_fee)
SELECT 'SS Maryland Fence LLC', 'Carlos Rivera', 'ssmarylandfencellc@gmail.com', 'construction', 'active', 100
WHERE NOT EXISTS (SELECT 1 FROM bk_clients WHERE business_name = 'SS Maryland Fence LLC');

INSERT INTO bk_clients (business_name, contact_name, email, industry, subscription_status, monthly_fee)
SELECT 'Elite Wall Systems LLC', 'Yhaile', 'yhaile@elitewallsystemsllc.com', 'contractor', 'active', 100
WHERE NOT EXISTS (SELECT 1 FROM bk_clients WHERE business_name = 'Elite Wall Systems LLC');

INSERT INTO bk_clients (business_name, contact_name, email, industry, subscription_status, monthly_fee)
SELECT 'Vas Dynamic Mechanical LLC', 'Vas', 'vasdynamicmechanicalllc@gmail.com', 'hvac', 'trial', 100
WHERE NOT EXISTS (SELECT 1 FROM bk_clients WHERE business_name = 'Vas Dynamic Mechanical LLC');`

  return NextResponse.json({
    tables: status,
    allTablesExist,
    bucket: { exists: bucket || bucketCreated, created: bucketCreated },
    setupSql,
    supabaseUrl: 'https://supabase.com/dashboard/project/tkljofxcndnwqyqrtrnx/sql/new',
  })
}
