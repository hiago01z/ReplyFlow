"use client";

import { useState } from "react";
import { FileText, ChevronDown } from "lucide-react";

/**
 * Sprint 22 — Monthly PDF report button (Pro/Agency only).
 * Opens /api/reports/monthly in a new tab for in-browser printing / Save as PDF.
 */
export function MonthlyReportButton() {
  const [open, setOpen] = useState(false);

  // Build list of last 6 months
  const months: { label: string; value: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = d.toISOString().slice(0, 7); // YYYY-MM
    const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    months.push({ label: label.charAt(0).toUpperCase() + label.slice(1), value });
  }

  function openReport(month: string) {
    window.open(`/api/reports/monthly?month=${month}`, "_blank");
    setOpen(false);
  }

  return (
    <div className="flex justify-end mb-4 relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
      >
        <FileText size={13} />
        Relatório PDF
        <ChevronDown size={12} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-[200px]">
            {months.map((m) => (
              <button
                key={m.value}
                onClick={() => openReport(m.value)}
                className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
              >
                {m.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
