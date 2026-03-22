'use client';
import { useAppData } from '../../../components/AppShell';
import AIAdvisor from '../../../components/AIAdvisor';
export default function Page() { const { data } = useAppData(); return <AIAdvisor data={data} />; }
