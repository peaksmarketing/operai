'use client';
import { AutoLogView } from '../../../components/Modules';
import { useAppData } from '../../../components/DataContext';

export default function AutomationPage() {
  const { data } = useAppData();
  return <AutoLogView data={data} />;
}
