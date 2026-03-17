'use client';
import { AcctView } from '../../../components/Modules';
import { useAppData } from '../../../components/DataContext';

export default function AccountingPage() {
  const { data } = useAppData();
  return <AcctView data={data} />;
}
