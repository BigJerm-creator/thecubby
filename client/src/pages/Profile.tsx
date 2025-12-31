import { useState, useEffect } from "react";
import Layout from "@/components/layout";
import { ArrowLeft, Save, User } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UserProfile } from "@shared/schema";

const DIETARY_PREFERENCES = [
  { id: "vegan", label: "Vegan" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "diabetic", label: "Diabetic" },
  { id: "low-carb", label: "Low-Carb" },
];

const RESTRICTIONS = [
  { id: "gluten-free", label: "Gluten Free" },
  { id: "lactose-free", label: "Lactose Free" },
  { id: "no-alcohol", label: "No Alcohol" },
  { id: "no-shellfish", label: "No Shellfish" },
  { id: "no-nuts", label: "No Nuts" },
  { id: "pregnancy", label: "Pregnancy" },
];

export default function Profile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [height, setHeight] = useState("");
  const [heightUnit, setHeightUnit] = useState("in");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("lbs");
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [restrictions, setRestrictions] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/profile")
      .then(res => res.json())
      .then((data: UserProfile | null) => {
        if (data) {
          setName(data.name || "");
          setDateOfBirth(data.dateOfBirth || "");
          setHeight(data.height?.toString() || "");
          setHeightUnit(data.heightUnit || "in");
          setWeight(data.weight?.toString() || "");
          setWeightUnit(data.weightUnit || "lbs");
          setDietaryPreferences(data.dietaryPreferences || []);
          setRestrictions(data.restrictions || []);
        }
      })
      .catch(err => console.error("Failed to load profile:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || null,
          dateOfBirth: dateOfBirth || null,
          height: height ? parseFloat(height) : null,
          heightUnit,
          weight: weight ? parseFloat(weight) : null,
          weightUnit,
          dietaryPreferences: dietaryPreferences.length > 0 ? dietaryPreferences : null,
          restrictions: restrictions.length > 0 ? restrictions : null,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to save profile");
      
      toast({
        title: "Profile Saved",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (id: string) => {
    setDietaryPreferences(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleRestriction = (id: string) => {
    setRestrictions(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const calculateAge = (dob: string): number | null => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(dateOfBirth);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 pt-4 pb-8">
        <header className="flex items-center gap-3">
          <button
            onClick={() => setLocation("/settings")}
            className="h-10 w-10 rounded-full bg-muted flex items-center justify-center"
            data-testid="button-back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-serif text-foreground">My Profile</h1>
        </header>

        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <User size={32} />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-foreground text-lg">{name || "Your Name"}</h3>
            {age !== null && (
              <p className="text-sm text-muted-foreground">{age} years old</p>
            )}
          </div>
        </div>

        <section className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Personal Information</h3>
          <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                data-testid="input-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                data-testid="input-dob"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Height</Label>
                <div className="flex gap-2">
                  <Input
                    id="height"
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="0"
                    className="flex-1"
                    data-testid="input-height"
                  />
                  <Select value={heightUnit} onValueChange={setHeightUnit}>
                    <SelectTrigger className="w-20" data-testid="select-height-unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">in</SelectItem>
                      <SelectItem value="cm">cm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight</Label>
                <div className="flex gap-2">
                  <Input
                    id="weight"
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="0"
                    className="flex-1"
                    data-testid="input-weight"
                  />
                  <Select value={weightUnit} onValueChange={setWeightUnit}>
                    <SelectTrigger className="w-20" data-testid="select-weight-unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lbs">lbs</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Dietary Preferences</h3>
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="grid grid-cols-2 gap-3">
              {DIETARY_PREFERENCES.map((pref) => (
                <label
                  key={pref.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  data-testid={`checkbox-pref-${pref.id}`}
                >
                  <Checkbox
                    checked={dietaryPreferences.includes(pref.id)}
                    onCheckedChange={() => togglePreference(pref.id)}
                  />
                  <span className="text-sm font-medium">{pref.label}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Food Restrictions</h3>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground mb-3">Recipe suggestions will avoid these ingredients</p>
            <div className="grid grid-cols-2 gap-3">
              {RESTRICTIONS.map((rest) => (
                <label
                  key={rest.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  data-testid={`checkbox-rest-${rest.id}`}
                >
                  <Checkbox
                    checked={restrictions.includes(rest.id)}
                    onCheckedChange={() => toggleRestriction(rest.id)}
                  />
                  <span className="text-sm font-medium">{rest.label}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 text-base font-medium gap-2"
          data-testid="button-save-profile"
        >
          <Save size={18} />
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </Layout>
  );
}
