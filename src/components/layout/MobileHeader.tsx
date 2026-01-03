"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Settings, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 bg-card border-b z-50">
        <div className="flex items-center justify-between h-14 px-4">
          <Link href="/" className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">MealPlanner</span>
          </Link>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </header>

      {/* Menu overlay */}
      {isMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Dropdown menu */}
      <div
        className={cn(
          "md:hidden fixed top-14 right-0 w-64 bg-card border-l border-b rounded-bl-lg shadow-lg z-50 transition-transform duration-200",
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <nav className="p-2">
          <Link
            href="/parametres"
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Settings className="h-5 w-5" />
            Paramètres
          </Link>
        </nav>
      </div>
    </>
  );
}
