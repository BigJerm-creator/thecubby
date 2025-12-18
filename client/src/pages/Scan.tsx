import Layout from "@/components/layout";
import { ScanLine, Barcode, Camera, Keyboard, X, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { useLocation } from "wouter";

export default function Scan() {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    codeReaderRef.current = new BrowserMultiFormatReader();
    startCamera();
    return () => stopCamera();
  }, []);

  // Effect to attach stream to video element once it's rendered and stream is available
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      // iOS requires user interaction for audio, but video is muted so it should autoplay if playsInline is set.
      // However, explicit play() call is safer.
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
            console.error("Play error:", e);
        });
      }

      // Start decoding from video stream
      if (codeReaderRef.current && videoRef.current) {
        codeReaderRef.current.decodeFromVideoDevice(
          undefined, 
          videoRef.current, 
          (result, err) => {
            if (result) {
              const text = result.getText();
              setScannedCode(text);
              stopCamera();
              toast({
                title: "Item Scanned!",
                description: `Found barcode: ${text}`,
                action: <Check className="h-4 w-4 text-green-500" />
              });
              
              // Simulate product lookup delay
              setTimeout(() => {
                  // In a real app, this would query a product API
                  // For now, redirect to a "New Item" form with the code pre-filled
                  setLocation(`/kitchen?new_item=${text}`);
              }, 1500);
            }
          }
        ).catch(err => console.error("Decode error:", err));
      }
    }
  }, [videoRef, stream]); 

  const startCamera = async (retry = true) => {
    setCameraError(null);
    setIsScanning(true);
    setScannedCode(null);
    
    try {
      // Clean up existing stream if any
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: { 
          facingMode: "environment"
        },
        audio: false 
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      
    } catch (err) {
      console.error("Camera error:", err);
      
      // Retry with fallback (any camera) if first attempt failed and requested
      if (retry) {
        console.log("Retrying with fallback constraints...");
        try {
            const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(fallbackStream);
            return; // Success on retry
        } catch (fallbackErr) {
            console.error("Fallback camera error:", fallbackErr);
        }
      }

      setCameraError("Unable to access camera. Please check permissions.");
      setIsScanning(false);
      setStream(null);
      
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please enable camera permissions in Settings.",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (codeReaderRef.current) {
        codeReaderRef.current.reset();
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsScanning(false);
  };

  const handleRetry = () => {
    startCamera(true);
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
               {scannedCode ? (
                 <div className="flex flex-col items-center gap-4">
                    <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                        <Check size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-foreground">Scanned!</h3>
                        <p className="text-muted-foreground font-mono mt-1">{scannedCode}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Redirecting...</p>
                 </div>
               ) : (
                <>
                   <Camera size={48} className="text-muted-foreground mb-4" />
                   <p className="text-muted-foreground font-medium">
                     {cameraError || "Camera Paused"}
                   </p>
                   {cameraError && (
                     <button 
                       onClick={handleRetry}
                       className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
                     >
                       Try Again
                     </button>
                   )}
                </>
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

        <button 
          onClick={() => setLocation("/kitchen")}
          className="mt-4 mx-2 py-3 flex items-center justify-center gap-2 text-primary font-medium text-sm hover:bg-primary/5 rounded-lg transition-colors"
          data-testid="button-enter-manually"
        >
          <Keyboard size={18} />
          Enter manually instead
        </button>
      </div>
    </Layout>
  );
}
