'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { DATA } from './data';
import { useAuto } from './useAuto';
import { loadAllData, dbAddCustomer, dbUpdateCustomer, dbDeleteCustomer, dbAddDeal, dbDeleteDeal, dbAddProduct, dbUpdateProduct, dbDeleteProduct, dbAddEmployee, dbDeleteEmployee, dbAddOrder, dbUpdateOrder, dbDeleteOrder, dbAddInvoice, dbUpdateInvoice, dbDeleteInvoice, dbAddJournal, dbDeleteJournal, dbAddActivity, dbAddAutomationLog, dbAddNotification, dbAddPurchaseOrder, dbUpdatePurchaseOrder } from '../lib/supabase-data';
import { ensureUserSetup } from '../lib/supabase-setup';

const DataContext = createContext(null);

// Diff two arrays by id, return { added, removed, updated }
function diffArrays(prev, next, idKey = 'id') {
  const prevMap = new Map(prev.map(r => [r[idKey], r]));
  const nextMap = new Map(next.map(r => [r[idKey], r]));
  const added = next.filter(r => !prevMap.has(r[idKey]));
  const removed = prev.filter(r => !nextMap.has(r[idKey]));
  const updated = next.filter(r => {
    const old = prevMap.get(r[idKey]);
    return old && JSON.stringify(old) !== JSON.stringify(r);
  });
  return { added, removed, updated };
}

export function DataProvider({ children }) {
  const [data, setDataRaw] = useState(DATA);
  const [dbMode, setDbMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const prevDataRef = useRef(data);
  const companyIdRef = useRef(null);

  const dbModeRef = useRef(false);

  // Clear sync error after 5 seconds
  useEffect(() => {
    if (syncError) {
      const t = setTimeout(() => setSyncError(null), 8000);
      return () => clearTimeout(t);
    }
  }, [syncError]);

  // Wrapped setData that syncs to DB in background
  const setData = useCallback((updater) => {
    setDataRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      // Schedule DB sync in background (non-blocking)
      if (companyIdRef.current) {
        setSyncing(true);
        syncToDB(prev, next, companyIdRef.current)
          .then(() => setSyncing(false))
          .catch(e => {
            setSyncing(false);
            setSyncError(e.message || 'データの保存に失敗しました');
            console.error('DB sync failed:', e);
          });
      }
      prevDataRef.current = next;
      return next;
    });
  }, []);

  const auto = useAuto(data, setData);

  // On mount: ensure user is set up in DB, then load data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const companyId = await ensureUserSetup();
        if (cancelled) return;
        companyIdRef.current = companyId;

        if (companyId) {
          const dbData = await loadAllData();
          if (cancelled) return;
          if (dbData && dbData.custs && dbData.custs.length > 0) {
            dbData._companyId = companyId;
            setDataRaw(dbData);
            prevDataRef.current = dbData;
            setDbMode(true);
            dbModeRef.current = true;
          }
        }
      } catch (e) {
        console.log('DB load skipped (using demo data):', e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <DataContext.Provider value={{ data, setData, dbMode, loading, syncing, syncError, setSyncError, ...auto }}>
      {syncError && (
        <div style={{
          position: 'fixed', top: 16, right: 16, zIndex: 99999,
          padding: '12px 20px', borderRadius: 10,
          background: '#A32D2D', color: '#fff', fontSize: 13,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: 10, maxWidth: 400,
        }}>
          <span style={{ fontWeight: 600 }}>保存エラー:</span>
          <span>{syncError}</span>
          <button onClick={() => setSyncError(null)} style={{
            background: 'none', border: 'none', color: '#fff', cursor: 'pointer',
            fontSize: 16, padding: '0 4px', opacity: 0.7,
          }}>&times;</button>
        </div>
      )}
      {children}
    </DataContext.Provider>
  );
}

// Background DB sync — compares prev and next state, writes diffs
async function syncToDB(prev, next, companyId) {
  if (!companyId) return;
  try {
    // Customers
    const custDiff = diffArrays(prev.custs || [], next.custs || []);
    for (const c of custDiff.added) await dbAddCustomer(companyId, c);
    for (const c of custDiff.removed) await dbDeleteCustomer(c.id);
    for (const c of custDiff.updated) await dbUpdateCustomer(c.id, c);

    // Deals
    const dealDiff = diffArrays(prev.deals || [], next.deals || []);
    for (const d of dealDiff.added) await dbAddDeal(companyId, d);
    for (const d of dealDiff.removed) await dbDeleteDeal(d.id);

    // Products
    const prodDiff = diffArrays(prev.prods || [], next.prods || []);
    for (const p of prodDiff.added) await dbAddProduct(companyId, p);
    for (const p of prodDiff.removed) await dbDeleteProduct(p.id);
    for (const p of prodDiff.updated) await dbUpdateProduct(p.id, p);

    // Employees
    const empDiff = diffArrays(prev.emps || [], next.emps || []);
    for (const e of empDiff.added) await dbAddEmployee(companyId, e);
    for (const e of empDiff.removed) await dbDeleteEmployee(e.id);

    // Orders
    const ordDiff = diffArrays(prev.ords || [], next.ords || []);
    for (const o of ordDiff.added) await dbAddOrder(companyId, o, o.items);
    for (const o of ordDiff.removed) await dbDeleteOrder(o.id);
    for (const o of ordDiff.updated) await dbUpdateOrder(o.id, o);

    // Invoices
    const invDiff = diffArrays(prev.invs || [], next.invs || []);
    for (const i of invDiff.added) await dbAddInvoice(companyId, i);
    for (const i of invDiff.removed) await dbDeleteInvoice(i.id);
    for (const i of invDiff.updated) await dbUpdateInvoice(i.id, i);

    // Journals
    const jrnlDiff = diffArrays(prev.jrnl || [], next.jrnl || []);
    for (const j of jrnlDiff.added) await dbAddJournal(companyId, j);
    for (const j of jrnlDiff.removed) await dbDeleteJournal(j.id);

    // Activities
    const actDiff = diffArrays(prev.activities || [], next.activities || []);
    for (const a of actDiff.added) await dbAddActivity(companyId, a);

    // Automation logs
    const alogDiff = diffArrays(prev.alog || [], next.alog || []);
    for (const a of alogDiff.added) await dbAddAutomationLog(companyId, a);

    // Notifications
    const notifDiff = diffArrays(prev.notifs || [], next.notifs || []);
    for (const n of notifDiff.added) await dbAddNotification(companyId, n);

  } catch (e) {
    console.error('DB sync error:', e.message);
    throw e; // Re-throw so the caller can handle it
  }
}

export function useAppData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useAppData must be used within DataProvider');
  return ctx;
}
