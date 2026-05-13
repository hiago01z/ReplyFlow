"use client";

import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface FacebookPage {
  id:    string;
  name:  string;
  token: string;
}

export default function FacebookPagesPage() {
  const params       = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const locationId = params.id;
  const expiresAt  = searchParams.get("expires_at") ?? null;

  let pages: FacebookPage[] = [];
  try {
    const raw = searchParams.get("pages");
    if (raw) pages = JSON.parse(decodeURIComponent(raw));
  } catch {
    pages = [];
  }

  async function handleSelect(page: FacebookPage) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/locations/${locationId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          facebook_page_id:           page.id,
          facebook_page_name:         page.name,
          facebook_access_token:      page.token,
          facebook_connected:         true,
          facebook_token_expires_at:  expiresAt,
        }),
      });
      if (!res.ok) throw new Error();
      router.push(`/locations/${locationId}?success=facebook_connected&page=${encodeURIComponent(page.name)}`);
    } catch {
      setError("Erro ao salvar. Tente novamente.");
      setSaving(false);
    }
  }

  if (pages.length === 0) {
    return (
      <div className="animate-fade-in max-w-xl">
        <p className="text-sm text-gray-500">Nenhuma página encontrada. Verifique se você gerencia páginas no Facebook.</p>
        <Link href={`/locations/${locationId}`} className="text-indigo-600 text-sm mt-3 inline-block">
          ← Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-xl">
      <div className="mb-8">
        <Link
          href={`/locations/${locationId}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <ChevronLeft size={15} />
          Voltar para o local
        </Link>
        <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mb-1">Facebook</p>
        <h1 className="text-2xl font-bold text-gray-900">Selecionar página</h1>
        <p className="text-sm text-gray-500 mt-1">
          Escolha qual página do Facebook conectar a este local para importar e responder avaliações.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
      )}

      <div className="space-y-2">
        {pages.map((page) => (
          <button
            key={page.id}
            type="button"
            onClick={() => handleSelect(page)}
            disabled={saving}
            className="w-full card px-4 py-3.5 flex items-center gap-3 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all text-left disabled:opacity-50"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              {/* Facebook "f" logo */}
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#1877F2]">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{page.name}</p>
              <p className="text-xs text-gray-400">ID: {page.id}</p>
            </div>
            <CheckCircle2 size={16} className="text-indigo-400 shrink-0 opacity-0 group-hover:opacity-100" />
          </button>
        ))}
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Apenas páginas que você administra aparecem aqui.
      </p>
    </div>
  );
}
