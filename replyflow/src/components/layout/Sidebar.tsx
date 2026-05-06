"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Plan } from "@/types";

interface SidebarProps {
  orgName: string;
  userName: string;
  plan: Plan;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Visão Geral", icon: "📊" },
  { href: "/reviews", label: "Reviews", icon: "⭐" },
  { href: "/locations", label: "Meus Locais", icon: "📍" },
  { href: "/billing", label: "Plano & Billing", icon: "💳" },
  { href: "/settings", label: "Configurações", icon: "⚙️" },
];

const PLAN_BADGE: Record<Plan, { label: string; color: string }> = {
  free: { label: "Free", color: "bg-gray-100 text-gray-600" },
  starter: { label: "Starter", color: "bg-blue-100 text-blue-700" },
  pro: { label: "Pro", color: "bg-indigo-100 text-indigo-700" },
  agency: { label: "Agência", color: "bg-purple-100 text-purple-700" },
};

export function Sidebar({ orgName, userName, plan }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const badge = PLAN_BADGE[plan];

  return (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <span className="text-lg font-bold text-indigo-600">ReplyFlow</span>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-500 truncate">{orgName}</span>
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full shrink-0 ${badge.color}`}>
            {badge.label}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
            {(userName[0] ?? "U").toUpperCase()}
          </div>
          <span className="text-sm text-gray-700 truncate">{userName}</span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
