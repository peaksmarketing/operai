'use client';
import Dashboard from '../../../components/Dashboard';
import { useAppData } from '../../../components/DataContext';

export default function DashboardPage() {
  const { data } = useAppData();
  return <Dashboard data={data} role="company" />;
}
