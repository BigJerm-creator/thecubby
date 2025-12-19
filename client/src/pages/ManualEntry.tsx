import Layout from "@/components/layout";
import { ArrowLeft, Plus, Check } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { KITCHEN_CATEGORIES } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { useInventory } from "@/lib/InventoryContext";
import { motion } from "framer-motion";

const UNIT_OPTIONS = [
  { value: "oz", label: "Ounces" },
  { value: "lbs", label: "Pounds" },
  { value: "grams", label: "Grams" },
  { value: "ml", label: "Milliliters" },
  { value: "liters", label: "Liters" },
  { value: "cups", label: "Cups" },
  { value: "tbsp", label: "Tablespoons" },
  { value: "tsp", label: "Teaspoons" },
  { value: "each", label: "Each" },
  { value: "dozen", label: "Dozen" },
  { value: "pack", label: "Pack" },
];

export default function ManualEntry() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { addItem } = useInventory();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "spices",
    quantity: "",
    unit: "oz",
    expiryDate: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a product name",
        variant: "destructive"
      });
      return;
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate submission delay
    setTimeout(() => {
      // Add item to inventory
      addItem({
        id: `${Date.now()}`,
        name: formData.name,
        brand: formData.brand,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        expiryDate: formData.expiryDate || undefined,
        category: formData.category
      });

      toast({
        title: "Item Added!",
        description: `${formData.name} has been added to ${formData.category}`,
        action: <Check className="h-4 w-4 text-green-500" />
      });
      
      // Redirect to the category page
      setLocation(`/category/${formData.category}`);
    }, 800);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pt-4 pb-2">
          <button 
            onClick={() => setLocation("/scan")}
            className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
            data-testid="button-back-to-scan"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-serif text-foreground">Add Item</h1>
            <p className="text-muted-foreground text-sm">Enter product details manually</p>
          </div>
        </div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Product Name */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Olive Oil, Greek Yogurt"
              className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="input-product-name"
            />
          </div>

          {/* Brand */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Brand
            </label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleInputChange}
              placeholder="e.g., Kirkland, Chobani"
              className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="input-brand"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              data-testid="select-category"
            >
              {KITCHEN_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Quantity *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                placeholder="0"
                step="0.1"
                min="0"
                className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                data-testid="input-quantity"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Unit *
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                data-testid="select-unit"
              >
                {UNIT_OPTIONS.map(unit => (
                  <option key={unit.value} value={unit.value}>{unit.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Expiry Date */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Expiry Date (Optional)
            </label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="input-expiry-date"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              data-testid="button-add-item"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus size={20} />
                  Add to Inventory
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setLocation("/scan")}
            className="w-full py-3 text-muted-foreground hover:text-foreground rounded-lg font-medium transition-colors"
            data-testid="button-cancel"
          >
            Cancel
          </button>
        </motion.form>
      </div>
    </Layout>
  );
}
