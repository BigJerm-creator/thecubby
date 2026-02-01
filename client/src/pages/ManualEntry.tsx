import Layout from "@/components/layout";
import { ArrowLeft, Plus, Check, Info, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { KITCHEN_CATEGORIES } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { useInventory } from "@/lib/InventoryContext";
import { motion, AnimatePresence } from "framer-motion";

const UNIT_OPTIONS = [
  { value: "oz", label: "Ounces" },
  { value: "lbs", label: "Pounds" },
  { value: "grams", label: "Grams" },
  { value: "ml", label: "Milliliters" },
  { value: "liters", label: "Liters" },
  { value: "gal", label: "Gallon" },
  { value: "cups", label: "Cups" },
  { value: "tbsp", label: "Tablespoons" },
  { value: "tsp", label: "Teaspoons" },
  { value: "each", label: "Each" },
  { value: "dozen", label: "Dozen" },
  { value: "pack", label: "Pack" },
];

interface ProductInfo {
  imageUrl?: string;
  ingredients?: string;
  allergens?: string[];
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  servingSize?: string;
  nutriscore?: string;
  barcode?: string;
}

export default function ManualEntry() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { addItem } = useInventory();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [productInfo, setProductInfo] = useState<ProductInfo>({});
  
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "spices",
    amount: "",
    amountUnit: "oz",
    quantity: "1",
    expiryDate: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const name = params.get("name");
    const brand = params.get("brand");
    const category = params.get("category");
    const barcode = params.get("barcode");
    const imageUrl = params.get("imageUrl");
    const ingredients = params.get("ingredients");
    const allergens = params.get("allergens");
    const nutrition = params.get("nutrition");
    const servingSize = params.get("servingSize");
    const nutriscore = params.get("nutriscore");
    
    setFormData(prev => ({
      ...prev,
      name: name || (barcode ? `Product (${barcode})` : prev.name),
      brand: brand || prev.brand,
      category: category || prev.category,
    }));
    
    setProductInfo({
      imageUrl: imageUrl || undefined,
      ingredients: ingredients || undefined,
      allergens: allergens ? allergens.split(',') : undefined,
      nutrition: nutrition ? JSON.parse(nutrition) : undefined,
      servingSize: servingSize || undefined,
      nutriscore: nutriscore || undefined,
      barcode: barcode || undefined,
    });
  }, []);

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

    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter how many you have",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await addItem({
        name: formData.name,
        brand: formData.brand || null,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        amountUnit: formData.amount ? formData.amountUnit : null,
        quantity: parseInt(formData.quantity),
        expiryDate: formData.expiryDate || null,
        category: formData.category,
        barcode: productInfo.barcode || null,
        imageUrl: productInfo.imageUrl || null
      });

      toast({
        title: "Item Added!",
        description: `${formData.name} has been added to ${formData.category}`,
        action: <Check className="h-4 w-4 text-green-500" />
      });
      
      setLocation(`/category/${formData.category}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
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

        {(productInfo.imageUrl || productInfo.ingredients || productInfo.nutrition) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl overflow-hidden"
          >
            <div className="flex gap-4 p-4">
              {productInfo.imageUrl && (
                <img 
                  src={productInfo.imageUrl} 
                  alt="Product" 
                  className="w-20 h-20 object-contain rounded-lg bg-white"
                  data-testid="img-product"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate">{formData.name || 'Product'}</h3>
                {formData.brand && <p className="text-sm text-muted-foreground">{formData.brand}</p>}
                {productInfo.barcode && (
                  <p className="text-xs text-muted-foreground font-mono mt-1">{productInfo.barcode}</p>
                )}
                {productInfo.nutriscore && (
                  <span className={`inline-block mt-2 px-2 py-0.5 text-xs font-bold rounded uppercase ${
                    productInfo.nutriscore === 'a' ? 'bg-green-100 text-green-700' :
                    productInfo.nutriscore === 'b' ? 'bg-lime-100 text-lime-700' :
                    productInfo.nutriscore === 'c' ? 'bg-yellow-100 text-yellow-700' :
                    productInfo.nutriscore === 'd' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    Nutri-Score {productInfo.nutriscore.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            
            {(productInfo.ingredients || productInfo.nutrition || productInfo.allergens?.length) && (
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full px-4 py-2 flex items-center justify-between text-sm text-primary border-t border-border hover:bg-muted/50 transition-colors"
                data-testid="button-toggle-details"
              >
                <span className="flex items-center gap-2">
                  <Info size={16} />
                  Product Details
                </span>
                {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            )}
            
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 space-y-4">
                    {productInfo.allergens && productInfo.allergens.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-amber-700 font-medium text-sm mb-1">
                          <AlertTriangle size={14} />
                          Allergens
                        </div>
                        <p className="text-sm text-amber-600 capitalize">
                          {productInfo.allergens.join(', ')}
                        </p>
                      </div>
                    )}
                    
                    {productInfo.nutrition && (
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">
                          Nutrition {productInfo.servingSize && `(${productInfo.servingSize})`}
                        </h4>
                        <div className="grid grid-cols-4 gap-2 text-center">
                          {productInfo.nutrition.calories !== undefined && (
                            <div className="bg-muted rounded-lg p-2">
                              <div className="text-lg font-bold text-foreground">{Math.round(productInfo.nutrition.calories)}</div>
                              <div className="text-xs text-muted-foreground">cal</div>
                            </div>
                          )}
                          {productInfo.nutrition.protein !== undefined && (
                            <div className="bg-muted rounded-lg p-2">
                              <div className="text-lg font-bold text-foreground">{Math.round(productInfo.nutrition.protein)}g</div>
                              <div className="text-xs text-muted-foreground">protein</div>
                            </div>
                          )}
                          {productInfo.nutrition.carbs !== undefined && (
                            <div className="bg-muted rounded-lg p-2">
                              <div className="text-lg font-bold text-foreground">{Math.round(productInfo.nutrition.carbs)}g</div>
                              <div className="text-xs text-muted-foreground">carbs</div>
                            </div>
                          )}
                          {productInfo.nutrition.fat !== undefined && (
                            <div className="bg-muted rounded-lg p-2">
                              <div className="text-lg font-bold text-foreground">{Math.round(productInfo.nutrition.fat)}g</div>
                              <div className="text-xs text-muted-foreground">fat</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {productInfo.ingredients && (
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-1">Ingredients</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {productInfo.ingredients}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
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

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Category * <span className="text-xs text-muted-foreground font-normal">(tap to change)</span>
            </label>
            <div className="grid grid-cols-4 gap-2" data-testid="category-grid">
              {KITCHEN_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${
                    formData.category === cat.id
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                  data-testid={`category-${cat.id}`}
                >
                  <span className="text-xl mb-1">{cat.image}</span>
                  <span className={`text-xs text-center leading-tight ${
                    formData.category === cat.id ? 'text-primary font-medium' : 'text-muted-foreground'
                  }`}>
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              How many do you have? *
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              placeholder="1"
              step="1"
              min="1"
              className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="input-quantity"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Size/Volume
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="e.g., 24"
                step="0.1"
                min="0"
                className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                data-testid="input-amount"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Unit
              </label>
              <select
                name="amountUnit"
                value={formData.amountUnit}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                data-testid="select-amount-unit"
              >
                {UNIT_OPTIONS.map(unit => (
                  <option key={unit.value} value={unit.value}>{unit.label}</option>
                ))}
              </select>
            </div>
          </div>

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
