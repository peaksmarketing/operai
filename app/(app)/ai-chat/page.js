'use client';
import { useAppData } from '../../../components/AppShell';
import { AIChatPage } from '../../../components/AIPages';
export default function Page() { const { data } = useAppData(); return <AIChatPage data={data} />; }
