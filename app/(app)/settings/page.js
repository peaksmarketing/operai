'use client';
import { SettView } from '../../../components/Modules';
import { useAppData } from '../../../components/DataContext';

export default function SettingsPage() {
  const { data } = useAppData();
  return <SettView data={data} />;
}
