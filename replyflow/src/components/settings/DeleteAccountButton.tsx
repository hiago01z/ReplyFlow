"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle } from "lucide-react";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

const CONFIRMATION_PHRASE = "EXCLUIR MINHA CONTA";

interface DeleteAccountButtonProps {
  userEmail: string;
}

export function DeleteAccountButton({ userEmail }: DeleteAccountButtonProps) {
  const router = useRouter();
  const { error: toastError } = useToast();

  const [open,    setOpen]    = useState(false);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);

  const confirmed = input === CONFIRMATION_PHRASE;

  async function handleDelete() {
    if (!confirmed) return;
    setLoading(true);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: CONFIRMATION_PHRASE }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erro desconhecido.");
      }

      // Redirecionar para login após exclusão bem-sucedida
      router.push("/login?deleted=1");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Tente novamente.";
      toastError("Erro ao excluir conta", msg);
      setLoading(false);
    }
  }

  function handleOpenChange(val: boolean) {
    if (!val) setInput("");
    setOpen(val);
  }

  return (
    <>
      {/* Zona de perigo */}
      <div className="card border-red-100 dark:border-red-900/30 p-5">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={16} className="text-red-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Zona de perigo</h2>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Ações irreversíveis. Prossiga com cuidado.
        </p>
        <div className="flex items-center justify-between gap-4 py-3 border-t border-gray-100 dark:border-white/5">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Excluir conta</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Remove permanentemente sua conta, empresa, locais, reviews e respostas. Irreversível.
            </p>
          </div>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setOpen(true)}
            className="shrink-0"
          >
            <Trash2 size={13} className="mr-1.5" />
            Excluir conta
          </Button>
        </div>
      </div>

      {/* Modal de confirmação */}
      <Modal
        open={open}
        onOpenChange={handleOpenChange}
        title="Excluir conta permanentemente"
        description={`Esta ação é irreversível. Todos os dados da conta ${userEmail} serão apagados: empresa, locais, reviews e respostas geradas.`}
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
              Serão excluídos: dados da organização, todos os locais, todos os reviews importados e todas as respostas geradas pela IA. Esta ação <strong>não pode ser desfeita</strong>.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Para confirmar, digite:{" "}
              <span className="font-mono font-bold text-red-600 dark:text-red-400">
                {CONFIRMATION_PHRASE}
              </span>
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={CONFIRMATION_PHRASE}
              autoComplete="off"
              className="w-full h-10 px-3.5 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#18181f] border border-gray-200 dark:border-[#2a2a35] rounded-lg focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/40 outline-none transition-colors placeholder:text-gray-300 dark:placeholder:text-gray-600 font-mono"
            />
          </div>
        </div>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            loading={loading}
            disabled={!confirmed}
          >
            <Trash2 size={13} className="mr-1.5" />
            Excluir permanentemente
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
