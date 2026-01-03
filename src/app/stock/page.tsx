"use client";

import { useState, useEffect } from "react";
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
import { INGREDIENT_CATEGORIES } from "@/lib/constants";
import { isExpired, isExpiringSoon } from "@/lib/utils/dateUtils";
import type { StockItem, Ingredient, IngredientCategory } from "@/types";

export default function StockPage() {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>("");
  const [quantity, setQuantity] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [stockData, ingredientsData] = await Promise.all([
        api.getStock(),
        api.getIngredients(),
      ]);
      setStock(stockData);
      setIngredients(ingredientsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredStock = stock.filter((item) =>
    item.ingredient_name.toLowerCase().includes(search.toLowerCase())
  );

  const groupedStock = INGREDIENT_CATEGORIES.map((cat) => ({
    ...cat,
    items: filteredStock.filter((item) => item.category === cat.value),
  })).filter((group) => group.items.length > 0);

  const uncategorizedItems = filteredStock.filter((item) => !item.category);

  const availableIngredients = ingredients.filter(
    (ing) => !stock.some((s) => s.ingredient_id === ing.id)
  );

  const handleAdd = async () => {
    if (!selectedIngredientId || !quantity) return;

    try {
      await api.upsertStock(
        parseInt(selectedIngredientId),
        parseFloat(quantity),
        expiryDate || undefined
      );
      setDialogOpen(false);
      setSelectedIngredientId("");
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
      await api.upsertStock(item.ingredient_id, newQuantity, item.expiry_date || undefined);
      await loadData();
    } catch (error) {
      console.error("Error updating stock:", error);
    }
  };

  const renderStockItem = (item: StockItem) => (
    <Card key={item.id} className={`${isExpired(item.expiry_date) ? "border-destructive" : isExpiringSoon(item.expiry_date) ? "border-yellow-500" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="font-medium">{item.ingredient_name}</p>
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => handleUpdateQuantity(item, parseFloat(e.target.value) || 0)}
                className="w-20 h-8"
              />
              <span className="text-sm text-muted-foreground">{['pièce', 'pièces', 'piece'].includes(item.unit_display?.toLowerCase() || '') ? '' : item.unit_display}</span>
              {item.expiry_date && (
                <Badge variant={isExpired(item.expiry_date) ? "destructive" : isExpiringSoon(item.expiry_date) ? "outline" : "secondary"}>
                  {new Date(item.expiry_date).toLocaleDateString("fr-FR")}
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Stock</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un ingrédient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : stock.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Aucun article en stock</p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un article
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedStock.map((group) => (
            <div key={group.value}>
              <h2 className="text-lg font-semibold mb-3">{group.label}</h2>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {group.items.map(renderStockItem)}
              </div>
            </div>
          ))}
          {uncategorizedItems.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Autres</h2>
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
            <DialogTitle>Ajouter au stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ingrédient</Label>
              <Select value={selectedIngredientId} onValueChange={setSelectedIngredientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un ingrédient" />
                </SelectTrigger>
                <SelectContent>
                  {availableIngredients.map((ing) => (
                    <SelectItem key={ing.id} value={ing.id.toString()}>
                      {ing.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantité</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Date d&apos;expiration (optionnel)</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAdd} disabled={!selectedIngredientId || !quantity}>
                Ajouter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
