'use client';
import { DataProvider } from '../../components/DataContext';
import AppShell from '../../components/AppShell';

export default function AppLayout({ children }) {
  return (
    <DataProvider>
      <AppShell>{children}</AppShell>
    </DataProvider>
  );
}
