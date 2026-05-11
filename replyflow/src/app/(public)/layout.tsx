/**
 * Layout for public-facing pages (no auth, no sidebar).
 * Used by /l/[slug] location profile pages.
 */

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
