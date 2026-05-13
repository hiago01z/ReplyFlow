"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { AddManualReviewModal } from "@/components/reviews/AddManualReviewModal";

interface LocationData {
  id: string;
  name: string;
  tripadvisor_url?: string | null;
  reclame_aqui_url?: string | null;
  booking_url?: string | null;
}

interface Props {
  platform: "tripadvisor" | "reclame_aqui" | "booking";
  locations: LocationData[];
}

export function AddManualReviewButton({ platform, locations }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(locations[0]?.id ?? "");

  const selected = locations.find((l) => l.id === selectedId) ?? locations[0];

  if (!selected) return null;

  const label =
    platform === "tripadvisor" ? "Adicionar avaliação" :
    platform === "booking"     ? "Adicionar avaliação" :
    "Adicionar reclamação";
  const colorClass =
    platform === "tripadvisor" ? "bg-[#00AF87] hover:bg-[#009975]" :
    platform === "booking"     ? "bg-[#003580] hover:bg-[#002a66]" :
    "bg-[#E8281C] hover:bg-[#c51f15]";

  return (
    <>
      <div className="flex items-center gap-2">
        {locations.length > 1 && (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`inline-flex items-center gap-1.5 text-sm font-semibold text-white ${colorClass} px-3 py-2 rounded-lg transition-colors`}
        >
          <Plus size={14} />
          {label}
        </button>
      </div>

      {open && (
        <AddManualReviewModal
          locationId={selected.id}
          platform={platform}
          tripadvisorUrl={selected.tripadvisor_url}
          reclamaAquiUrl={selected.reclame_aqui_url}
          bookingUrl={selected.booking_url}
          onClose={() => setOpen(false)}
          onAdded={() => { setOpen(false); router.refresh(); }}
        />
      )}
    </>
  );
}
