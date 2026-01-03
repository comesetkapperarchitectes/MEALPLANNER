import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { MobileHeader } from "@/components/layout/MobileHeader";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MealPlanner",
  description: "Application de planification de repas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <div className="flex h-screen">
          {/* Desktop sidebar - hidden on mobile */}
          <Sidebar />

          {/* Mobile header with burger menu */}
          <MobileHeader />

          {/* Main content */}
          <main className="flex-1 overflow-auto pt-14 pb-20 px-4 md:pt-6 md:pb-6 md:px-6">
            {children}
          </main>

          {/* Mobile bottom navigation */}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
