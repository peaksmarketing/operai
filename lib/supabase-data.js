'use client';
import { createClient } from './supabase-browser';

const supabase = createClient();

// Get current user's company_id
async function getCompanyId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('users').select('company_id').eq('id', user.id).single();
  return data?.company_id || null;
}

// =============================================
// LOAD: Fetch all data for the company
// =============================================
export async function loadAllData() {
  const companyId = await getCompanyId();
  if (!companyId) return null;

  const [
    { data: company },
    { data: emps },
    { data: custs },
    { data: deals },
    { data: prods },
    { data: ords },
    { data: orderItems },
    { data: invs },
    { data: jrnl },
    { data: activities },
    { data: alog },
    { data: notifs },
    { data: pos },
  ] = await Promise.all([
    supabase.from('companies').select('*').eq('id', companyId).single(),
    supabase.from('employees').select('*').eq('company_id', companyId).order('created_at'),
    supabase.from('customers').select('*').eq('company_id', companyId).order('created_at'),
    supabase.from('deals').select('*').eq('company_id', companyId).order('created_at'),
    supabase.from('products').select('*').eq('company_id', companyId).order('created_at'),
    supabase.from('orders').select('*').eq('company_id', companyId).order('created_at'),
    supabase.from('order_items').select('*, orders!inner(company_id)').eq('orders.company_id', companyId),
    supabase.from('invoices').select('*').eq('company_id', companyId).order('created_at'),
    supabase.from('journals').select('*').eq('company_id', companyId).order('journal_date'),
    supabase.from('activities').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
    supabase.from('automation_logs').select('*').eq('company_id', companyId).order('timestamp', { ascending: false }).limit(50),
    supabase.from('notifications').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(20),
    supabase.from('purchase_orders').select('*').eq('company_id', companyId).order('created_at'),
  ]);

  // Map DB rows to frontend format
  const ordersWithItems = (ords || []).map(o => ({
    id: o.id,
    cid: o.customer_id,
    date: o.order_date,
    st: o.status,
    total: Number(o.total),
    items: (orderItems || []).filter(it => it.order_id === o.id).map(it => ({
      pid: it.product_id,
      qty: it.quantity,
      pr: it.unit_price,
    })),
  }));

  return {
    company: company ? { name: company.name, plan: company.plan || 'pro', created: company.created_at } : { name: '', plan: 'pro' },
    emps: (emps || []).map(e => ({
      id: e.id, name: e.name, dept: e.dept || '', role: e.job_title || '', sal: Number(e.salary),
      pl: e.paid_leave_total, ul: e.paid_leave_used, hired: e.hired_date || '', email: e.email || '', status: e.status,
    })),
    custs: (custs || []).map(c => ({
      id: c.id, name: c.name, ct: c.contact_person || '', em: c.email || '', phone: c.phone || '',
      ind: c.industry || '', rev: Number(c.revenue), score: c.ai_score, st: c.status, notes: c.notes || '',
    })),
    deals: (deals || []).map(d => ({
      id: d.id, cid: d.customer_id, title: d.title, val: Number(d.amount), stage: d.stage, prob: d.probability,
    })),
    prods: (prods || []).map(p => ({
      id: p.id, name: p.name, sku: p.sku || '', cat: p.category || '', price: Number(p.price),
      cost: Number(p.cost), stk: Number(p.stock), min: p.reorder_point, wh: p.warehouse || '東京',
    })),
    ords: ordersWithItems,
    invs: (invs || []).map(i => ({
      id: i.id, oid: i.order_id, cid: i.customer_id, date: i.invoice_date, due: i.due_date,
      amt: Number(i.amount), tax: Number(i.tax), total: Number(i.total), st: i.status, paid: Number(i.paid),
      desc: i.description || '',
    })),
    jrnl: (jrnl || []).map(j => ({
      id: j.id, date: j.journal_date, desc: j.description,
      dr: { acc: j.debit_account, amt: Number(j.debit_amount) },
      cr: { acc: j.credit_account, amt: Number(j.credit_amount) },
      auto: j.is_auto, ref: j.ref_id || j.ref_type || null,
    })),
    activities: (activities || []).map(a => ({
      id: a.id, cid: a.customer_id, date: a.activity_date, type: a.activity_type, user: a.user_name || '', note: a.note || '',
    })),
    alog: (alog || []).map(a => ({
      id: a.id, ts: new Date(a.timestamp).toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
      trig: a.trigger_name, act: a.action_name, det: a.detail || '',
    })),
    notifs: (notifs || []).map(n => ({
      id: n.id, msg: n.message, type: n.notification_type, read: n.is_read, date: n.created_at?.slice(0, 10) || '',
    })),
    _companyId: companyId,
  };
}

// =============================================
// SAVE helpers: Write to Supabase
// =============================================

export async function dbAddCustomer(companyId, c) {
  const { data, error } = await supabase.from('customers').insert({
    company_id: companyId, name: c.name, contact_person: c.ct, email: c.em, phone: c.phone, industry: c.ind,
    revenue: c.rev || 0, ai_score: c.score || 50, status: c.st || 'prospect',
  }).select().single();
  return { data, error };
}

