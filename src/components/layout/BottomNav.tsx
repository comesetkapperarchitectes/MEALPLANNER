"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, BookOpen, Package, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Planning", href: "/planning", icon: Calendar },
  { name: "Recettes", href: "/recettes", icon: BookOpen },
  { name: "Stock", href: "/stock", icon: Package },
  { name: "Courses", href: "/courses", icon: ShoppingCart },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors min-w-[60px]",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
