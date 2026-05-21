/**
 * GET /og-image.png
 *
 * Gera OG image dinamicamente via @vercel/og.
 * Evita o erro de imagem quebrada no compartilhamento social.
 */

import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #4f46e5 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          padding: "60px",
        }}
      >
        {/* Logo badge */}
        <div
          style={{
            background: "rgba(255,255,255,0.15)",
            borderRadius: "20px",
            padding: "20px 28px",
            marginBottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span style={{ fontSize: "36px" }}>⚡</span>
          <span style={{ fontSize: "36px", fontWeight: 800, color: "#fff", letterSpacing: "-1px" }}>
            ReplyFlow
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: 800,
            color: "#fff",
            textAlign: "center",
            lineHeight: 1.1,
            letterSpacing: "-2px",
            marginBottom: "24px",
          }}
        >
          Sua reputação no
          <br />
          piloto automático.
        </div>

        {/* Subheadline */}
        <div
          style={{
            fontSize: "28px",
            color: "rgba(255,255,255,0.8)",
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.4,
          }}
        >
          IA responde reviews do Google, TripAdvisor e mais — no tom certo, em segundos.
        </div>

        {/* Star row */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "40px",
          }}
        >
          {["★", "★", "★", "★", "★"].map((s, i) => (
            <span key={i} style={{ fontSize: "40px", color: "#fbbf24" }}>
              {s}
            </span>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
