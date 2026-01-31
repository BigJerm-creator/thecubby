import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, ChefHat, Book, CalendarDays, Scan, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sage-50 to-cream-50">
      <div className="container mx-auto px-6 py-12">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-serif text-charcoal mb-3">The Cubby</h1>
          <p className="text-lg text-muted-foreground">
            Your kitchen companion for pantry tracking, meal planning, and recipe inspiration
          </p>
        </header>

        <div className="grid gap-6 max-w-md mx-auto mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-start gap-4">
              <div className="bg-sage-100 p-3 rounded-xl">
                <Scan className="w-6 h-6 text-sage-700" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Barcode Scanning</h3>
                <p className="text-sm text-muted-foreground">
                  Quickly add items by scanning barcodes with your camera
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 p-3 rounded-xl">
                <Package className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Inventory Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Track expiration dates and never waste food again
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <ShoppingCart className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Shopping Lists</h3>
                <p className="text-sm text-muted-foreground">
                  Create and manage shopping lists with ease
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-start gap-4">
              <div className="bg-purple-100 p-3 rounded-xl">
                <ChefHat className="w-6 h-6 text-purple-700" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">AI Recipe Generator</h3>
                <p className="text-sm text-muted-foreground">
                  Get personalized recipes based on your pantry items
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-start gap-4">
              <div className="bg-rose-100 p-3 rounded-xl">
                <Book className="w-6 h-6 text-rose-700" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Recipe Book</h3>
                <p className="text-sm text-muted-foreground">
                  Save recipes from photos, PDFs, or AI suggestions
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-start gap-4">
              <div className="bg-emerald-100 p-3 rounded-xl">
                <CalendarDays className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Meal Planning</h3>
                <p className="text-sm text-muted-foreground">
                  Plan meals for up to a month in advance
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4 max-w-sm mx-auto">
          <a href="/api/login" className="block">
            <Button size="lg" className="w-full text-lg py-6 rounded-xl">
              <Users className="w-5 h-5 mr-2" />
              Sign In to Get Started
            </Button>
          </a>
          <p className="text-xs text-muted-foreground">
            Sign in with your email, Google, GitHub, or Apple account
          </p>
        </div>
      </div>
    </div>
  );
}
