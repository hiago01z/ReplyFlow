import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ReplyFlow — Sua reputação no piloto automático",
  description:
    "ReplyFlow responde todos os seus reviews no Google com IA personalizada — em segundos, no tom certo, sem você precisar fazer nada.",
  openGraph: {
    title: "ReplyFlow",
    description: "Sua reputação no piloto automático.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
