import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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
  getExpiredItems: () => InventoryItem[];
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const STORAGE_KEY = 'inventory_data';

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [inventory, setInventory] = useState<Record<string, InventoryItem[]>>(() => {
    // Try to load from localStorage first
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load inventory from storage:', e);
    }
    // Fall back to mock data
    return { ...MOCK_INVENTORY };
  });

  // Persist to localStorage whenever inventory changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
    } catch (e) {
      console.error('Failed to save inventory to storage:', e);
    }
  }, [inventory]);

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

  const getExpiredItems = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expired: InventoryItem[] = [];
    Object.values(inventory).forEach(items => {
      items.forEach(item => {
        if (item.expiryDate) {
          const expiryDate = new Date(item.expiryDate);
          expiryDate.setHours(0, 0, 0, 0);
          if (expiryDate < today) {
            expired.push(item);
          }
        }
      });
    });
    return expired.sort((a, b) => {
      if (!a.expiryDate || !b.expiryDate) return 0;
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    });
  };

  return (
    <InventoryContext.Provider value={{ inventory, addItem, deleteItem, getExpiredItems }}>
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
