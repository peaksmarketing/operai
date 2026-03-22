'use client';
import { BillView } from '../../../components/Modules';
import { useAppData } from '../../../components/DataContext';

export default function BillingPage() {
  const { data, setData, registerPay } = useAppData();
  return <BillView data={data} setData={setData} registerPay={registerPay} />;
}
