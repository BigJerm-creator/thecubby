import Layout from "@/components/layout";
import { ScanLine, Barcode, Camera, Keyboard, X, Check } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { BrowserMultiFormatReader } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat } from '@zxing/library';
import { useLocation } from "wouter";

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats: string[] }) => {
      detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string; format: string }>>;
    };
  }
}

export default function Scan() {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef<boolean>(false);
  const detectedRef = useRef<boolean>(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const isValidBarcode = (code: string): boolean => {
    if (!code || code.length < 6) return false;
    if (/^\d{8,14}$/.test(code)) return true;
    return false;
  };

  const handleBarcodeDetected = useCallback(async (text: string) => {
    if (detectedRef.current) return;
    if (!isValidBarcode(text)) {
      console.log("Invalid barcode ignored:", text);
      return;
    }
    
    detectedRef.current = true;
    setScannedCode(text);
    stopCamera();
    toast({
      title: "Item Scanned!",
      description: `Barcode: ${text}`,
      action: <Check className="h-4 w-4 text-green-500" />
    });
    
    try {
      const res = await fetch(`/api/upc/${encodeURIComponent(text)}`);
      const data = await res.json();
      const params = new URLSearchParams();
      params.set('barcode', text);
      
      if (data.found) {
        if (data.name) params.set('name', data.name);
        if (data.brand) params.set('brand', data.brand);
        if (data.category) params.set('category', data.category);
        if (data.imageUrl) params.set('imageUrl', data.imageUrl);
        if (data.quantity) params.set('quantity', data.quantity);
        if (data.ingredients) params.set('ingredients', data.ingredients);
        if (data.allergens?.length) params.set('allergens', data.allergens.join(','));
        if (data.nutrition) params.set('nutrition', JSON.stringify(data.nutrition));
        if (data.servingSize) params.set('servingSize', data.servingSize);
        if (data.nutriscore) params.set('nutriscore', data.nutriscore);
        toast({
          title: "Product Found!",
          description: data.name || "Product data retrieved",
        });
      } else {
        toast({
          title: "Product not found",
          description: "Enter details manually",
        });
      }
      setLocation(`/manual-entry?${params.toString()}`);
    } catch {
      setLocation(`/manual-entry?barcode=${encodeURIComponent(text)}`);
    }
  }, [toast, setLocation]);

  const startNativeBarcodeScanner = useCallback(async (video: HTMLVideoElement) => {
    if (!window.BarcodeDetector) return false;
    
    try {
      const detector = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128']
      });
      
      const scanFrame = async () => {
        if (!scanningRef.current || detectedRef.current) return;
        
        try {
          const barcodes = await detector.detect(video);
          if (barcodes.length > 0) {
            handleBarcodeDetected(barcodes[0].rawValue);
            return;
          }
        } catch (e) {
          console.log("Detection frame error:", e);
        }
        
        if (scanningRef.current && !detectedRef.current) {
          requestAnimationFrame(scanFrame);
        }
      };
      
      scanFrame();
      return true;
    } catch {
      return false;
    }
  }, [handleBarcodeDetected]);

  const startZxingScanner = useCallback(async (video: HTMLVideoElement, stream: MediaStream) => {
    try {
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      
      const codeReader = new BrowserMultiFormatReader(hints);
      
      codeReader.decodeFromStream(stream, video, (result, error) => {
        if (result && !detectedRef.current) {
          console.log("ZXing detected:", result.getText());
          handleBarcodeDetected(result.getText());
        }
      });
      
      console.log("ZXing scanner initialized");
      return true;
    } catch (e) {
      console.error("ZXing init failed:", e);
      return false;
    }
  }, [handleBarcodeDetected]);

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsScanning(true);
    setScannedCode(null);
    detectedRef.current = false;
    scanningRef.current = true;
    
    if (!videoRef.current) {
      console.log("Video ref not ready, retrying...");
      setTimeout(() => startCamera(), 100);
      return;
    }
    
    const tryGetCamera = async (constraints: MediaStreamConstraints): Promise<MediaStream | null> => {
      try {
        return await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        console.log("Camera constraint failed:", e);
        return null;
      }
    };
    
    try {
      let stream = await tryGetCamera({
        video: { 
          facingMode: { exact: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      if (!stream) {
        stream = await tryGetCamera({
          video: { facingMode: "environment" },
          audio: false
        });
      }
      
      if (!stream) {
        stream = await tryGetCamera({
          video: true,
          audio: false
        });
      }
      
      if (!stream) {
        throw new Error("All camera attempts failed");
      }
      
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      
      await new Promise<void>((resolve) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => resolve();
        }
      });
      
      await videoRef.current.play();
      
      console.log("Camera started, trying barcode detection...");
      const useNative = await startNativeBarcodeScanner(videoRef.current);
      console.log("Native barcode detector:", useNative ? "active" : "falling back to ZXing");
      if (!useNative) {
        await startZxingScanner(videoRef.current, stream);
      }
      
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError("Unable to access camera. Please check permissions.");
      setIsScanning(false);
      scanningRef.current = false;
      
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please enable camera permissions in Settings.",
        variant: "destructive"
      });
    }
  }, [toast, startNativeBarcodeScanner, startZxingScanner]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const handleRetry = () => {
    startCamera();
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
          {/* Video element always rendered for ref to work */}
          <video 
            ref={videoRef}
            autoPlay
            playsInline 
            muted
            className={`absolute inset-0 w-full h-full object-cover ${isScanning ? 'block' : 'hidden'}`}
          />
          {isScanning ? (
            <>
              
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
          onClick={() => setLocation("/manual-entry")}
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
