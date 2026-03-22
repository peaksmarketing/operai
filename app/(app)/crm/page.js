'use client';
import CRMModule from '../../../components/CRMModule';
import { useAppData } from '../../../components/DataContext';

export default function CRMPage() {
  const { data, setData } = useAppData();
  return <CRMModule data={data} setData={setData} />;
}
