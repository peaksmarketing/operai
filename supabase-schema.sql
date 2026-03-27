-- =============================================
-- Operai Database Schema
-- Supabase PostgreSQL
-- =============================================

-- 1. Companies (テナント)
CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  representative TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  corp_number TEXT,
  fiscal_month_start INT DEFAULT 4,
  fiscal_month_end INT DEFAULT 3,
  plan TEXT DEFAULT 'pro',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Users (ユーザー = Supabase Auth連携)
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Employees (従業員マスタ)
CREATE TABLE employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  dept TEXT,
  job_title TEXT,
  salary INT DEFAULT 0,
  email TEXT,
  phone TEXT,
  hired_date DATE,
  paid_leave_total INT DEFAULT 20,
  paid_leave_used INT DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Customers (顧客)
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  industry TEXT,
  revenue BIGINT DEFAULT 0,
  ai_score INT DEFAULT 50,
  status TEXT DEFAULT 'prospect' CHECK (status IN ('active', 'prospect', 'inactive')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Deals (案件)
CREATE TABLE deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  amount BIGINT DEFAULT 0,
  stage TEXT DEFAULT 'lead' CHECK (stage IN ('lead', 'qualification', 'proposal', 'negotiation', 'processing', 'won', 'lost')),
  probability INT DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Products (商品マスタ)
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  price INT DEFAULT 0,
  cost INT DEFAULT 0,
  stock INT DEFAULT 0,
  reorder_point INT DEFAULT 5,
  warehouse TEXT DEFAULT '東京',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Orders (受注)
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped')),
  total BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Order Items (受注明細)
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INT DEFAULT 1,
  unit_price INT DEFAULT 0
);

-- 9. Invoices (請求書)
CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  amount BIGINT DEFAULT 0,
  tax BIGINT DEFAULT 0,
  total BIGINT DEFAULT 0,
  paid BIGINT DEFAULT 0,
  status TEXT DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'partial', 'paid')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Journals (仕訳)
CREATE TABLE journals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  journal_date DATE DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  debit_account TEXT NOT NULL,
  debit_amount BIGINT DEFAULT 0,
  credit_account TEXT NOT NULL,
  credit_amount BIGINT DEFAULT 0,
  is_auto BOOLEAN DEFAULT false,
  ref_type TEXT,
  ref_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Activities (顧客対応履歴)
CREATE TABLE activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  activity_date DATE DEFAULT CURRENT_DATE,
  activity_type TEXT DEFAULT 'other' CHECK (activity_type IN ('call', 'email', 'meeting', 'other')),
  user_name TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Automation Logs (自動連携ログ)
CREATE TABLE automation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now(),
  trigger_name TEXT NOT NULL,
  action_name TEXT NOT NULL,
  detail TEXT
);

-- 13. Notifications (通知)
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT DEFAULT 'info' CHECK (notification_type IN ('info', 'success', 'warning', 'danger')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Purchase Orders (発注)
CREATE TABLE purchase_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  supplier TEXT,
  order_date DATE DEFAULT CURRENT_DATE,
  expected_date DATE,
  amount BIGINT DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ordered', 'received')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. Purchase Order Items (発注明細)
CREATE TABLE purchase_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT,
  quantity INT DEFAULT 1,
  unit_price INT DEFAULT 0
);

-- =============================================
-- Row Level Security (マルチテナント)
-- =============================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Helper function: ログインユーザーのcompany_idを取得
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 各テーブルにRLSポリシー設定（自社データのみアクセス可）
-- companies
CREATE POLICY "users can view own company" ON companies
  FOR SELECT USING (id = get_my_company_id());
CREATE POLICY "admins can update own company" ON companies
  FOR UPDATE USING (id = get_my_company_id());

-- users
CREATE POLICY "users can view company members" ON users
  FOR SELECT USING (company_id = get_my_company_id());

