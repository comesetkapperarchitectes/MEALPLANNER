"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Search, UserPlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  getRecipeShares,
  shareRecipe,
  unshareRecipe,
  searchUsersByEmail,
} from "@/lib/api/recipes";
import type { RecipeShare } from "@/types";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeId: number;
  recipeName: string;
}

interface SearchUser {
  id: string;
  email: string;
  display_name: string | null;
}

export function ShareDialog({
  open,
  onOpenChange,
  recipeId,
  recipeName,
}: ShareDialogProps) {
  const t = useTranslations();
  const [shares, setShares] = useState<RecipeShare[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadShares = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRecipeShares(recipeId);
      setShares(data);
    } catch (err) {
      console.error("Failed to load shares:", err);
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    if (open) {
      loadShares();
      setSearchQuery("");
      setSearchResults([]);
      setError(null);
    }
  }, [open, loadShares]);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const results = await searchUsersByEmail(searchQuery);
        // Filter out users already shared with
        const sharedUserIds = shares.map((s) => s.shared_with_user_id);
        setSearchResults(results.filter((u) => !sharedUserIds.includes(u.id)));
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, shares]);

  const handleShare = async (user: SearchUser) => {
    setSharing(user.id);
    setError(null);
    try {
      await shareRecipe(recipeId, user.email);
      await loadShares();
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('recipes.shareError'));
    } finally {
      setSharing(null);
    }
  };

  const handleUnshare = async (userId: string) => {
    setRemoving(userId);
    setError(null);
    try {
      await unshareRecipe(recipeId, userId);
      setShares((prev) => prev.filter((s) => s.shared_with_user_id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('recipes.unshareError'));
    } finally {
      setRemoving(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('recipes.shareRecipe')}</DialogTitle>
          <DialogDescription>{recipeName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('recipes.searchByEmail')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="border rounded-md divide-y max-h-40 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {user.display_name || user.email}
                    </p>
                    {user.display_name && (
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleShare(user)}
                    disabled={sharing === user.id}
                  >
                    {sharing === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Current shares */}
          <div>
            <h4 className="text-sm font-medium mb-2">
              {t('recipes.sharedWith', { count: shares.length })}
            </h4>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : shares.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('recipes.noShares')}
              </p>
            ) : (
              <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {share.shared_with_user?.display_name ||
                          share.shared_with_user?.email ||
                          share.shared_with_user_id}
                      </p>
                      {share.shared_with_user?.display_name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {share.shared_with_user.email}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleUnshare(share.shared_with_user_id)}
                      disabled={removing === share.shared_with_user_id}
                    >
                      {removing === share.shared_with_user_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
