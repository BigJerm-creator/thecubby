import Layout from "@/components/layout";
import { KITCHEN_CATEGORIES } from "@/lib/mockData";
import { Link } from "wouter";
import { ArrowRight, Leaf, Snowflake, Milk, Package, Weight, Archive, Wine, Droplets, Salad, Beef, Fish, Croissant, Baby, PawPrint } from "lucide-react";
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
  const { inventory } = useInventory();
  const { iconStyle } = useTheme();
  const styleConfig = getIconStyleConfig(iconStyle);

  const getCategoryCount = (categoryId: string) => {
    return inventory[categoryId]?.length || 0;
  };

  const getIcon = (id: string) => {
    switch (id) {
      case 'spices': return Leaf;
      case 'refrigerated': return Milk;
      case 'frozen': return Snowflake;
      case 'canned': return Archive;
      case 'boxed': return Package;
      case 'bulk': return Weight;
      case 'beverages': return Wine;
      case 'condiments': return Droplets;
      case 'produce': return Salad;
      case 'meat': return Beef;
      case 'seafood': return Fish;
      case 'bakery': return Croissant;
      case 'baby': return Baby;
      case 'pet': return PawPrint;
      default: return Package;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <header className="pt-4 pb-2">
          <h1 className="text-3xl font-serif text-foreground">Kitchen Pantry</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your ingredients and supplies.</p>
        </header>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4"
        >
          {KITCHEN_CATEGORIES.map((category) => {
            const Icon = getIcon(category.id);
            return (
              <Link href={`/category/${category.id}`} key={category.id}>
                <motion.div 
                  variants={item}
                  className="group relative overflow-hidden bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-primary/20 active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between z-10 relative">
                    <div className="flex items-center gap-4">
                      <div className={cn("h-12 w-12 bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors", styleConfig.containerClass)}>
                        <Icon size={22} strokeWidth={styleConfig.strokeWidth} />
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
                  <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                    <Icon size={100} />
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
