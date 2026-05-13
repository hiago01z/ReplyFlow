"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Hook de tema ─────────────────────────────────────────────────────────────

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Novos visitantes (sem preferencia salva) sempre iniciam em modo claro.
    // So usa dark se o usuario ESCOLHEU explicitamente via toggle.
    const saved = localStorage.getItem("rf-theme") as "light" | "dark" | null;
    const initial = saved ?? "light";
    applyTheme(initial);
    setTheme(initial);
  }, []);

  function applyTheme(t: "light" | "dark") {
    document.documentElement.classList.toggle("dark", t === "dark");
    localStorage.setItem("rf-theme", t);
  }

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }

  return { theme, toggle };
}

// ─── Componente botao ─────────────────────────────────────────────────────────

interface ThemeToggleProps {
  className?: string;
  /** "icon" mostra apenas o icone; "full" mostra icone + label */
  variant?: "icon" | "full";
}

export function ThemeToggle({ className, variant = "icon" }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  // Evita hydration mismatch — so renderiza apos montar no cliente
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === "dark";

  if (variant === "full") {
    return (
      <button
        onClick={toggle}
        className={cn(
          "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm",
          "text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors",
          "dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-100",
          className
        )}
        title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      >
        {isDark ? <Sun size={15} /> : <Moon size={15} />}
        <span>{isDark ? "Modo claro" : "Modo escuro"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
        "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
        "dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-white/10",
        className
      )}
      title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      aria-label="Toggle theme"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

// ─── Script inline para evitar flash de tema errado (FOUC) ────────────────────
// Injetar no <head> ANTES do CSS carregar

export const themeScript = `
(function(){
  try {
    var saved = localStorage.getItem('rf-theme');
    // Novos visitantes (sem preferencia salva) sempre em modo claro.
    // Dark apenas se o usuario escolheu explicitamente.
    if (saved === 'dark') document.documentElement.classList.add('dark');
  } catch(e) {}
})();
`;
