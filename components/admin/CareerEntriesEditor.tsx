"use client";

import { FiBookOpen, FiBriefcase, FiExternalLink, FiPlus, FiTrash2 } from "react-icons/fi";

import type { CareerEntry, SiteContent } from "@/types/site";

type CareerKind = "workExperience" | "education";

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-slate-950/65 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[var(--color-accent)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</span>
      {children}
    </label>
  );
}

export function CareerEntriesEditor({
  content,
  kind,
  onChange,
}: {
  content: SiteContent;
  kind: CareerKind;
  onChange: (content: SiteContent) => void;
}) {
  const entries = content[kind];
  const isExperience = kind === "workExperience";
  const Icon = isExperience ? FiBriefcase : FiBookOpen;

  function setEntries(nextEntries: CareerEntry[]) {
    onChange({ ...content, [kind]: nextEntries });
  }

  function updateEntry(id: string, patch: Partial<CareerEntry>) {
    setEntries(entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }

  function addEntry() {
    setEntries([
      ...entries,
      {
        id: `${isExperience ? "experience" : "education"}-${Date.now()}`,
        title: isExperience ? "New role" : "New program",
        organization: "",
        location: "",
        startDate: "",
        endDate: "",
        description: "",
        references: [],
      },
    ]);
  }

  return (
    <section>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-accent-soft)]">
            Trayectoria profesional
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {isExperience ? "Experiencia laboral" : "Educación profesional"}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
            {isExperience
              ? "Documenta tus cargos, empresas, fechas y referencias profesionales."
              : "Registra estudios, programas, instituciones y enlaces que respalden tu preparación."}
          </p>
        </div>
        <button
          type="button"
          onClick={addEntry}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white"
        >
          <FiPlus /> {isExperience ? "Nueva experiencia" : "Nueva educación"}
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="glass-panel border border-dashed border-white/15 p-12 text-center">
          <Icon className="mx-auto text-4xl text-[var(--color-accent-soft)]" />
          <h2 className="mt-4 font-display text-xl font-semibold">
            {isExperience ? "Aún no hay experiencias" : "Aún no hay estudios"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">Añade el primer registro para mostrar este módulo en la landing.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {entries.map((entry, entryIndex) => (
            <details key={entry.id} open={entryIndex === 0} className="glass-panel border border-white/10 p-6">
              <summary className="flex cursor-pointer list-none items-center gap-4">
                <span className="rounded-2xl bg-white/5 p-4 text-[var(--color-accent-soft)]"><Icon /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-xl font-semibold">{entry.title}</span>
                  <span className="mt-1 block truncate text-sm text-slate-500">{entry.organization || "Organización pendiente"}</span>
                </span>
                <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Editar</span>
              </summary>

              <div className="mt-6 grid gap-5 border-t border-white/10 pt-6 lg:grid-cols-2">
                <Field label={isExperience ? "Título del cargo o experiencia" : "Título o programa"}>
                  <input className={inputClass} value={entry.title} onChange={(event) => updateEntry(entry.id, { title: event.target.value })} />
                </Field>
                <Field label={isExperience ? "Empresa u organización" : "Institución educativa"}>
                  <input className={inputClass} value={entry.organization} onChange={(event) => updateEntry(entry.id, { organization: event.target.value })} />
                </Field>
                <Field label="Ubicación">
                  <input className={inputClass} value={entry.location} onChange={(event) => updateEntry(entry.id, { location: event.target.value })} placeholder="Ciudad, País o Remoto" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Fecha de inicio">
                    <input className={inputClass} value={entry.startDate} onChange={(event) => updateEntry(entry.id, { startDate: event.target.value })} placeholder="Enero 2024" />
                  </Field>
                  <Field label="Fecha de fin">
                    <input className={inputClass} value={entry.endDate} onChange={(event) => updateEntry(entry.id, { endDate: event.target.value })} placeholder="Actualidad" />
                  </Field>
                </div>
                <div className="lg:col-span-2">
                  <Field label="Descripción">
                    <textarea className={`${inputClass} min-h-32`} value={entry.description} onChange={(event) => updateEntry(entry.id, { description: event.target.value })} />
                  </Field>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-5 lg:col-span-2">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-display text-lg font-semibold">Enlaces de referencia</h3>
                      <p className="mt-1 text-xs text-slate-500">Sitio de la empresa, constancia, publicación, programa académico u otra evidencia.</p>
                    </div>
                    <button type="button" onClick={() => updateEntry(entry.id, { references: [...entry.references, { label: "Reference", url: "https://" }] })} className="rounded-xl border border-white/10 p-2 text-white transition hover:bg-white/10" aria-label="Añadir enlace"><FiPlus /></button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {entry.references.map((reference, referenceIndex) => (
                      <div key={`${entry.id}-reference-${referenceIndex}`} className="grid gap-3 sm:grid-cols-[0.6fr_1fr_auto]">
                        <input className={inputClass} value={reference.label} onChange={(event) => updateEntry(entry.id, { references: entry.references.map((item, index) => index === referenceIndex ? { ...item, label: event.target.value } : item) })} placeholder="Etiqueta" />
                        <div className="relative"><FiExternalLink className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" /><input type="url" className={`${inputClass} pl-11`} value={reference.url} onChange={(event) => updateEntry(entry.id, { references: entry.references.map((item, index) => index === referenceIndex ? { ...item, url: event.target.value } : item) })} placeholder="https://" /></div>
                        <button type="button" onClick={() => updateEntry(entry.id, { references: entry.references.filter((_, index) => index !== referenceIndex) })} className="px-3 text-rose-300" aria-label="Eliminar enlace"><FiTrash2 /></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end lg:col-span-2">
                  <button type="button" onClick={() => { if (window.confirm(`¿Eliminar ${entry.title}?`)) setEntries(entries.filter((item) => item.id !== entry.id)); }} className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/30 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/10"><FiTrash2 /> Eliminar registro</button>
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
