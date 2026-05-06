import { NextResponse } from 'next/server'

export async function GET() {
  const { Pool } = require('pg')
  
  // Supabase connection via transaction pooler
  const pool = new Pool({
    connectionString: `postgresql://postgres.tkljofxcndnwqyqrtrnx:${process.env.DB_PASSWORD}@aws-0-us-west-2.pooler.supabase.com:6543/postgres`,
    ssl: { rejectUnauthorized: false }
  })

  const sql = `
    CREATE TABLE IF NOT EXISTS bk_clients (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id uuid,
      business_name text NOT NULL,
      contact_name text, email text, phone text, industry text,
      subscription_status text DEFAULT 'trial',
      stripe_customer_id text, stripe_subscription_id text,
      monthly_fee numeric DEFAULT 100.00,
      invite_token text UNIQUE DEFAULT encode(gen_random_bytes(16),'hex'),
      onboarded_at timestamptz, created_at timestamptz DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS bk_documents (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id uuid REFERENCES bk_clients(id) ON DELETE CASCADE,
      uploaded_by uuid, doc_type text, file_url text, thumbnail_url text,
      vendor text, amount numeric, doc_date date, category text,
      description text, ai_summary text, ai_processed boolean DEFAULT false,
      is_income boolean DEFAULT false, tax_deductible boolean DEFAULT true,
      notes text, created_at timestamptz DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS bk_tax_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id uuid REFERENCES bk_clients(id) ON DELETE CASCADE,
      event_type text, due_date date NOT NULL, title text NOT NULL,
      description text, completed boolean DEFAULT false,
      completed_at timestamptz, created_at timestamptz DEFAULT now()
    );
    ALTER TABLE bk_clients ENABLE ROW LEVEL SECURITY;
    ALTER TABLE bk_documents ENABLE ROW LEVEL SECURITY;
    ALTER TABLE bk_tax_events ENABLE ROW LEVEL SECURITY;
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bk_clients') THEN
        CREATE POLICY allow_all ON bk_clients FOR ALL USING (true) WITH CHECK (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bk_documents') THEN
        CREATE POLICY allow_all ON bk_documents FOR ALL USING (true) WITH CHECK (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bk_tax_events') THEN
        CREATE POLICY allow_all ON bk_tax_events FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END $$;
    INSERT INTO bk_clients (business_name,contact_name,email,industry,subscription_status,monthly_fee)
    SELECT 'SS Maryland Fence LLC','Carlos Rivera','ssmarylandfencellc@gmail.com','construction','active',100
    WHERE NOT EXISTS (SELECT 1 FROM bk_clients WHERE business_name='SS Maryland Fence LLC');
    INSERT INTO bk_clients (business_name,contact_name,email,industry,subscription_status,monthly_fee)
    SELECT 'Elite Wall Systems LLC','Yhaile','yhaile@elitewallsystemsllc.com','contractor','active',100
    WHERE NOT EXISTS (SELECT 1 FROM bk_clients WHERE business_name='Elite Wall Systems LLC');
    INSERT INTO bk_clients (business_name,contact_name,email,industry,subscription_status,monthly_fee)
    SELECT 'Vas Dynamic Mechanical LLC','Vas','vasdynamicmechanicalllc@gmail.com','hvac','trial',100
    WHERE NOT EXISTS (SELECT 1 FROM bk_clients WHERE business_name='Vas Dynamic Mechanical LLC');
  `

  try {
    await pool.query(sql)
    return NextResponse.json({ ok: true, message: 'Tables created and demo data inserted!' })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  } finally {
    await pool.end()
  }
}
