"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Star,
  MapPin,
  CreditCard,
  Settings,
  LogOut,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Plan } from "@/types";

interface SidebarProps {
  orgName: string;
  userName: string;
  plan: Plan;
}

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Visão Geral",    Icon: LayoutDashboard },
  { href: "/reviews",    label: "Reviews",         Icon: Star },
  { href: "/locations",  label: "Meus Locais",     Icon: MapPin },
  { href: "/billing",    label: "Plano & Billing", Icon: CreditCard },
  { href: "/settings",   label: "Configurações",   Icon: Settings },
];

const PLAN_BADGE: Record<Plan, { label: string; cls: string }> = {
  free:    { label: "Free",    cls: "bg-gray-100 text-gray-500" },
  starter: { label: "Starter", cls: "bg-blue-50 text-blue-600" },
  pro:     { label: "Pro",     cls: "bg-indigo-50 text-indigo-600" },
  agency:  { label: "Agência", cls: "bg-purple-50 text-purple-600" },
};

export function Sidebar({ orgName, userName, plan }: SidebarProps) {
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
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <aside className="w-[220px] bg-white border-r border-gray-100 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 brand-gradient rounded-lg flex items-center justify-center shadow-sm shrink-0">
            <Zap size={15} className="text-white fill-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm tracking-tight">ReplyFlow</span>
        </Link>
        <div className="flex items-center gap-1.5 mt-2.5 pl-0.5">
          <span className="text-xs text-gray-500 truncate flex-1 min-w-0">{orgName}</span>
          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0", badge.cls)}>
            {badge.label}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <Icon
                size={16}
                className={cn(
                  "shrink-0",
                  isActive ? "text-indigo-600" : "text-gray-400",
                )}
              />
              {label}
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
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <LogOut size={15} className="text-gray-400 shrink-0" />
          Sair
        </button>
      </div>
    </aside>
  );
}
