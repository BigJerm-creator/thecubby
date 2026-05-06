import Layout from "@/components/layout";
import { Link, useRoute, useLocation } from "wouter";
import { KITCHEN_CATEGORIES } from "@/lib/mockData";
import { Loader2, Minus, Plus, Pencil, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useInventory, InventoryItem } from "@/lib/InventoryContext";
import { useShoppingList } from "@/lib/ShoppingListContext";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

const lockBodyScroll = (lock: boolean) => {
  if (typeof document === 'undefined') return;
  document.body.style.overflow = lock ? 'hidden' : '';
};

const UNIT_OPTIONS = [
  "oz", "lbs", "grams", "ml", "liters", "gal", "cups", "tbsp", "tsp", "each", "dozen", "pack"
];

export default function CategoryView() {
  const [match, params] = useRoute("/category/:id");
  const [, setLocation] = useLocation();
  const categoryId = params?.id || "";
  const category = KITCHEN_CATEGORIES.find(c => c.id === categoryId);
  const { inventory, deleteItem, updateItem, isLoading } = useInventory();
  const { addItem: addToShoppingList } = useShoppingList();
  const { toast } = useToast();
  const items = inventory[categoryId] || [];
  const [removingItem, setRemovingItem] = useState<InventoryItem | null>(null);
  const [removeCount, setRemoveCount] = useState(1);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    brand: "",
    quantity: "1",
    amount: "",
    amountUnit: "oz",
    expiryDate: "",
    lowStockThreshold: "",
    category: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    const open = !!(editingItem || removingItem);
    lockBodyScroll(open);
    return () => lockBodyScroll(false);
  }, [editingItem, removingItem]);

  useEffect(() => {
    if (editingItem) {
      setEditForm({
        name: editingItem.name,
        brand: editingItem.brand || "",
        quantity: String(editingItem.quantity),
        amount: editingItem.amount != null ? String(editingItem.amount) : "",
        amountUnit: editingItem.amountUnit || "oz",
        expiryDate: editingItem.expiryDate || "",
        lowStockThreshold: editingItem.lowStockThreshold != null ? String(editingItem.lowStockThreshold) : "",
        category: editingItem.category,
      });
    }
  }, [editingItem]);

  const isAmountCategory = categoryId === 'spices' || categoryId === 'condiments';

  const useAmountMode = (item: InventoryItem) => {
    return isAmountCategory && item.amount != null && item.amount > 0;
  };

  const isLowStock = (item: InventoryItem) =>
    item.lowStockThreshold != null && item.quantity <= item.lowStockThreshold;

  const handleDeleteItem = async (item: InventoryItem) => {
    if (useAmountMode(item)) {
      setRemovingItem(item);
      setRemoveCount(0.5);
    } else if (item.quantity <= 1) {
      await deleteItem(categoryId, item.id);
      toast({ title: "Item Removed", description: `${item.name} has been removed from inventory` });
    } else {
      setRemovingItem(item);
      setRemoveCount(1);
    }
  };

  const confirmRemove = async () => {
    if (!removingItem) return;
    if (useAmountMode(removingItem)) {
      const currentAmount = removingItem.amount!;
      if (removeCount >= currentAmount) {
        await deleteItem(categoryId, removingItem.id);
        toast({ title: "Item Removed", description: `${removingItem.name} has been removed from inventory` });
      } else {
        const newAmount = Math.round((currentAmount - removeCount) * 100) / 100;
        await updateItem(removingItem.id, { amount: newAmount });
        toast({
          title: "Amount Updated",
          description: `Removed ${removeCount} ${removingItem.amountUnit || 'oz'} of ${removingItem.name} (${newAmount} ${removingItem.amountUnit || 'oz'} remaining)`
        });
      }
    } else {
      if (removeCount >= removingItem.quantity) {
        await deleteItem(categoryId, removingItem.id);
        toast({ title: "Item Removed", description: `${removingItem.name} has been removed from inventory` });
      } else {
        await updateItem(removingItem.id, { quantity: removingItem.quantity - removeCount });
        toast({
          title: "Quantity Updated",
          description: `Removed ${removeCount} of ${removingItem.name} (${removingItem.quantity - removeCount} remaining)`
        });
      }
    }
    setRemovingItem(null);
  };

  const handleAddToShoppingList = async (itemName: string) => {
    await addToShoppingList({ name: itemName, category: categoryId, checked: false });
    toast({ title: "Added to Shopping List", description: `${itemName} added to your shopping list` });
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    if (!editForm.name.trim()) {
      toast({ title: "Missing Name", description: "Item name is required", variant: "destructive" });
      return;
    }
    const qty = parseInt(editForm.quantity);
    if (Number.isNaN(qty) || qty < 0) {
      toast({ title: "Invalid Quantity", description: "Quantity must be 0 or greater", variant: "destructive" });
      return;
    }
    setSavingEdit(true);
    try {
      const amountVal = editForm.amount ? parseFloat(editForm.amount) : null;
      const lowVal = editForm.lowStockThreshold ? parseInt(editForm.lowStockThreshold) : null;
      await updateItem(editingItem.id, {
        name: editForm.name.trim(),
        brand: editForm.brand.trim() || null,
        quantity: qty,
        amount: amountVal,
        amountUnit: amountVal != null ? editForm.amountUnit : null,
        expiryDate: editForm.expiryDate || null,
        lowStockThreshold: lowVal,
        category: editForm.category,
      });
      toast({ title: "Item Updated", description: `${editForm.name} has been updated` });
      setEditingItem(null);
    } catch (err) {
      toast({ title: "Error", description: "Failed to update item", variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  };

  if (!category) return <Layout><div>Category not found</div></Layout>;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between pt-4 pb-2">
          <Link href="/kitchen">
            <button className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground text-xl">
              ←
            </button>
          </Link>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground text-lg">🔽</button>
            <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground text-lg">⋯</button>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-serif text-foreground">{category.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">{items.length} items in inventory</p>
        </div>

        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
              <p className="text-muted-foreground">No items in this category yet.</p>
              <button
                onClick={() => setLocation("/scan")}
                className="mt-4 text-primary font-medium text-sm hover:underline"
              >
                Add your first item
              </button>
            </div>
          ) : (
            items.map((item, index) => {
              const low = isLowStock(item);
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={item.id}
                  className={`bg-card border p-4 rounded-xl shadow-sm flex justify-between items-center group ${low ? 'border-amber-400 ring-1 ring-amber-200' : 'border-border/50'}`}
                  data-testid={`item-row-${item.id}`}
                >
                  <button
                    onClick={() => setEditingItem(item)}
                    className="flex items-center gap-3 flex-1 text-left min-w-0"
                    data-testid={`button-edit-item-${item.id}`}
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-contain rounded-lg bg-white flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-2xl">📦</div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-medium text-foreground truncate">{item.name}</h3>
                      {item.brand && <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.brand}</p>}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.expiryDate && (
                          <div className="flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            <span>📅</span>
                            <span>Exp: {item.expiryDate}</span>
                          </div>
                        )}
                        {low && (
                          <div className="flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full" data-testid={`badge-low-stock-${item.id}`}>
                            <span>⚠️</span>
                            <span>Low stock</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-serif font-medium text-primary">{item.quantity}x</span>
                      {item.amount && item.amountUnit && (
                        <span className="text-xs text-muted-foreground">{item.amount} {item.amountUnit}</span>
                      )}
                    </div>

                    <button
                      onClick={() => setEditingItem(item)}
                      className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors"
                      data-testid={`button-pencil-edit-${item.id}`}
                      title="Edit item"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      onClick={() => handleAddToShoppingList(item.name)}
                      className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-600 transition-colors text-sm"
                      data-testid={`button-add-to-shopping-list-${item.id}`}
                      title="Add to shopping list"
                    >🛒</button>

                    <button
                      onClick={() => handleDeleteItem(item)}
                      className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive transition-colors text-sm"
                      data-testid={`button-delete-item-${item.id}`}
                      title="Remove from inventory"
                    >🗑️</button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Edit Dialog — absolute so it stays inside the phone frame on desktop preview */}
      <AnimatePresence>
        {editingItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 z-50 flex items-end justify-center"
            onClick={() => setEditingItem(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-card rounded-t-3xl w-full max-h-[85%] overflow-hidden flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-3 border-b border-border flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setEditingItem(null)}
                  className="h-9 w-9 -ml-1 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-close-edit"
                  aria-label="Back"
                >
                  <ArrowLeft size={18} />
                </button>
                <h3 className="font-serif text-base font-medium text-foreground flex-1 truncate">Edit Item</h3>
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="px-3 py-1.5 rounded-lg text-sm font-bold text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                  data-testid="button-save-edit-top"
                >
                  {savingEdit ? "Saving..." : "Save"}
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-4 flex-1 min-h-0">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Name *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="input-edit-name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Brand</label>
                  <input
                    type="text"
                    value={editForm.brand}
                    onChange={(e) => setEditForm(prev => ({ ...prev, brand: e.target.value }))}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="input-edit-brand"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">Quantity *</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.quantity}
                      onChange={(e) => setEditForm(prev => ({ ...prev, quantity: e.target.value }))}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      data-testid="input-edit-quantity"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2 flex items-center gap-1">
                      Low stock at
                      <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g., 2"
                      value={editForm.lowStockThreshold}
                      onChange={(e) => setEditForm(prev => ({ ...prev, lowStockThreshold: e.target.value }))}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      data-testid="input-edit-low-stock"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground -mt-2">
                  Get an alert when quantity drops to this number or below.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">Size/Volume</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={editForm.amount}
                      onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      data-testid="input-edit-amount"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">Unit</label>
                    <select
                      value={editForm.amountUnit}
                      onChange={(e) => setEditForm(prev => ({ ...prev, amountUnit: e.target.value }))}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                      data-testid="select-edit-amount-unit"
                    >
                      {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Expiry Date</label>
                  <input
                    type="date"
                    value={editForm.expiryDate}
                    onChange={(e) => setEditForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="input-edit-expiry"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Category</label>
                  <div className="grid grid-cols-4 gap-2">
                    {KITCHEN_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setEditForm(prev => ({ ...prev, category: cat.id }))}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${
                          editForm.category === cat.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-card hover:border-primary/50'
                        }`}
                        data-testid={`edit-category-${cat.id}`}
                      >
                        <span className="text-xl mb-1">{cat.image}</span>
                        <span className={`text-[10px] text-center leading-tight ${
                          editForm.category === cat.id ? 'text-primary font-medium' : 'text-muted-foreground'
                        }`}>{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-border flex gap-3 flex-shrink-0">
                <button
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors"
                  data-testid="button-cancel-edit"
                >Cancel</button>
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  data-testid="button-save-edit"
                >{savingEdit ? "Saving..." : "Save Changes"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {removingItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setRemovingItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-card rounded-2xl w-full max-w-sm shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const amountMode = useAmountMode(removingItem);
                const total = amountMode ? removingItem.amount! : removingItem.quantity;
                const unit = amountMode ? (removingItem.amountUnit || 'oz') : '';
                const step = amountMode ? 0.5 : 1;
                return (
                  <div className="p-5 space-y-4">
                    <div className="text-center">
                      <h3 className="font-serif text-xl font-medium text-foreground">Remove {removingItem.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {amountMode
                          ? `You have ${total} ${unit} on hand. How much do you want to remove?`
                          : `You have ${total} in inventory. How many do you want to remove?`}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => setRemoveCount(Math.max(step, Math.round((removeCount - step) * 100) / 100))}
                        className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                        data-testid="button-remove-decrease"
                        disabled={removeCount <= step}
                      ><Minus size={18} /></button>
                      <div className="text-center">
                        <span className="text-3xl font-serif font-medium text-primary" data-testid="text-remove-count">{removeCount}</span>
                        {unit && <span className="text-sm text-muted-foreground ml-1">{unit}</span>}
                      </div>
                      <button
                        onClick={() => setRemoveCount(Math.min(total, Math.round((removeCount + step) * 100) / 100))}
                        className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                        data-testid="button-remove-increase"
                        disabled={removeCount >= total}
                      ><Plus size={18} /></button>
                    </div>

                    {removeCount >= total && (
                      <p className="text-center text-xs text-destructive font-medium">
                        This will completely remove the item from inventory
                      </p>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => setRemovingItem(null)}
                        className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors"
                        data-testid="button-cancel-remove"
                      >Cancel</button>
                      <button
                        onClick={confirmRemove}
                        className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors"
                        data-testid="button-confirm-remove"
                      >Remove {removeCount}{unit ? ` ${unit}` : ''}</button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
