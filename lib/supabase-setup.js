'use client';
import { createClient } from './supabase-browser';

const supabase = createClient();

/**
 * After login, ensure user exists in users table and has a company.
 * If company is empty, seed demo data.
 * Returns company_id.
 */
export async function ensureUserSetup() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Check if user already in users table
  const { data: existingUser } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (existingUser?.company_id) {
    return existingUser.company_id;
  }

  // Create company for this user
  const { data: company, error: compErr } = await supabase
    .from('companies')
    .insert({ name: user.email.split('@')[0] + 'の会社' })
    .select()
    .single();

  if (compErr || !company) {
    console.error('Company creation failed:', compErr);
    return null;
  }

  const companyId = company.id;

  // Register user
  await supabase.from('users').insert({
    id: user.id,
    company_id: companyId,
    name: user.email.split('@')[0],
    email: user.email,
    role: 'admin',
  });

  // Seed demo data for this company
  await seedDemoData(companyId);

  return companyId;
}

async function seedDemoData(companyId) {
  // Employees
  const { data: emps } = await supabase.from('employees').insert([
    { company_id: companyId, name: "田中 太郎", dept: "営業部", job_title: "営業部長", salary: 450000, email: "tanaka@demo.co.jp", hired_date: "2022-04-01", paid_leave_total: 15, paid_leave_used: 3 },
    { company_id: companyId, name: "佐藤 花子", dept: "経理部", job_title: "経理主任", salary: 380000, email: "sato@demo.co.jp", hired_date: "2021-06-15", paid_leave_total: 18, paid_leave_used: 5 },
    { company_id: companyId, name: "鈴木 一郎", dept: "営業部", job_title: "営業担当", salary: 320000, email: "suzuki@demo.co.jp", hired_date: "2023-01-10", paid_leave_total: 12, paid_leave_used: 2 },
    { company_id: companyId, name: "山田 美咲", dept: "物流部", job_title: "倉庫管理", salary: 300000, email: "yamada@demo.co.jp", hired_date: "2023-07-01", paid_leave_total: 10, paid_leave_used: 1 },
  ]).select();

  // Customers
  const { data: custs } = await supabase.from('customers').insert([
    { company_id: companyId, name: "ABC商事", contact_person: "山本健一", email: "y@abc.co.jp", industry: "製造業", revenue: 50000000, ai_score: 85, status: "active" },
    { company_id: companyId, name: "XYZテクノロジー", contact_person: "伊藤直美", email: "i@xyz.co.jp", industry: "IT", revenue: 30000000, ai_score: 72, status: "active" },
    { company_id: companyId, name: "グローバル物産", contact_person: "中村誠", email: "n@g.co.jp", industry: "商社", revenue: 80000000, ai_score: 91, status: "active" },
    { company_id: companyId, name: "サンライズ工業", contact_person: "小林恵", email: "k@sr.co.jp", industry: "製造", revenue: 25000000, ai_score: 58, status: "prospect" },
  ]).select();

  if (!custs || custs.length < 4) return;

  // Deals
  await supabase.from('deals').insert([
    { company_id: companyId, customer_id: custs[0].id, title: "製造ライン自動化", amount: 12000000, stage: "proposal", probability: 70 },
    { company_id: companyId, customer_id: custs[1].id, title: "クラウド移行", amount: 5000000, stage: "negotiation", probability: 85 },
    { company_id: companyId, customer_id: custs[2].id, title: "年間保守契約", amount: 8000000, stage: "won", probability: 100 },
    { company_id: companyId, customer_id: custs[3].id, title: "品質管理システム", amount: 3500000, stage: "qualification", probability: 40 },
    { company_id: companyId, customer_id: custs[0].id, title: "IoTセンサー追加", amount: 4500000, stage: "proposal", probability: 60 },
    { company_id: companyId, customer_id: custs[1].id, title: "セキュリティ監査", amount: 2000000, stage: "lead", probability: 20 },
    { company_id: companyId, customer_id: custs[2].id, title: "データ基盤構築", amount: 15000000, stage: "processing", probability: 95 },
    { company_id: companyId, customer_id: custs[3].id, title: "社内研修パッケージ", amount: 1500000, stage: "lead", probability: 15 },
  ]);

  // Products
  const { data: prods } = await supabase.from('products').insert([
    { company_id: companyId, name: "コントローラ A100", sku: "AC-A100", category: "制御", price: 150000, cost: 85000, stock: 45, reorder_point: 10, warehouse: "東京" },
    { company_id: companyId, name: "センサー S200", sku: "SM-S200", category: "センサー", price: 35000, cost: 18000, stock: 120, reorder_point: 30, warehouse: "東京" },
    { company_id: companyId, name: "通信ユニット C300", sku: "CU-C300", category: "通信", price: 80000, cost: 42000, stock: 8, reorder_point: 15, warehouse: "大阪" },
    { company_id: companyId, name: "電源 P400", sku: "PM-P400", category: "電源", price: 25000, cost: 12000, stock: 200, reorder_point: 50, warehouse: "東京" },
    { company_id: companyId, name: "IoTゲートウェイ G500", sku: "IG-G500", category: "IoT", price: 120000, cost: 65000, stock: 3, reorder_point: 10, warehouse: "大阪" },
  ]).select();

  if (!prods || prods.length < 5) return;

  // Orders + Order Items
  const { data: ord1 } = await supabase.from('orders').insert({
    company_id: companyId, customer_id: custs[0].id, order_date: "2025-03-10", status: "confirmed", total: 1450000,
  }).select().single();
  if (ord1) {
    await supabase.from('order_items').insert([
      { order_id: ord1.id, product_id: prods[0].id, quantity: 5, unit_price: 150000 },
      { order_id: ord1.id, product_id: prods[1].id, quantity: 20, unit_price: 35000 },
    ]);
  }

  const { data: ord2 } = await supabase.from('orders').insert({
    company_id: companyId, customer_id: custs[2].id, order_date: "2025-03-12", status: "shipped", total: 1250000,
  }).select().single();
  if (ord2) {
    await supabase.from('order_items').insert([
      { order_id: ord2.id, product_id: prods[3].id, quantity: 50, unit_price: 25000 },
    ]);
  }

  const { data: ord3 } = await supabase.from('orders').insert({
    company_id: companyId, customer_id: custs[1].id, order_date: "2025-03-14", status: "pending", total: 480000,
  }).select().single();
  if (ord3) {
    await supabase.from('order_items').insert([
      { order_id: ord3.id, product_id: prods[4].id, quantity: 2, unit_price: 120000 },
      { order_id: ord3.id, product_id: prods[2].id, quantity: 3, unit_price: 80000 },
    ]);
  }

  // Invoices
  await supabase.from('invoices').insert([
    { company_id: companyId, order_id: ord1?.id, customer_id: custs[0].id, invoice_date: "2025-03-10", due_date: "2025-04-10", amount: 1450000, tax: 145000, total: 1595000, paid: 0, status: "sent" },
    { company_id: companyId, order_id: ord2?.id, customer_id: custs[2].id, invoice_date: "2025-03-12", due_date: "2025-04-12", amount: 1250000, tax: 125000, total: 1375000, paid: 1375000, status: "paid" },
  ]);

  // Journals
  await supabase.from('journals').insert([
    { company_id: companyId, journal_date: "2025-03-10", description: "ABC商事 売上計上", debit_account: "売掛金", debit_amount: 1450000, credit_account: "売上高", credit_amount: 1450000, is_auto: true, ref_type: "invoice" },
    { company_id: companyId, journal_date: "2025-03-12", description: "グローバル物産 売上計上", debit_account: "売掛金", debit_amount: 1250000, credit_account: "売上高", credit_amount: 1250000, is_auto: true, ref_type: "invoice" },
    { company_id: companyId, journal_date: "2025-03-05", description: "事務用品購入", debit_account: "消耗品費", debit_amount: 32000, credit_account: "現金", credit_amount: 32000, is_auto: false },
    { company_id: companyId, journal_date: "2025-03-01", description: "オフィス家賃", debit_account: "地代家賃", debit_amount: 350000, credit_account: "普通預金", credit_amount: 350000, is_auto: false },
    { company_id: companyId, journal_date: "2025-03-13", description: "グローバル物産 入金消込", debit_account: "普通預金", debit_amount: 1375000, credit_account: "売掛金", credit_amount: 1375000, is_auto: true, ref_type: "payment" },
  ]);

  // Activities
  await supabase.from('activities').insert([
    { company_id: companyId, customer_id: custs[0].id, activity_date: "2025-03-14", activity_type: "meeting", user_name: "田中 太郎", note: "製造ライン自動化の提案書を提出。先方技術部の反応良好。" },
    { company_id: companyId, customer_id: custs[1].id, activity_date: "2025-03-12", activity_type: "email", user_name: "鈴木 一郎", note: "クラウド移行の見積書を送付。" },
    { company_id: companyId, customer_id: custs[2].id, activity_date: "2025-03-08", activity_type: "meeting", user_name: "田中 太郎", note: "年間保守契約の更新条件について打合せ。" },
  ]);

  // Automation logs
  await supabase.from('automation_logs').insert([
    { company_id: companyId, trigger_name: "受注確定", action_name: "請求書自動生成", detail: "ABC商事 ¥1,595,000" },
    { company_id: companyId, trigger_name: "請求書発行", action_name: "売上仕訳自動生成", detail: "売掛金/売上高 ¥1,450,000" },
    { company_id: companyId, trigger_name: "入金登録", action_name: "売掛金消込仕訳", detail: "普通預金/売掛金 ¥1,375,000" },
  ]);

  // Notifications
  await supabase.from('notifications').insert([
    { company_id: companyId, message: "IoTゲートウェイ G500 在庫低下（残3個）", notification_type: "warning", is_read: false },
    { company_id: companyId, message: "グローバル物産 入金確認・消込完了", notification_type: "success", is_read: true },
  ]);
}
