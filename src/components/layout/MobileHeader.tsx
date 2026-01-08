"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, Settings, ChefHat, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

export function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    setIsMenuOpen(false);
    await signOut();
    router.push('/auth/login');
  };

  // Get display name from user metadata or email
  const displayName = user?.user_metadata?.full_name ||
                      user?.email?.split('@')[0] ||
                      'Utilisateur';

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 h-[56px] bg-card border-b z-50">
        <div className="flex items-center justify-between h-full px-4">
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
          "md:hidden fixed top-[56px] right-0 w-64 bg-card border-l border-b rounded-bl-lg shadow-lg z-50 transition-transform duration-200",
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* User info */}
        {user && (
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        <nav className="p-2">
          <Link
            href="/parametres"
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Settings className="h-5 w-5" />
            Parametres
          </Link>

          {user && (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-destructive transition-colors w-full"
            >
              <LogOut className="h-5 w-5" />
              Deconnexion
            </button>
          )}
        </nav>
      </div>
    </>
  );
}
