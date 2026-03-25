import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ConversionCraft",
  description: "AI dropshipping operating system for discovery, creative generation, and launch.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
