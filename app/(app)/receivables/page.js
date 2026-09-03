'use client';
import { ARAPView } from '../../../components/ARAPModule';
import { useAppData } from '../../../components/DataContext';

export default function ReceivablesPage() {
  const { data, setData, registerPay, settlePos, addPayable, payPayable, deletePayable } = useAppData();
  return <ARAPView data={data} setData={setData} registerPay={registerPay} settlePos={settlePos} addPayable={addPayable} payPayable={payPayable} deletePayable={deletePayable} />;
}
