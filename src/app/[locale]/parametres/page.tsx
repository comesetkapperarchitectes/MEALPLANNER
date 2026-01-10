"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Save, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import * as api from "@/lib/api";
import { getTranslatedName } from "@/lib/utils/translations";
import type { Settings, Ingredient } from "@/types";
import type { Locale } from "@/i18n/routing";

export default function ParametresPage() {
  const locale = useLocale() as Locale;
  const t = useTranslations();
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
      <h1 className="hidden md:block text-3xl font-bold">{t('settings.title')}</h1>

      {/* General settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.generalSettings')}</CardTitle>
          <CardDescription>
            {t('settings.generalSettingsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="familySize">{t('settings.defaultServings')}</Label>
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
                    {t('settings.saved')}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? t('settings.saving') : t('common.save')}
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('settings.defaultServingsHint')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Staple ingredients */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.stapleIngredients')}</CardTitle>
          <CardDescription>
            {t('settings.stapleIngredientsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stapleIngredients.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {stapleIngredients.map((ingredient) => (
                <Badge key={ingredient.id} variant="secondary" className="text-sm py-1 px-2">
                  {getTranslatedName(ingredient.translations, ingredient.name, locale)}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('settings.noStapleIngredients')}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-4">
            {t('settings.stapleIngredientsNote')}
          </p>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.about')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Cut v1.0.0
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('settings.aboutDescription')}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {t('settings.poweredBy')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