-- 共通パターン: SELECT/INSERT/UPDATE/DELETE を自社に限定
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'employees', 'customers', 'deals', 'products', 'orders',
    'invoices', 'journals', 'activities', 'automation_logs',
    'notifications', 'purchase_orders'
  ]) LOOP
    EXECUTE format('
      CREATE POLICY "select own company" ON %I FOR SELECT USING (company_id = get_my_company_id());
      CREATE POLICY "insert own company" ON %I FOR INSERT WITH CHECK (company_id = get_my_company_id());
      CREATE POLICY "update own company" ON %I FOR UPDATE USING (company_id = get_my_company_id());
      CREATE POLICY "delete own company" ON %I FOR DELETE USING (company_id = get_my_company_id());
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END $$;

-- order_items: ordersを通じてアクセス制御
CREATE POLICY "select own order items" ON order_items
  FOR SELECT USING (order_id IN (SELECT id FROM orders WHERE company_id = get_my_company_id()));
CREATE POLICY "insert own order items" ON order_items
  FOR INSERT WITH CHECK (order_id IN (SELECT id FROM orders WHERE company_id = get_my_company_id()));
CREATE POLICY "delete own order items" ON order_items
  FOR DELETE USING (order_id IN (SELECT id FROM orders WHERE company_id = get_my_company_id()));

-- purchase_order_items: 同様
CREATE POLICY "select own po items" ON purchase_order_items
  FOR SELECT USING (purchase_order_id IN (SELECT id FROM purchase_orders WHERE company_id = get_my_company_id()));
CREATE POLICY "insert own po items" ON purchase_order_items
  FOR INSERT WITH CHECK (purchase_order_id IN (SELECT id FROM purchase_orders WHERE company_id = get_my_company_id()));
CREATE POLICY "delete own po items" ON purchase_order_items
  FOR DELETE USING (purchase_order_id IN (SELECT id FROM purchase_orders WHERE company_id = get_my_company_id()));

-- =============================================
-- Indexes (パフォーマンス)
-- =============================================

CREATE INDEX idx_employees_company ON employees(company_id);
CREATE INDEX idx_customers_company ON customers(company_id);
CREATE INDEX idx_deals_company ON deals(company_id);
CREATE INDEX idx_deals_customer ON deals(customer_id);
CREATE INDEX idx_products_company ON products(company_id);
CREATE INDEX idx_orders_company ON orders(company_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_journals_company ON journals(company_id);
CREATE INDEX idx_activities_company ON activities(company_id);
CREATE INDEX idx_activities_customer ON activities(customer_id);
CREATE INDEX idx_notifications_company ON notifications(company_id);
CREATE INDEX idx_purchase_orders_company ON purchase_orders(company_id);

-- =============================================
-- RPC: 受注確定（トランザクション保護）
-- =============================================
CREATE OR REPLACE FUNCTION confirm_order(
  p_order_id UUID,
  p_company_id UUID,
  p_customer_name TEXT,
  p_tax_rate NUMERIC DEFAULT 0.1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_inv_id UUID;
  v_total NUMERIC;
  v_tax NUMERIC;
  v_inv_total NUMERIC;
  v_item RECORD;
BEGIN
  -- Lock and check order
  SELECT * INTO v_order FROM orders WHERE id = p_order_id AND company_id = p_company_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Order not found');
  END IF;
  IF v_order.status IN ('confirmed', 'shipped') THEN
    RETURN json_build_object('error', 'Order already confirmed');
  END IF;

  v_total := v_order.total;
  v_tax := ROUND(v_total * p_tax_rate);
  v_inv_total := v_total + v_tax;

  -- Update order status
  UPDATE orders SET status = 'confirmed' WHERE id = p_order_id;

  -- Deduct inventory
  FOR v_item IN SELECT oi.product_id, oi.quantity FROM order_items oi WHERE oi.order_id = p_order_id
  LOOP
    UPDATE products SET stock = GREATEST(0, stock - v_item.quantity) WHERE id = v_item.product_id;
  END LOOP;

  -- Create invoice
  INSERT INTO invoices (company_id, order_id, customer_id, invoice_date, due_date, amount, tax, total, paid, status)
  VALUES (p_company_id, p_order_id, v_order.customer_id, CURRENT_DATE, CURRENT_DATE + 30, v_total, v_tax, v_inv_total, 0, 'sent')
  RETURNING id INTO v_inv_id;

  -- Create journal entry
  INSERT INTO journals (company_id, journal_date, description, debit_account, debit_amount, credit_account, credit_amount, is_auto, ref_type)
  VALUES (p_company_id, CURRENT_DATE, p_customer_name || ' 売上計上', '売掛金', v_total, '売上高', v_total, true, 'invoice');

  RETURN json_build_object('success', true, 'invoice_id', v_inv_id, 'inv_total', v_inv_total);
END;
$$;

-- =============================================
-- デモデータ投入
-- =============================================

-- デモ会社
INSERT INTO companies (id, name, representative, address, phone, email, corp_number)
VALUES ('00000000-0000-0000-0000-000000000001', 'デモ株式会社', '山田 太郎', '東京都千代田区丸の内1-1-1', '03-1234-5678', 'info@demo.co.jp', '1234567890123');
