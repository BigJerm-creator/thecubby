import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface ShoppingListItem {
  id: string;
  name: string;
  category: string;
  checked: boolean;
  createdAt: string;
}

interface ShoppingListContextType {
  items: ShoppingListItem[];
  addItem: (item: Omit<ShoppingListItem, 'id' | 'createdAt'>) => void;
  removeItem: (itemId: string) => void;
  toggleItem: (itemId: string) => void;
  clearCompleted: () => void;
}

const ShoppingListContext = createContext<ShoppingListContextType | undefined>(undefined);

const STORAGE_KEY = 'shopping_list';

export function ShoppingListProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ShoppingListItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load shopping list from storage:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save shopping list to storage:', e);
    }
  }, [items]);

  const addItem = (item: Omit<ShoppingListItem, 'id' | 'createdAt'>) => {
    const newItem: ShoppingListItem = {
      ...item,
      id: `${Date.now()}-${Math.random()}`,
      createdAt: new Date().toISOString()
    };
    setItems(prev => [newItem, ...prev]);
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const toggleItem = (itemId: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const clearCompleted = () => {
    setItems(prev => prev.filter(item => !item.checked));
  };

  return (
    <ShoppingListContext.Provider value={{ items, addItem, removeItem, toggleItem, clearCompleted }}>
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
