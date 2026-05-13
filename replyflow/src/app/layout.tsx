import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { themeScript } from "@/components/ui/ThemeToggle";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://replyflow-hivi.com";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "ReplyFlow — Sua reputação no piloto automático",
    template: "%s | ReplyFlow",
  },
  description:
    "ReplyFlow responde todos os seus reviews no Google com IA personalizada — em segundos, no tom certo, sem você precisar fazer nada.",
  keywords: [
    "responder reviews google",
    "gerenciar avaliações google",
    "reputação online",
    "google meu negócio",
    "inteligência artificial reviews",
    "automação respostas google",
  ],
  authors: [{ name: "ReplyFlow" }],
  creator: "ReplyFlow",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: APP_URL,
    siteName: "ReplyFlow",
    title: "ReplyFlow — Sua reputação no piloto automático",
    description:
      "Responda avaliações do Google com IA em segundos. Aumente sua nota, fidelize clientes e economize horas toda semana.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ReplyFlow — Respostas automáticas para reviews do Google",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReplyFlow — Sua reputação no piloto automático",
    description: "Responda reviews do Google com IA personalizada. Automático, natural e em segundos.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Script inline anti-FOUC: aplica .dark ANTES do CSS, evita flash */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ToastProvider>{children}</ToastProvider>
        <Analytics />
      </body>
    </html>
  );
}
