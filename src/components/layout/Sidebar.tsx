"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Calendar, BookOpen, Package, ShoppingCart, Settings, LogOut, User } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";

const LOGO_URL = "https://lmfgojycsquicexylkxi.supabase.co/storage/v1/object/public/assets/logo.jpg";

const navigationItems = [
  { key: "planning", href: "/planning", icon: Calendar },
  { key: "recipes", href: "/recettes", icon: BookOpen },
  { key: "stock", href: "/stock", icon: Package },
  { key: "shopping", href: "/courses", icon: ShoppingCart },
  { key: "settings", href: "/parametres", icon: Settings },
] as const;

export function Sidebar() {
  const t = useTranslations("nav");
  const tSettings = useTranslations("settings");
  const tCommon = useTranslations("common");
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
                      tCommon('user');

  return (
    <aside className="hidden md:flex w-64 border-r bg-card flex-col">
      <div className="p-6 border-b">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={LOGO_URL}
            alt="Cut Logo"
            width={28}
            height={28}
            className="rounded-md object-cover"
          />
          <span className="text-5xl font-logo tracking-wide">Cut</span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navigationItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      {user && (
        <div className="p-4 border-t space-y-3">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <div className="px-3">
            <LanguageSwitcher />
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            {tSettings("logout")}
          </Button>
        </div>
      )}
    </aside>
  );
}
