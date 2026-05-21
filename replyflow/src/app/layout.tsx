import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { themeScript } from "@/components/ui/ThemeToggle";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://replyflow-hivi.com";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "ReplyFlow — Respostas com IA para seus reviews",
    template: "%s | ReplyFlow",
  },
  description:
    "Responda reviews do Google, TripAdvisor, Booking e mais com IA personalizada — no tom certo, em segundos.",
  keywords: [
    "responder reviews google",
    "responder avaliações tripadvisor",
    "gerenciar avaliações online",
    "reputação online",
    "google meu negócio",
    "inteligência artificial reviews",
    "responder reviews com ia",
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
    title: "ReplyFlow — Respostas com IA para seus reviews",
    description:
      "Responda avaliações do Google com IA em segundos. Aumente sua nota, fidelize clientes e economize horas toda semana.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ReplyFlow — Respostas com IA para reviews do Google e mais plataformas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReplyFlow — Respostas com IA para seus reviews",
    description: "Responda reviews do Google, TripAdvisor, Booking e mais com IA personalizada. No tom certo, em segundos.",
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

        {/* Google Ads tag — AW-18179897640 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18179897640"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18179897640');
          `}
        </Script>
      </body>
    </html>
  );
}
