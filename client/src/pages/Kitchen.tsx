import Layout from "@/components/layout";
import { KITCHEN_CATEGORIES } from "@/lib/mockData";
import { Link, useLocation } from "wouter";
import { ArrowRight, ScanLine, PenLine, Package } from "lucide-react";
import { motion } from "framer-motion";
import { useInventory } from "@/lib/InventoryContext";
import { useTheme } from "@/lib/ThemeContext";
import { getIconStyleConfig } from "@/components/StyledIcon";
import { cn } from "@/lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Kitchen() {
  const [, setLocation] = useLocation();
  const { inventory, isLoading } = useInventory();
  const { iconStyle } = useTheme();
  const styleConfig = getIconStyleConfig(iconStyle);

  const getCategoryCount = (categoryId: string) => inventory[categoryId]?.length || 0;
  const totalItems = Object.values(inventory).flat().length;
  const isPantryEmpty = !isLoading && totalItems === 0;

  return (
    <Layout>
      <div className="space-y-6">
        <header className="pt-4 pb-2">
          <h1 className="text-3xl font-serif text-foreground">Kitchen Pantry</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your ingredients and supplies.</p>
        </header>

        {isPantryEmpty && (
          <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
              <Package size={28} className="text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-serif text-lg text-foreground">Your pantry is empty</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Add your first item by scanning a barcode or entering it manually.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setLocation("/scan")}
                className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2.5 rounded-xl active:scale-[0.97] transition-transform"
              >
                <ScanLine size={16} /> Scan item
              </button>
              <button
                onClick={() => setLocation("/manual-entry")}
                className="flex items-center gap-2 bg-muted text-foreground text-sm font-medium px-4 py-2.5 rounded-xl active:scale-[0.97] transition-transform"
              >
                <PenLine size={16} /> Add manually
              </button>
            </div>
          </div>
        )}

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4"
        >
          {KITCHEN_CATEGORIES.map((category) => {
            return (
              <Link href={`/category/${category.id}`} key={category.id}>
                <motion.div 
                  variants={item}
                  className="group relative overflow-hidden bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-primary/20 active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between z-10 relative">
                    <div className="flex items-center gap-4">
                      <div className={cn("h-12 w-12 bg-primary/10 flex items-center justify-center text-2xl group-hover:bg-primary transition-colors", styleConfig.containerClass)}>
                        {category.image}
                      </div>
                      <div>
                        <h3 className="font-serif text-lg text-foreground font-medium group-hover:text-primary transition-colors">{category.name}</h3>
                        <p className="text-muted-foreground text-xs font-medium">{getCategoryCount(category.id)} items</p>
                      </div>
                    </div>
                    <div className="text-muted-foreground group-hover:translate-x-1 transition-transform">
                      <ArrowRight size={18} />
                    </div>
                  </div>
                  
                  {/* Background decoration */}
                  <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-20 transition-opacity rotate-12 text-8xl select-none pointer-events-none">
                    {category.image}
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </motion.div>
      </div>
    </Layout>
  );
}