export async function dbUpdateCustomer(id, updates) {
  const mapped = {};
  if (updates.name !== undefined) mapped.name = updates.name;
  if (updates.ct !== undefined) mapped.contact_person = updates.ct;
  if (updates.em !== undefined) mapped.email = updates.em;
  if (updates.phone !== undefined) mapped.phone = updates.phone;
  if (updates.ind !== undefined) mapped.industry = updates.ind;
  return supabase.from('customers').update(mapped).eq('id', id);
}

export async function dbDeleteCustomer(id) {
  return supabase.from('customers').delete().eq('id', id);
}

export async function dbAddDeal(companyId, d) {
  const { data, error } = await supabase.from('deals').insert({
    company_id: companyId, customer_id: d.cid, title: d.title, amount: d.val, stage: d.stage, probability: d.prob,
  }).select().single();
  return { data, error };
}

export async function dbDeleteDeal(id) {
  return supabase.from('deals').delete().eq('id', id);
}

export async function dbAddProduct(companyId, p) {
  const { data, error } = await supabase.from('products').insert({
    company_id: companyId, name: p.name, sku: p.sku, category: p.cat, price: p.price,
    cost: p.cost, stock: p.stk, reorder_point: p.min, warehouse: p.wh,
  }).select().single();
  return { data, error };
}

export async function dbUpdateProduct(id, updates) {
  const mapped = {};
  if (updates.stk !== undefined) mapped.stock = updates.stk;
  if (updates.price !== undefined) mapped.price = updates.price;
  return supabase.from('products').update(mapped).eq('id', id);
}

export async function dbDeleteProduct(id) {
  return supabase.from('products').delete().eq('id', id);
}

export async function dbAddEmployee(companyId, e) {
  const { data, error } = await supabase.from('employees').insert({
    company_id: companyId, name: e.name, dept: e.dept, salary: e.sal, email: e.email,
    paid_leave_total: e.pl || 20, paid_leave_used: e.ul || 0,
  }).select().single();
  return { data, error };
}

export async function dbDeleteEmployee(id) {
  return supabase.from('employees').delete().eq('id', id);
}

export async function dbAddOrder(companyId, o, items) {
  const { data: order, error } = await supabase.from('orders').insert({
    company_id: companyId, customer_id: o.cid, order_date: o.date, status: o.st, total: o.total,
  }).select().single();
  if (error || !order) return { data: null, error };
  if (items && items.length > 0) {
    await supabase.from('order_items').insert(items.map(it => ({
      order_id: order.id, product_id: it.pid, quantity: it.qty, unit_price: it.pr,
    })));
  }
  return { data: order, error: null };
}

export async function dbUpdateOrder(id, updates) {
  const mapped = {};
  if (updates.st !== undefined) mapped.status = updates.st;
  return supabase.from('orders').update(mapped).eq('id', id);
}

export async function dbDeleteOrder(id) {
  await supabase.from('order_items').delete().eq('order_id', id);
  return supabase.from('orders').delete().eq('id', id);
}

export async function dbAddInvoice(companyId, inv) {
  const { data, error } = await supabase.from('invoices').insert({
    company_id: companyId, order_id: inv.oid || null, customer_id: inv.cid, invoice_date: inv.date,
    due_date: inv.due, amount: inv.amt, tax: inv.tax || 0, total: inv.total, paid: inv.paid || 0,
    status: inv.st || 'sent', description: inv.desc || '',
  }).select().single();
  return { data, error };
}

export async function dbUpdateInvoice(id, updates) {
  const mapped = {};
  if (updates.paid !== undefined) mapped.paid = updates.paid;
  if (updates.st !== undefined) mapped.status = updates.st;
  return supabase.from('invoices').update(mapped).eq('id', id);
}

export async function dbDeleteInvoice(id) {
  return supabase.from('invoices').delete().eq('id', id);
}

export async function dbAddJournal(companyId, j) {
  const { data, error } = await supabase.from('journals').insert({
    company_id: companyId, journal_date: j.date, description: j.desc,
    debit_account: j.dr.acc, debit_amount: j.dr.amt,
    credit_account: j.cr.acc, credit_amount: j.cr.amt,
    is_auto: j.auto || false, ref_type: j.ref || null,
  }).select().single();
  return { data, error };
}

export async function dbDeleteJournal(id) {
  return supabase.from('journals').delete().eq('id', id);
}

export async function dbAddActivity(companyId, a) {
  return supabase.from('activities').insert({
    company_id: companyId, customer_id: a.cid, activity_date: a.date,
    activity_type: a.type, user_name: a.user, note: a.note,
  });
}

export async function dbAddAutomationLog(companyId, log) {
  return supabase.from('automation_logs').insert({
    company_id: companyId, trigger_name: log.trig, action_name: log.act, detail: log.det,
  });
}

export async function dbAddNotification(companyId, n) {
  return supabase.from('notifications').insert({
    company_id: companyId, message: n.msg, notification_type: n.type, is_read: n.read || false,
  });
}

export async function dbAddPurchaseOrder(companyId, po) {
  const { data, error } = await supabase.from('purchase_orders').insert({
    company_id: companyId, supplier: po.supplier, order_date: po.date,
    expected_date: po.eta, amount: po.amount, status: po.st || 'ordered',
  }).select().single();
  return { data, error };
}

export async function dbUpdatePurchaseOrder(id, updates) {
  const mapped = {};
  if (updates.st !== undefined) mapped.status = updates.st;
  return supabase.from('purchase_orders').update(mapped).eq('id', id);
}
