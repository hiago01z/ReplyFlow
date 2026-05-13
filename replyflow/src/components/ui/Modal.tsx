"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Largura máxima do modal (default: "md") */
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  /** Esconde o botão X de fechar */
  hideClose?: boolean;
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

// ─── Tamanhos ────────────────────────────────────────────────────────────────

const SIZE_CLASSES: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

// ─── Componentes públicos ─────────────────────────────────────────────────────

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  size = "md",
  children,
  hideClose = false,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm",
            "data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out"
          )}
        />

        {/* Content */}
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "w-[calc(100vw-2rem)]",
            SIZE_CLASSES[size],
            "bg-white rounded-2xl shadow-2xl shadow-black/10 border border-gray-100",
            "focus:outline-none",
            "data-[state=open]:animate-slide-up data-[state=closed]:animate-fade-out"
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 p-6 pb-4">
            <div>
              <Dialog.Title className="text-base font-semibold text-gray-900 leading-tight">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-sm text-gray-500 mt-1 leading-relaxed">
                  {description}
                </Dialog.Description>
              )}
            </div>
            {!hideClose && (
              <Dialog.Close asChild>
                <button
                  className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors mt-0.5"
                  aria-label="Close"
                >
                  <X size={15} />
                </button>
              </Dialog.Close>
            )}
          </div>

          {/* Body */}
          <div className="px-6 pb-2">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Footer padronizado com botões alinhados à direita */
export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 p-6 pt-4 border-t border-gray-100 mt-4",
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── Modal de confirmação reutilizável ───────────────────────────────────────

interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  loading = false,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} size="sm">
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
      <ModalFooter>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onOpenChange(false)}
          disabled={loading}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={variant}
          size="sm"
          loading={loading}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
