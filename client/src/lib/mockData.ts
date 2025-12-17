export interface Category {
  id: string;
  name: string;
  image?: string;
  count: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  brand: string;
  quantity: number;
  unit: string;
  expiryDate?: string;
  category: string;
}

export const KITCHEN_CATEGORIES: Category[] = [
  { id: 'spices', name: 'Spices', count: 24, image: '🧂' },
  { id: 'refrigerated', name: 'Refrigerated', count: 12, image: '🥛' },
  { id: 'frozen', name: 'Frozen Goods', count: 8, image: '❄️' },
  { id: 'canned', name: 'Canned Goods', count: 18, image: '🥫' },
  { id: 'boxed', name: 'Boxed Goods', count: 9, image: '📦' },
  { id: 'bulk', name: 'Bulk Items', count: 5, image: '⚖️' },
];

export const MOCK_INVENTORY: Record<string, InventoryItem[]> = {
  'spices': [
    { id: '1', name: 'Cumin', brand: 'McCormick', quantity: 2, unit: 'oz', expiryDate: '2025-12-01', category: 'spices' },
    { id: '2', name: 'Paprika', brand: 'Spice Islands', quantity: 1.5, unit: 'oz', expiryDate: '2024-08-15', category: 'spices' },
    { id: '3', name: 'Black Peppercorns', brand: 'Kirkland', quantity: 8, unit: 'oz', category: 'spices' },
  ],
  'refrigerated': [
    { id: '4', name: 'Almond Milk', brand: 'Silk', quantity: 0.5, unit: 'gal', expiryDate: '2023-11-20', category: 'refrigerated' },
    { id: '5', name: 'Greek Yogurt', brand: 'Chobani', quantity: 2, unit: 'cups', expiryDate: '2023-11-25', category: 'refrigerated' },
  ],
  'bulk': [
    { id: '6', name: 'Basmati Rice', brand: 'Royal', quantity: 4.2, unit: 'lbs', category: 'bulk' },
    { id: '7', name: 'Red Lentils', brand: 'Whole Foods', quantity: 16, unit: 'oz', category: 'bulk' },
  ]
};
