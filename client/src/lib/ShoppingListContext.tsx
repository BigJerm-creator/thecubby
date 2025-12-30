import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './queryClient';

export interface ShoppingListItem {
  id: number;
  name: string;
  category: string;
  checked: boolean;
  createdAt: string;
}

interface ShoppingListContextType {
  items: ShoppingListItem[];
  addItem: (item: Omit<ShoppingListItem, 'id' | 'createdAt'>) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  toggleItem: (itemId: number, checked: boolean) => Promise<void>;
  clearCompleted: () => Promise<void>;
  isLoading: boolean;
}

const ShoppingListContext = createContext<ShoppingListContextType | undefined>(undefined);

export function ShoppingListProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery<ShoppingListItem[]>({
    queryKey: ['/api/shopping-list'],
  });

  const addMutation = useMutation({
    mutationFn: async (item: Omit<ShoppingListItem, 'id' | 'createdAt'>) => {
      await apiRequest('POST', '/api/shopping-list', item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shopping-list'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: number) => {
      await apiRequest('DELETE', `/api/shopping-list/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shopping-list'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ itemId, checked }: { itemId: number; checked: boolean }) => {
      await apiRequest('PATCH', `/api/shopping-list/${itemId}`, { checked });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shopping-list'] });
    },
  });

  const addItem = async (item: Omit<ShoppingListItem, 'id' | 'createdAt'>) => {
    await addMutation.mutateAsync(item);
  };

  const removeItem = async (itemId: number) => {
    await deleteMutation.mutateAsync(itemId);
  };

  const toggleItem = async (itemId: number, checked: boolean) => {
    await toggleMutation.mutateAsync({ itemId, checked });
  };

  const clearCompleted = async () => {
    const completedItems = items.filter(item => item.checked);
    await Promise.all(completedItems.map(item => deleteMutation.mutateAsync(item.id)));
  };

  return (
    <ShoppingListContext.Provider value={{ items, addItem, removeItem, toggleItem, clearCompleted, isLoading }}>
      {children}
    </ShoppingListContext.Provider>
  );
}

export function useShoppingList() {
  const context = useContext(ShoppingListContext);
  if (!context) {
    throw new Error('useShoppingList must be used within ShoppingListProvider');
  }
  return context;
}
