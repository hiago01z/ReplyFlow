"use client";

import { useState, useRef } from "react";
import { MessageSquare, Send, CheckCircle2, Loader2 } from "lucide-react";

type Status = "idle" | "sending" | "success" | "error";

export function FeedbackSection() {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus]   = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  // honeypot ref — invisible field to catch bots
  const honeypotRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Block bots that fill the honeypot
    if (honeypotRef.current?.value) return;

    if (!message.trim()) return;

    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          message: message.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erro ao enviar");
      }

      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Erro ao enviar feedback. Tente novamente.");
    }
  }

  return (
    <section id="feedback" className="py-20 px-6 bg-gray-50 dark:bg-[#111118]">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl mb-4">
            <MessageSquare size={22} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">
            Sua opinião importa
          </p>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Deixe seu feedback
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
            Sugestão, elogio ou crítica — adoramos ouvir. Toda mensagem é lida pela nossa equipe.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-[#18181f] rounded-2xl border border-gray-100 dark:border-[#2a2a35] shadow-sm p-8">

          {status === "success" ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle2 size={40} className="text-green-500" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Feedback enviado!
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                Obrigado pelo seu retorno. Nossa equipe vai analisar em breve.
              </p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Enviar outro feedback
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>

              {/* Honeypot — must remain hidden and empty */}
              <input
                ref={honeypotRef}
                type="text"
                name="website"
                tabIndex={-1}
                aria-hidden="true"
                autoComplete="off"
                style={{ display: "none" }}
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Nome <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                    className="w-full rounded-xl border border-gray-200 dark:border-[#2a2a35] bg-gray-50 dark:bg-[#111118] text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    E-mail <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={254}
                    className="w-full rounded-xl border border-gray-200 dark:border-[#2a2a35] bg-gray-50 dark:bg-[#111118] text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition"
                  />
                  <p className="mt-1 text-[11px] text-gray-400">Para que possamos responder</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Mensagem <span className="text-red-400">*</span>
                </label>
                <p className="text-[11px] text-gray-400 mb-1.5">
                  Sugestão, elogio ou crítica — toda mensagem é bem-vinda.
                </p>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  maxLength={2000}
                  className="w-full rounded-xl border border-gray-200 dark:border-[#2a2a35] bg-gray-50 dark:bg-[#111118] text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition resize-none"
                />
                <p className="text-right text-[11px] text-gray-400 mt-1">{message.length}/2000</p>
              </div>

              {status === "error" && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending" || !message.trim()}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors"
              >
                {status === "sending" ? (
                  <><Loader2 size={15} className="animate-spin" /> Enviando...</>
                ) : (
                  <><Send size={15} /> Enviar feedback</>
                )}
              </button>

            </form>
          )}
        </div>
      </div>
    </section>
  );
}
