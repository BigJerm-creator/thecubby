import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sage-50 to-cream-50 flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center space-y-12 max-w-sm mx-auto">
        <img 
          src={logo} 
          alt="The Cubby" 
          className="w-64 h-64 object-contain"
        />
        
        <a href="/api/login" className="w-full">
          <Button size="lg" className="w-full text-lg py-6 rounded-xl">
            Sign In
          </Button>
        </a>
      </div>
    </div>
  );
}
