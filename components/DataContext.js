'use client';
import { createContext, useContext, useState } from 'react';
import { DATA } from './data';
import { useAuto } from './useAuto';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [data, setData] = useState(DATA);
  const auto = useAuto(data, setData);
  return (
    <DataContext.Provider value={{ data, setData, ...auto }}>
      {children}
    </DataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useAppData must be used within DataProvider');
  return ctx;
}
