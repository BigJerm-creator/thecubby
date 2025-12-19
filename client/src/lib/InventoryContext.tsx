import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MOCK_INVENTORY } from './mockData';

export interface InventoryItem {
  id: string;
  name: string;
  brand: string;
  quantity: number;
  unit: string;
  expiryDate?: string;
  category: string;
}

interface InventoryContextType {
  inventory: Record<string, InventoryItem[]>;
  addItem: (item: InventoryItem) => void;
  deleteItem: (categoryId: string, itemId: string) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [inventory, setInventory] = useState<Record<string, InventoryItem[]>>(() => {
    // Initialize with mock data
    return { ...MOCK_INVENTORY };
  });

  const addItem = (item: InventoryItem) => {
    setInventory(prev => ({
      ...prev,
      [item.category]: [
        ...(prev[item.category] || []),
        { ...item, id: `${Date.now()}-${Math.random()}` }
      ]
    }));
  };

  const deleteItem = (categoryId: string, itemId: string) => {
    setInventory(prev => ({
      ...prev,
      [categoryId]: (prev[categoryId] || []).filter(item => item.id !== itemId)
    }));
  };

  return (
    <InventoryContext.Provider value={{ inventory, addItem, deleteItem }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within InventoryProvider');
  }
  return context;
}
