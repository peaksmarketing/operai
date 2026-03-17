'use client';
import { InvView } from '../../../components/Modules';
import { useAppData } from '../../../components/DataContext';

export default function InventoryPage() {
  const { data, setData, confirmOrder } = useAppData();
  return <InvView data={data} setData={setData} confirmOrder={confirmOrder} />;
}
