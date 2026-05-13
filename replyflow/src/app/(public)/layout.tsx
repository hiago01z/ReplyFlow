/**
 * Layout for public-facing pages (no auth, no sidebar).
 * Used by /l/[slug] location profile pages, /privacy and /terms.
 */

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
