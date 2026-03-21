'use client';
import { HRView } from '../../../components/Modules';
import { useAppData } from '../../../components/DataContext';

export default function HRPage() {
  const { data, setData, confirmPayroll } = useAppData();
  return <HRView data={data} setData={setData} role="company" confirmPayroll={confirmPayroll} />;
}
