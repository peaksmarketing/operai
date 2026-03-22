'use client';
import { useAppData } from '../../../components/AppShell';
import { AINotifyPage } from '../../../components/AIPages';
export default function Page() { const { data } = useAppData(); return <AINotifyPage data={data} />; }
