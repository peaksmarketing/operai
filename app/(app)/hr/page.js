'use client';
import { HRView } from '../../../components/Modules';
import { useAppData } from '../../../components/DataContext';

export default function HRPage() {
  const { data, confirmPayroll } = useAppData();
  return <HRView data={data} role="company" confirmPayroll={confirmPayroll} />;
}
