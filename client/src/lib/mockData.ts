export interface Category {
  id: string;
  name: string;
  image?: string;
}

export const KITCHEN_CATEGORIES: Category[] = [
  { id: 'spices', name: 'Spices', image: '🧂' },
  { id: 'refrigerated', name: 'Refrigerated', image: '🥛' },
  { id: 'frozen', name: 'Frozen Goods', image: '❄️' },
  { id: 'canned', name: 'Canned Goods', image: '🥫' },
  { id: 'boxed', name: 'Boxed Goods', image: '📦' },
  { id: 'bulk', name: 'Bulk Items', image: '⚖️' },
  { id: 'beverages', name: 'Beverages', image: '🥤' },
  { id: 'condiments', name: 'Condiments', image: '🍯' },
  { id: 'produce', name: 'Produce', image: '🥬' },
  { id: 'meat', name: 'Meat', image: '🥩' },
  { id: 'seafood', name: 'Seafood', image: '🦐' },
  { id: 'bakery', name: 'Bakery', image: '🍞' },
  { id: 'baby', name: 'Baby', image: '🍼' },
  { id: 'pet', name: 'Pet', image: '🐾' },
];
