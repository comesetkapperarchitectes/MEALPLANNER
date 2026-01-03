"use client";

import { useState, useEffect } from "react";
import { Save, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import * as api from "@/lib/api";
import type { Settings, Ingredient } from "@/types";

export default function ParametresPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [familySize, setFamilySize] = useState("4");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadData = async () => {
    try {
      const [settingsData, ingredientsData] = await Promise.all([
        api.getSettings(),
        api.getIngredients(),
      ]);
      setSettings(settingsData);
      setIngredients(ingredientsData);
      setFamilySize(settingsData.family_size.toString());
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updateSettings({
        family_size: parseInt(familySize) || 4,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const stapleIngredients = ingredients.filter((i) => i.is_staple);

  return (
    <div className="space-y-4 md:space-y-6 max-w-2xl">
      <h1 className="hidden md:block text-3xl font-bold">Paramètres</h1>

      {/* General settings */}
      <Card>
        <CardHeader>
          <CardTitle>Paramètres généraux</CardTitle>
          <CardDescription>
            Configuration de base pour votre planification de repas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="familySize">Nombre de personnes par défaut</Label>
            <div className="flex gap-2">
              <Input
                id="familySize"
                type="number"
                min={1}
                max={20}
                value={familySize}
                onChange={(e) => setFamilySize(e.target.value)}
                className="w-32"
              />
              <Button onClick={handleSave} disabled={isSaving}>
                {saved ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Enregistré
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Enregistrement..." : "Enregistrer"}
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Ce nombre sera utilisé par défaut pour les nouveaux repas planifiés
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Staple ingredients */}
      <Card>
        <CardHeader>
          <CardTitle>Produits de base</CardTitle>
          <CardDescription>
            Les produits de base sont toujours considérés comme en stock et ne sont pas ajoutés aux listes de courses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stapleIngredients.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {stapleIngredients.map((ingredient) => (
                <Badge key={ingredient.id} variant="secondary" className="text-sm py-1 px-2">
                  {ingredient.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun produit de base défini
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-4">
            Note: La gestion des produits de base se fait lors de l&apos;import des recettes en ajoutant is_staple: true aux ingrédients.
          </p>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>À propos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            MealPlanner v1.0.0
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Application de planification de repas avec gestion du stock et des courses.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Propulsé par Next.js et Supabase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
