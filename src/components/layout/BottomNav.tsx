"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Calendar, BookOpen, Package, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { key: "planning", href: "/planning", icon: Calendar },
  { key: "recipes", href: "/recettes", icon: BookOpen },
  { key: "stock", href: "/stock", icon: Package },
  { key: "shopping", href: "/courses", icon: ShoppingCart },
] as const;

export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {navigationItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors min-w-[60px]",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{t(item.key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
