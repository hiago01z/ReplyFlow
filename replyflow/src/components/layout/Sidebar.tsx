"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Star, MapPin, CreditCard,
  Settings, LogOut, Zap, Menu, X, BarChart2, Building2,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";
import type { Plan } from "@/types";

interface SidebarProps {
  orgName: string;
  userName: string;
  plan: Plan;
  pendingCount?: number;
}

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Visão Geral",    Icon: LayoutDashboard, plans: null },
  { href: "/reviews",    label: "Reviews",         Icon: Star,            plans: null },
  { href: "/analytics",  label: "Analytics",       Icon: BarChart2,       plans: null },
  { href: "/locations",  label: "Meus Locais",     Icon: MapPin,          plans: null },
  { href: "/agency",     label: "Agência",          Icon: Building2,       plans: ["agency"] },
  { href: "/billing",    label: "Plano & Billing", Icon: CreditCard,      plans: null },
  { href: "/settings",   label: "Configurações",   Icon: Settings,        plans: null },
];

const PLAN_BADGE: Record<Plan, { label: string; cls: string }> = {
  free:    { label: "Free",    cls: "bg-gray-100 text-gray-500" },
  starter: { label: "Starter", cls: "bg-blue-50 text-blue-600" },
  pro:     { label: "Pro",     cls: "bg-indigo-50 text-indigo-600" },
  agency:  { label: "Agência", cls: "bg-purple-50 text-purple-600" },
};

function SidebarContent({
  orgName, userName, plan, pendingCount = 0, onClose,
}: SidebarProps & { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const badge = PLAN_BADGE[plan];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = userName
    .split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "U";

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
        <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2.5">
          <div className="w-8 h-8 brand-gradient rounded-lg flex items-center justify-center shadow-sm shrink-0">
            <Zap size={15} className="text-white fill-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm tracking-tight">ReplyFlow</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 md:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Org + plan */}
      <div className="px-4 pt-2 pb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 truncate flex-1 min-w-0">{orgName}</span>
          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0", badge.cls)}>
            {badge.label}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.filter(({ plans }) => !plans || plans.includes(plan)).map(({ href, label, Icon }) => {
          const isActive = href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href);
          const showBadge = href === "/reviews" && pendingCount > 0;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <Icon size={16} className={cn("shrink-0", isActive ? "text-indigo-600" : "text-gray-400")} />
              <span className="flex-1">{label}</span>
              {showBadge && (
                <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold px-1.5 leading-none">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-2 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5">
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
            {initials}
          </div>
          <span className="text-sm text-gray-700 truncate flex-1 min-w-0">{userName}</span>
        </div>
        <ThemeToggle variant="full" />
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <LogOut size={15} className="text-gray-400 shrink-0" />
          Sair
        </button>
      </div>
    </div>
  );
}

export function Sidebar(props: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Fecha ao navegar
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  // Trava scroll quando drawer aberto
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[220px] bg-white border-r border-gray-100 flex-col h-full shrink-0">
        <SidebarContent {...props} />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 brand-gradient rounded-lg flex items-center justify-center shadow-sm">
            <Zap size={13} className="text-white fill-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm tracking-tight">ReplyFlow</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "md:hidden fixed top-0 left-0 z-50 h-full w-[260px] bg-white shadow-xl transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent {...props} onClose={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}
