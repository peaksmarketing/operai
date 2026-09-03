'use client';
import { POSView } from '../../../components/POSModule';
import { useAppData } from '../../../components/DataContext';

export default function POSPage() {
  const { data, setData, posCheckout, posRefund } = useAppData();
  return <POSView data={data} setData={setData} posCheckout={posCheckout} posRefund={posRefund} />;
}
