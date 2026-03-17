'use client';
import { BillView } from '../../../components/Modules';
import { useAppData } from '../../../components/DataContext';

export default function BillingPage() {
  const { data, registerPay } = useAppData();
  return <BillView data={data} registerPay={registerPay} />;
}
