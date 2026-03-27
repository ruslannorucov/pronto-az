import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";

// Headings üçün font
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
});

// Bütün digər mətnlər üçün font
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Pronto.az | Find, call, done",
  description: "Finding a good worker has never been this easy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="font-sans text-[var(--text)] bg-[var(--bg)] min-h-screen">
        {children}
      </body>
    </html>
  );
}