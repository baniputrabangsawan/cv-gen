import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CVKita — CV profesional, dibuat lebih mudah",
  description: "Buat, lihat, dan unduh CV profesional secara real-time.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
