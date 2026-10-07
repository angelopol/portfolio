"use client";

import { useEffect, useRef, useState } from "react";
import { FiMessageCircle, FiSend, FiX } from "react-icons/fi";
import {
  applyAssistantChanges,
  type AssistantChange,
  type ChatMessage,
} from "@/lib/assistant-changes";
import type { SiteContent } from "@/types/site";
import type { SiteLanguage } from "@/lib/i18n";

export function PortfolioAssistant({
  content,
  onChange,
  language = "es",
  embedded = false,
}: {
  content?: SiteContent;
  onChange?: (content: SiteContent) => void;
  language?: SiteLanguage;
  embedded?: boolean;
}) {
  const editing = Boolean(content && onChange);
  const es = language === "es";
  const [open, setOpen] = useState(embedded);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [proposal, setProposal] = useState<{
    changes: AssistantChange[];
    base: string;
  } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages, busy, proposal]);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);
  function close() {
    setOpen(false);
    toggleRef.current?.focus();
  }
  async function send() {
    if (!input.trim() || busy || proposal) return;
    const next: ChatMessage[] = [
      ...messages,
      { role: "user", text: input.trim() },
    ];
    const base = content ? JSON.stringify(content) : "";
    setMessages(next);
    setInput("");
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: editing ? "admin" : "public",
          messages: next
            .slice(-19)
            .map((message) => ({
              ...message,
              text: message.text.slice(0, 4000),
            })),
          ...(editing ? { content } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "No se pudo consultar el asistente.");
      setMessages([...next, { role: "assistant", text: data.reply }]);
      if (editing && data.changes?.length)
        setProposal({ changes: data.changes, base });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error de conexión.");
      setInput(next[next.length - 1].text);
      setMessages(next.slice(0, -1));
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }
  function apply() {
    if (!proposal || !content || !onChange) return;
    if (JSON.stringify(content) !== proposal.base) {
      setError(
        "El contenido cambió desde la propuesta. Descártala y solicita una nueva para conservar tus cambios.",
      );
      return;
    }
    try {
      onChange(applyAssistantChanges(content, proposal.changes));
      setProposal(null);
      setMessages((current) =>
        current.map((message, index) =>
          index === current.length - 1
            ? {
                ...message,
                text: `${message.text}\n\nCambios aplicados al editor. El panel los guardará automáticamente; revisa el indicador de guardado.`,
              }
            : message,
        ),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Cambios inválidos.");
    }
  }
  return (
    <>
      {!embedded && (
        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls="portfolio-assistant"
          aria-label={es ? "Asistente del portafolio" : "Portfolio assistant"}
          className="fixed bottom-24 right-4 z-[100] flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-xl sm:bottom-6 sm:right-6"
        >
          <FiMessageCircle className="h-5 w-5" />
        </button>
      )}
      {open && (
        <section
          id="portfolio-assistant"
          aria-label={es ? "Asistente IA" : "AI assistant"}
          onKeyDown={(event) => {
            if (!embedded && event.key === "Escape") close();
          }}
          className={`${embedded ? "h-[min(750px,85dvh)] w-full" : "fixed bottom-40 right-3 z-[101] h-[min(650px,calc(100dvh-12rem))] w-[min(420px,calc(100vw-1.5rem))] sm:bottom-24 sm:right-6"} flex min-w-0 flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-2xl`}
        >
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] p-4">
            <div>
              <h2 className="font-semibold">
                {es ? "Asistente del portafolio" : "Portfolio assistant"}
              </h2>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {editing
                  ? "Consulta, añade datos y modifica parámetros."
                  : es
                    ? "Pregunta sobre experiencia, proyectos y habilidades."
                    : "Ask about experience, projects and skills."}
              </p>
            </div>
            {!embedded && (
              <button
                type="button"
                onClick={close}
                aria-label={es ? "Cerrar asistente" : "Close assistant"}
                className="p-2"
              >
                <FiX />
              </button>
            )}
          </header>
          <div
            className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4"
            role="log"
            aria-live="polite"
          >
            {!messages.length && (
              <p className="text-sm leading-6 text-[var(--color-muted)]">
                {editing
                  ? "Prueba: “Añade Docker a mis herramientas” o “¿Qué podría mejorar en mi descripción?” Revisa cada propuesta antes de aplicarla."
                  : es
                    ? "¿Qué te gustaría conocer del portafolio?"
                    : "What would you like to know about this portfolio?"}
              </p>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`rounded-2xl p-3 text-sm leading-6 ${message.role === "user" ? "ml-5 bg-[var(--color-ghost-strong)]" : "mr-2 bg-[var(--color-ghost)]"}`}
              >
                <p className="mb-1 text-xs font-semibold text-[var(--color-accent-soft)]">
                  {message.role === "user" ? (es ? "Tú" : "You") : "IA"}
                </p>
                <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                  {message.text}
                </p>
              </div>
            ))}
            {busy && (
              <p className="text-sm text-[var(--color-muted)]">
                {es ? "Pensando…" : "Thinking…"}
              </p>
            )}
            {proposal && (
              <div className="rounded-2xl border border-[var(--color-border)] p-3">
                <p className="mb-3 text-sm font-semibold">
                  Revisar cambios ({proposal.changes.length})
                </p>
                {proposal.changes.map((change, index) => (
                  <details key={index} className="mb-2 text-xs">
                    <summary className="cursor-pointer [overflow-wrap:anywhere]">
                      {change.path}
                    </summary>
                    <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap [overflow-wrap:anywhere]">
                      {JSON.stringify(change.value, null, 2)}
                    </pre>
                  </details>
                ))}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={apply}
                    className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm text-white"
                  >
                    Aplicar cambios
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProposal(null);
                      setError("");
                    }}
                    className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          {error && (
            <p role="alert" className="px-4 py-2 text-sm text-rose-400">
              {error}
            </p>
          )}
          <form
            className="flex shrink-0 items-end gap-2 border-t border-[var(--color-border)] p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={4000}
              rows={2}
              disabled={busy || Boolean(proposal)}
              aria-label={es ? "Mensaje al asistente" : "Message to assistant"}
              placeholder={es ? "Escribe tu consulta…" : "Write your question…"}
              className="min-w-0 flex-1 resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            />
            <button
              type="submit"
              disabled={busy || Boolean(proposal) || !input.trim()}
              aria-label={es ? "Enviar" : "Send"}
              className="rounded-xl bg-[var(--color-accent)] p-3 text-white disabled:opacity-40"
            >
              <FiSend />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
