import Layout from "@/components/layout";
import { KITCHEN_CATEGORIES } from "@/lib/mockData";
import { Link } from "wouter";
import { ArrowRight, Leaf, Snowflake, Milk, Package, Weight, Archive } from "lucide-react";
import { motion } from "framer-motion";

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
  const getIcon = (id: string) => {
    switch (id) {
      case 'spices': return Leaf;
      case 'refrigerated': return Milk;
      case 'frozen': return Snowflake;
      case 'canned': return Archive;
      case 'boxed': return Package;
      case 'bulk': return Weight;
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
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icon size={22} strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="font-serif text-lg text-foreground font-medium group-hover:text-primary transition-colors">{category.name}</h3>
                        <p className="text-muted-foreground text-xs font-medium">{category.count} items</p>
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
