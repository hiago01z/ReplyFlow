"use client";

/**
 * PlatformBadges — exibe o status de conexão de todas as plataformas
 * em cada card de local na lista de locais.
 *
 * Props:
 *  - loc:     dados do local (campos de conexão)
 *  - plan:    plano da org (para verificar limite de plataformas)
 *  - compact: layout menor para uso inline nos cards da lista
 *
 * Limites por plano:
 *  - free:    2 plataformas
 *  - starter: 3 plataformas
 *  - pro:     todas (ilimitado)
 *  - agency:  todas (ilimitado)
 */

interface LocationPlatformData {
  id:                      string;
  // Google manual mode
  google_connected:        boolean;
  google_url:              string | null;
  // Google API (preserved for future activation)
  google_access_token:     string | null;
  google_location_name:    string | null;
  tripadvisor_connected:   boolean;
  tripadvisor_url:         string | null;
  reclame_aqui_connected:  boolean;
  reclame_aqui_url:        string | null;
  booking_connected:       boolean;
  booking_url:             string | null;
  ifood_connected:         boolean;
  ifood_url:               string | null;
  facebook_connected:      boolean;
  facebook_page_name:      string | null;
}

interface Props {
  loc:     LocationPlatformData;
  plan:    string;
  compact?: boolean;
}

// 99 = "unlimited" (pro / agency)
const PLATFORM_LIMIT: Record<string, number> = {
  free: 2, starter: 3, pro: 99, agency: 99,
};

function GoogleIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function TripAdvisorIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="#00AF87">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 14.5c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
    </svg>
  );
}

export function PlatformBadges({ loc, plan, compact = false }: Props) {
  const platformLimit  = PLATFORM_LIMIT[plan] ?? 3;
  const connectedCount =
    (loc.google_connected ? 1 : 0) +
    (loc.tripadvisor_connected ? 1 : 0) +
    (loc.reclame_aqui_connected ? 1 : 0) +
    (loc.booking_connected ? 1 : 0) +
    (loc.ifood_connected ? 1 : 0);
    // facebook_connected omitted — integration hidden pending Meta CNPJ approval
  const atPlatformLimit = connectedCount >= platformLimit;

  const platforms = [
    {
      key:       "google",
      label:     "Google",
      icon:      <GoogleIcon size={compact ? 12 : 13} />,
      connected: loc.google_connected,
      pending:   false,
      href:      `/locations/${loc.id}#google`,
      isLink:    true,
      available: true,
    },
    {
      key:       "tripadvisor",
      label:     "TripAdvisor",
      icon:      <TripAdvisorIcon size={compact ? 12 : 13} />,
      connected: loc.tripadvisor_connected,
      pending:   false,
      href:      `/locations/${loc.id}#tripadvisor`,
      isLink:    true,
      available: true,
    },
    {
      key:       "reclame_aqui",
      label:     "Reclame Aqui",
      icon:      <span style={{ fontSize: compact ? 10 : 11, lineHeight: 1 }}>🔴</span>,
      connected: loc.reclame_aqui_connected,
      pending:   false,
      href:      `/locations/${loc.id}#reclame-aqui`,
      isLink:    true,
      available: true,
    },
    {
      key:       "booking",
      label:     "Booking.com",
      icon:      <span style={{ fontSize: compact ? 10 : 11, lineHeight: 1 }}>🏨</span>,
      connected: loc.booking_connected,
      pending:   false,
      href:      `/locations/${loc.id}#booking`,
      isLink:    true,
      available: true,
    },
    {
      key:       "ifood",
      label:     "iFood",
      icon:      <span style={{ fontSize: compact ? 10 : 11, lineHeight: 1 }}>🍔</span>,
      connected: loc.ifood_connected,
      pending:   false,
      href:      `/locations/${loc.id}#ifood`,
      isLink:    true,
      available: true,
    },
    // TODO: Facebook — integração planejada para sprint futuro.
    // Requer aprovação de permissões avançadas pelo Meta (pages_manage_engagement) + CNPJ.
    // Remova este comentário e restaure o bloco abaixo quando o App Review Meta for aprovado:
    // {
    //   key:       "facebook",
    //   label:     "Facebook",
    //   icon:      <FacebookIcon size={compact ? 12 : 13} />,
    //   connected: loc.facebook_connected,
    //   pending:   false,
    //   href:      `/api/facebook/auth?locationId=${loc.id}`,
    //   isLink:    true,
    //   available: true,
    // },
  ];

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${compact ? "mt-1" : "mt-1.5"}`}>
      {platforms.map((p) => {
        const isLocked = !p.available && !p.connected;

        if (p.connected) {
          return (
            <span
              key={p.key}
              className={`inline-flex items-center gap-1 font-medium text-green-700 bg-green-50 border border-green-200 rounded-full ${compact ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5"}`}
              title={`${p.label} conectado`}
            >
              {p.icon}
              <span className="hidden sm:inline">{p.label}</span>
            </span>
          );
        }

        if (p.pending) {
          return (
            <span
              key={p.key}
              className={`inline-flex items-center gap-1 font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full ${compact ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5"}`}
              title="Sincronizando…"
            >
              {p.icon}
              <span className="hidden sm:inline">Sync…</span>
            </span>
          );
        }

        if (isLocked) {
          return (
            <span
              key={p.key}
              className={`inline-flex items-center gap-1 font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-full cursor-not-allowed ${compact ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5"}`}
              title={`${p.label} — disponível no plano Pro ou superior`}
            >
              {p.icon}
              <span className="hidden sm:inline">{p.label}</span>
              <span className="text-[9px]">🔒</span>
            </span>
          );
        }

        // Not connected, not locked — show connect button
        const Tag = p.isLink ? "a" : "span";
        const linkProps = p.isLink
          ? { href: p.href ?? "#" }
          : {};

        return (
          <Tag
            key={p.key}
            {...linkProps}
            title={atPlatformLimit && !p.connected ? "Limite de plataformas atingido" : `Conectar ${p.label}`}
            className={`inline-flex items-center gap-1 font-medium text-gray-500 bg-white border border-dashed border-gray-300 rounded-full transition-colors hover:border-gray-400 hover:text-gray-700 ${compact ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5"} ${atPlatformLimit ? "opacity-40 pointer-events-none" : "cursor-pointer"}`}
          >
            {p.icon}
            <span className="hidden sm:inline">{p.label}</span>
          </Tag>
        );
      })}
    </div>
  );
}
