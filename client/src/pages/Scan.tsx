import Layout from "@/components/layout";
import { ScanLine, Barcode, Camera, Keyboard } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Scan() {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async (retry = true) => {
    setIsScanning(true);
    setCameraError(null);
    try {
      // Ensure previous tracks are stopped
      stopCamera();
      
      const constraints = {
        video: { 
          facingMode: "environment"
          // Removed ideal width/height to be more compatible
        } 
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Explicitly call play() for iOS
        await videoRef.current.play().catch(e => console.error("Play error:", e));
      }
    } catch (err) {
      console.error("Camera error:", err);
      
      // Retry with fallback (any camera) if first attempt failed
      if (retry) {
        console.log("Retrying with fallback constraints...");
        try {
            const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = fallbackStream;
                await videoRef.current.play().catch(e => console.error("Play error:", e));
            }
            return; // Success on retry
        } catch (fallbackErr) {
            console.error("Fallback camera error:", fallbackErr);
        }
      }

      setCameraError("Unable to access camera. Please check permissions.");
      setIsScanning(false);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please enable camera permissions in Settings.",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

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
              {/* Actual Camera Feed */}
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              
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
             <div className="absolute inset-0 bg-muted flex flex-col items-center justify-center p-4 text-center">
               <Camera size={48} className="text-muted-foreground mb-4" />
               <p className="text-muted-foreground font-medium">
                 {cameraError || "Camera Paused"}
               </p>
               {cameraError && (
                 <button 
                   onClick={startCamera}
                   className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
                 >
                   Try Again
                 </button>
               )}
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
