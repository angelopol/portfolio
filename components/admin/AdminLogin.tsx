"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { FiLock, FiLogIn } from "react-icons/fi";

export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ secret }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? "No fue posible iniciar sesión.");
        return;
      }

      setSecret("");
      router.refresh();
    } catch {
      setError("No fue posible conectar con el servidor.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)] px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">
        <div className="glass-panel w-full max-w-xl border border-white/10 p-8 shadow-glow sm:p-10">
          <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent)]/20 text-2xl text-[var(--color-accent-soft)]">
            <FiLock />
          </div>

          <p className="section-label">Control Room</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-white">
            Panel privado para editar tu portafolio
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Desde aquí puedes actualizar el contenido del home, about, proyectos y la
            paleta visual del sitio sin tocar componentes.
          </p>

          {!configured && (
            <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
              Primero define <strong>PORTFOLIO_ADMIN_SECRET</strong> en tu archivo
              .env.local usando el ejemplo disponible en .env.example.
            </div>
          )}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="secret">
                Clave secreta
              </label>
              <input
                id="secret"
                type="password"
                autoComplete="current-password"
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                placeholder="Ingresa la clave del panel"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0 transition placeholder:text-slate-500 focus:border-[var(--color-accent)]"
                disabled={!configured || submitting}
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!configured || submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiLogIn />
              {submitting ? "Validando acceso..." : "Entrar al panel"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
