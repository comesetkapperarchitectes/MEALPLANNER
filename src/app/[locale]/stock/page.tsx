"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import * as api from "@/lib/api";
import { getDisplayableUnits } from "@/lib/api/units";
import { INGREDIENT_CATEGORIES } from "@/lib/constants";
import { isExpired, isExpiringSoon } from "@/lib/utils/dateUtils";
import { formatUnit } from "@/lib/utils/unitUtils";
import { getTranslatedName } from "@/lib/utils/translations";
import type { StockItem, Ingredient, IngredientCategory, Unit } from "@/types";
import type { Locale } from "@/i18n/routing";

export default function StockPage() {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>("");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [quantity, setQuantity] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [stockData, ingredientsData, unitsData] = await Promise.all([
        api.getStock(),
        api.getIngredients(),
        getDisplayableUnits(),
      ]);
      setStock(stockData);
      setIngredients(ingredientsData);
      setUnits(unitsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper to get translated ingredient name
  const getIngredientDisplayName = (item: StockItem) => {
    return getTranslatedName(item.ingredient_translations, item.ingredient_name, locale);
  };

  const filteredStock = stock.filter((item) => {
    const displayName = getIngredientDisplayName(item);
    return displayName.toLowerCase().includes(search.toLowerCase()) ||
           item.ingredient_name.toLowerCase().includes(search.toLowerCase());
  });

  const groupedStock = INGREDIENT_CATEGORIES.map((cat) => ({
    ...cat,
    items: filteredStock.filter((item) => item.category === cat.value),
  })).filter((group) => group.items.length > 0);

  const uncategorizedItems = filteredStock.filter((item) => !item.category);

  const availableIngredients = ingredients.filter(
    (ing) => !stock.some((s) => s.ingredient_id === ing.id)
  );

  const handleAdd = async () => {
    if (!selectedIngredientId || !quantity || !selectedUnitId) return;

    try {
      await api.upsertStock(
        parseInt(selectedIngredientId),
        parseFloat(quantity),
        parseInt(selectedUnitId),
        expiryDate || undefined
      );
      setDialogOpen(false);
      setSelectedIngredientId("");
      setSelectedUnitId("");
      setQuantity("");
      setExpiryDate("");
      await loadData();
    } catch (error) {
      console.error("Error adding stock:", error);
    }
  };

  const handleDelete = async (ingredientId: number) => {
    try {
      await api.deleteStock(ingredientId);
      await loadData();
    } catch (error) {
      console.error("Error deleting stock:", error);
    }
  };

  const handleUpdateQuantity = async (item: StockItem, newQuantity: number) => {
    try {
      await api.upsertStock(item.ingredient_id, newQuantity, item.unit_id, item.expiry_date || undefined);
      await loadData();
    } catch (error) {
      console.error("Error updating stock:", error);
    }
  };

  const getUnitLabel = (unit: Unit) => {
    return unit.translations.fr?.abbr || unit.code;
  };

  const renderStockItem = (item: StockItem) => {
    const unitStr = formatUnit(item.unit, item.quantity, locale);
    const displayName = getIngredientDisplayName(item);
    return (
      <Card key={item.id} className={`${isExpired(item.expiry_date) ? "border-destructive" : isExpiringSoon(item.expiry_date) ? "border-yellow-500" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium">{displayName}</p>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleUpdateQuantity(item, parseFloat(e.target.value) || 0)}
                  className="w-20 h-8"
                />
                <span className="text-sm text-muted-foreground">{unitStr}</span>
                {item.expiry_date && (
                  <Badge variant={isExpired(item.expiry_date) ? "destructive" : isExpiringSoon(item.expiry_date) ? "outline" : "secondary"}>
                    {new Date(item.expiry_date).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR')}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => handleDelete(item.ingredient_id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-3xl font-bold">{t('stock.title')}</h1>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="md:size-default ml-auto">
          <Plus className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">{t('common.add')}</span>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('common.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">{t('common.loading')}</div>
      ) : stock.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t('stock.noStock')}</p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('stock.addIngredient')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedStock.map((group) => (
            <div key={group.value}>
              <h2 className="text-lg font-semibold mb-3">{t(`ingredientCategories.${group.value}`)}</h2>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {group.items.map(renderStockItem)}
              </div>
            </div>
          ))}
          {uncategorizedItems.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">{t('common.other')}</h2>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {uncategorizedItems.map(renderStockItem)}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('stock.addIngredient')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('stock.ingredient')}</Label>
              <Select value={selectedIngredientId} onValueChange={setSelectedIngredientId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('stock.selectIngredient')} />
                </SelectTrigger>
                <SelectContent>
                  {availableIngredients.map((ing) => (
                    <SelectItem key={ing.id} value={ing.id.toString()}>
                      {getTranslatedName(ing.translations, ing.name, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>{t('stock.quantity')}</Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('stock.unit')}</Label>
                <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('stock.unit')} />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>
                        {getUnitLabel(unit)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('stock.expiryDate')}</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleAdd} disabled={!selectedIngredientId || !quantity || !selectedUnitId}>
                {t('common.add')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
