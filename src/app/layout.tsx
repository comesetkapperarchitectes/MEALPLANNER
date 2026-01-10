import type { Metadata } from "next";
import { Inter, Lobster } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const lobster = Lobster({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-logo"
});

export const metadata: Metadata = {
  title: "Cut",
  description: "Application de planification de repas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.className} ${lobster.variable}`}>
        {children}
      </body>
    </html>
  );
}
