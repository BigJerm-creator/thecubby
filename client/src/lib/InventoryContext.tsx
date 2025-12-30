import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './queryClient';

export interface InventoryItem {
  id: number;
  name: string;
  brand: string | null;
  quantity: number;
  unit: string;
  expiryDate?: string | null;
  category: string;
  barcode?: string | null;
  createdAt: string;
}

interface InventoryContextType {
  inventory: Record<string, InventoryItem[]>;
  addItem: (item: Omit<InventoryItem, 'id' | 'createdAt'>) => Promise<void>;
  deleteItem: (categoryId: string, itemId: number) => Promise<void>;
  getExpiredItems: () => InventoryItem[];
  isLoading: boolean;
  expiredItems: InventoryItem[];
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: allItems = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ['/api/inventory'],
  });

  const { data: expiredItems = [] } = useQuery<InventoryItem[]>({
    queryKey: ['/api/inventory/expired'],
  });

  const inventory = allItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  const addMutation = useMutation({
    mutationFn: async (item: Omit<InventoryItem, 'id' | 'createdAt'>) => {
      await apiRequest('POST', '/api/inventory', item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/expired'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: number) => {
      await apiRequest('DELETE', `/api/inventory/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/expired'] });
    },
  });

  const addItem = async (item: Omit<InventoryItem, 'id' | 'createdAt'>) => {
    await addMutation.mutateAsync(item);
  };

  const deleteItem = async (_categoryId: string, itemId: number) => {
    await deleteMutation.mutateAsync(itemId);
  };

  const getExpiredItems = () => expiredItems;

  return (
    <InventoryContext.Provider value={{ inventory, addItem, deleteItem, getExpiredItems, isLoading, expiredItems }}>
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
