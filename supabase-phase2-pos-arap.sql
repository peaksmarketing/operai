-- =============================================
-- Phase 2: POSレジ + 債権債務管理
-- Supabase SQL Editor で実行してください
-- =============================================

-- 16. POS売上 (pos_sales)
CREATE TABLE IF NOT EXISTS pos_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  sale_date DATE DEFAULT CURRENT_DATE,
  ts TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  subtotal BIGINT DEFAULT 0,
  tax BIGINT DEFAULT 0,
  total BIGINT DEFAULT 0,
  method TEXT DEFAULT 'cash' CHECK (method IN ('cash', 'card', 'qr', 'emoney')),
  received BIGINT DEFAULT 0,
  change_amount BIGINT DEFAULT 0,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'refunded')),
  settled BOOLEAN DEFAULT false,
  settled_date DATE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  staff TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 17. 買掛金・未払金 (payables)
CREATE TABLE IF NOT EXISTS payables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  supplier TEXT NOT NULL,
  payable_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  amount BIGINT DEFAULT 0,
  tax BIGINT DEFAULT 0,
  total BIGINT DEFAULT 0,
  paid BIGINT DEFAULT 0,
  status TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid')),
  paid_date DATE,
  description TEXT,
  account TEXT DEFAULT '仕入高',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pos_sales_company ON pos_sales(company_id, sale_date);
CREATE INDEX IF NOT EXISTS idx_payables_company ON payables(company_id, due_date);

-- RLS
ALTER TABLE pos_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE payables ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['pos_sales', 'payables']) LOOP
    EXECUTE format('
      CREATE POLICY "select own company" ON %I FOR SELECT USING (company_id = get_my_company_id());
      CREATE POLICY "insert own company" ON %I FOR INSERT WITH CHECK (company_id = get_my_company_id());
      CREATE POLICY "update own company" ON %I FOR UPDATE USING (company_id = get_my_company_id());
      CREATE POLICY "delete own company" ON %I FOR DELETE USING (company_id = get_my_company_id());
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END $$;
