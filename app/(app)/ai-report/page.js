'use client';
import { useAppData } from '../../../components/AppShell';
import { AIReportPage } from '../../../components/AIPages';
export default function Page() { const { data } = useAppData(); return <AIReportPage data={data} />; }
