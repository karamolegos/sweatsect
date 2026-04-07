import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SWEAT SECT",
  description: "By invitation only.",
  robots: "noindex, nofollow", // Hidden until launch
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
