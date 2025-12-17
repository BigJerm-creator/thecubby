import Layout from "@/components/layout";
import { ScanLine, Barcode, Camera, Keyboard } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Scan() {
  const [isScanning, setIsScanning] = useState(true);

  return (
    <Layout>
      <div className="h-full flex flex-col pt-4">
        <header className="mb-6 px-2">
          <h1 className="text-2xl font-serif text-foreground">Add Item</h1>
          <p className="text-muted-foreground text-sm">Scan a barcode or receipt</p>
        </header>

        {/* Scanner Viewport Simulation */}
        <div className="relative aspect-[3/4] bg-black rounded-3xl overflow-hidden shadow-xl mb-6 mx-2">
          {isScanning ? (
            <>
              {/* Simulated Camera Feed Background */}
              <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                <p className="text-zinc-600 text-xs">Camera Feed</p>
              </div>
              
              {/* Overlay UI */}
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8">
                <div className="w-64 h-40 border-2 border-white/50 rounded-lg relative">
                  {/* Scanning Laser Animation */}
                  <motion.div 
                    animate={{ top: ["10%", "90%", "10%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute left-2 right-2 h-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                  />
                  
                  {/* Corner Markers */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white -mt-0.5 -ml-0.5"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white -mt-0.5 -mr-0.5"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white -mb-0.5 -ml-0.5"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white -mb-0.5 -mr-0.5"></div>
                </div>
                <p className="text-white/80 text-sm mt-8 font-medium bg-black/40 px-4 py-1 rounded-full backdrop-blur-md">
                  Align barcode within frame
                </p>
              </div>
            </>
          ) : (
             <div className="absolute inset-0 bg-muted flex items-center justify-center">
               <p className="text-muted-foreground">Camera Paused</p>
             </div>
          )}
        </div>

        {/* Scan Controls */}
        <div className="grid grid-cols-2 gap-3 px-2">
          <button className="flex flex-col items-center justify-center gap-2 bg-card p-4 rounded-xl border border-border hover:border-primary/50 transition-colors shadow-sm">
            <Barcode size={24} className="text-primary" />
            <span className="text-xs font-medium">Scan Barcode</span>
          </button>
          
          <button className="flex flex-col items-center justify-center gap-2 bg-card p-4 rounded-xl border border-border hover:border-primary/50 transition-colors shadow-sm">
            <ScanLine size={24} className="text-primary" />
            <span className="text-xs font-medium">Scan Receipt</span>
          </button>
        </div>

        <button className="mt-4 mx-2 py-3 flex items-center justify-center gap-2 text-primary font-medium text-sm hover:bg-primary/5 rounded-lg transition-colors">
          <Keyboard size={18} />
          Enter manually instead
        </button>
      </div>
    </Layout>
  );
}
