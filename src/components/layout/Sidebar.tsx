"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, BookOpen, Package, ShoppingCart, Settings, ChefHat, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Planning", href: "/planning", icon: Calendar },
  { name: "Recettes", href: "/recettes", icon: BookOpen },
  { name: "Stock", href: "/stock", icon: Package },
  { name: "Courses", href: "/courses", icon: ShoppingCart },
  { name: "Paramètres", href: "/parametres", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  // Get display name from user metadata or email
  const displayName = user?.user_metadata?.full_name ||
                      user?.email?.split('@')[0] ||
                      'Utilisateur';

  return (
    <aside className="hidden md:flex w-64 border-r bg-card flex-col">
      <div className="p-6 border-b">
        <Link href="/" className="flex items-center gap-2">
          <ChefHat className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">MealPlanner</span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      {user && (
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            Deconnexion
          </Button>
        </div>
      )}
    </aside>
  );
}
