"use client";

import { FiEdit3, FiRefreshCw, FiTrash2 } from "react-icons/fi";

import type {
  GeneratedResume,
  GeneratedResumeEducation,
  GeneratedResumeExperience,
} from "@/types/resume";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-950/65 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[var(--color-accent)]";
const labelClass = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className={labelClass}>{label}</span>{children}</label>;
}

function lineValues(value: string) {
  return value.split("\n");
}

export function ResumeDraftEditor({
  draft,
  onChange,
  onRender,
  rendering,
}: {
  draft: GeneratedResume;
  onChange: (draft: GeneratedResume) => void;
  onRender: () => void;
  rendering: boolean;
}) {
  function updateExperience(index: number, patch: Partial<GeneratedResumeExperience>) {
    onChange({
      ...draft,
      experience: draft.experience.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...patch } : entry
      ),
    });
  }

  function updateEducation(index: number, patch: Partial<GeneratedResumeEducation>) {
    onChange({
      ...draft,
      education: draft.education.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...patch } : entry
      ),
    });
  }

  return (
    <div className="glass-panel border border-white/10 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-white"><FiEdit3 /> Editor rápido</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Modifica el borrador y actualiza el PDF sin volver a consultar a Gemini.</p>
        </div>
        <button
          type="button"
          onClick={onRender}
          disabled={rendering}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          <FiRefreshCw className={rendering ? "animate-spin" : ""} />
          {rendering ? "Actualizando..." : "Aplicar cambios al PDF"}
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Nombre completo">
          <input className={inputClass} value={draft.fullName} onChange={(event) => onChange({ ...draft, fullName: event.target.value })} />
        </Field>
        <Field label="Título profesional">
          <input className={inputClass} value={draft.professionalTitle} onChange={(event) => onChange({ ...draft, professionalTitle: event.target.value })} />
        </Field>
      </div>
      <Field label="Resumen profesional">
        <textarea className={`${inputClass} mt-4 min-h-32`} value={draft.summary} onChange={(event) => onChange({ ...draft, summary: event.target.value })} />
      </Field>

      <details className="mt-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
        <summary className="cursor-pointer text-sm font-semibold text-white">Datos de contacto</summary>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {([
            ["location", "Ubicación"], ["phone", "Teléfono"], ["email", "Correo"],
            ["portfolioUrl", "Portfolio"], ["linkedinUrl", "LinkedIn"], ["githubUrl", "GitHub"],
          ] as const).map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                className={inputClass}
                value={draft.contact[key]}
                onChange={(event) => onChange({
                  ...draft,
                  contact: { ...draft.contact, [key]: event.target.value },
                })}
              />
            </Field>
          ))}
        </div>
      </details>

      {draft.experience.length > 0 && (
        <details open className="mt-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <summary className="cursor-pointer text-sm font-semibold text-white">Experiencia laboral · {draft.experience.length}</summary>
          <div className="mt-4 space-y-4">
            {draft.experience.map((entry, index) => (
              <details key={`${entry.organization}-${index}`} className="rounded-xl border border-white/10 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-slate-200">{entry.organization || entry.title}</summary>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field label="Cargo"><input className={inputClass} value={entry.title} onChange={(event) => updateExperience(index, { title: event.target.value })} /></Field>
                  <Field label="Empresa"><input className={inputClass} value={entry.organization} onChange={(event) => updateExperience(index, { organization: event.target.value })} /></Field>
                  <Field label="Ubicación"><input className={inputClass} value={entry.location} onChange={(event) => updateExperience(index, { location: event.target.value })} /></Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Inicio"><input className={inputClass} value={entry.startDate} onChange={(event) => updateExperience(index, { startDate: event.target.value })} /></Field>
                    <Field label="Fin"><input className={inputClass} value={entry.endDate} onChange={(event) => updateExperience(index, { endDate: event.target.value })} /></Field>
                  </div>
                </div>
                <Field label="Descripción"><textarea className={`${inputClass} mt-3 min-h-32`} value={entry.summary} onChange={(event) => updateExperience(index, { summary: event.target.value })} /></Field>
                <Field label="Logros · uno por línea"><textarea className={`${inputClass} mt-3 min-h-24`} value={entry.highlights.join("\n")} onChange={(event) => updateExperience(index, { highlights: lineValues(event.target.value) })} /></Field>
              </details>
            ))}
          </div>
        </details>
      )}

      {draft.education.length > 0 && (
        <details className="mt-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <summary className="cursor-pointer text-sm font-semibold text-white">Educación · {draft.education.length}</summary>
          <div className="mt-4 space-y-4">
            {draft.education.map((entry, index) => (
              <div key={`${entry.institution}-${index}`} className="rounded-xl border border-white/10 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Título"><input className={inputClass} value={entry.title} onChange={(event) => updateEducation(index, { title: event.target.value })} /></Field>
                  <Field label="Institución"><input className={inputClass} value={entry.institution} onChange={(event) => updateEducation(index, { institution: event.target.value })} /></Field>
                  <Field label="Ubicación"><input className={inputClass} value={entry.location} onChange={(event) => updateEducation(index, { location: event.target.value })} /></Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Inicio"><input className={inputClass} value={entry.startDate} onChange={(event) => updateEducation(index, { startDate: event.target.value })} /></Field>
                    <Field label="Fin"><input className={inputClass} value={entry.endDate} onChange={(event) => updateEducation(index, { endDate: event.target.value })} /></Field>
                  </div>
                </div>
                <Field label="Descripción"><textarea className={`${inputClass} mt-3 min-h-24`} value={entry.description} onChange={(event) => updateEducation(index, { description: event.target.value })} /></Field>
              </div>
            ))}
          </div>
        </details>
      )}

      <details className="mt-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
        <summary className="cursor-pointer text-sm font-semibold text-white">Habilidades</summary>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {([
            ["technical", "Técnicas"], ["soft", "Blandas"], ["languages", "Idiomas"],
          ] as const).map(([key, label]) => (
            <Field key={key} label={`${label} · una por línea`}>
              <textarea
                className={`${inputClass} min-h-28`}
                value={draft.skills[key].join("\n")}
                onChange={(event) => onChange({
                  ...draft,
                  skills: { ...draft.skills, [key]: lineValues(event.target.value) },
                })}
              />
            </Field>
          ))}
        </div>
      </details>

      {draft.skills.certifications.length > 0 && (
        <details className="mt-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <summary className="cursor-pointer text-sm font-semibold text-white">Certificaciones · {draft.skills.certifications.length}</summary>
          <div className="mt-4 space-y-3">
            {draft.skills.certifications.map((certification, index) => (
              <div key={`${certification.title}-${index}`} className="grid gap-3 rounded-xl border border-white/10 p-3 sm:grid-cols-2 xl:grid-cols-[1.2fr_0.8fr_0.55fr_1.2fr_auto] xl:items-end">
                <Field label="Título"><input className={inputClass} value={certification.title} onChange={(event) => onChange({ ...draft, skills: { ...draft.skills, certifications: draft.skills.certifications.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item) } })} /></Field>
                <Field label="Emisor"><input className={inputClass} value={certification.issuer} onChange={(event) => onChange({ ...draft, skills: { ...draft.skills, certifications: draft.skills.certifications.map((item, itemIndex) => itemIndex === index ? { ...item, issuer: event.target.value } : item) } })} /></Field>
                <Field label="Fecha"><input className={inputClass} value={certification.issuedAt} onChange={(event) => onChange({ ...draft, skills: { ...draft.skills, certifications: draft.skills.certifications.map((item, itemIndex) => itemIndex === index ? { ...item, issuedAt: event.target.value } : item) } })} /></Field>
                <Field label="URL de verificación"><input className={inputClass} value={certification.verificationUrl} onChange={(event) => onChange({ ...draft, skills: { ...draft.skills, certifications: draft.skills.certifications.map((item, itemIndex) => itemIndex === index ? { ...item, verificationUrl: event.target.value } : item) } })} /></Field>
                <button
                  type="button"
                  onClick={() => onChange({ ...draft, skills: { ...draft.skills, certifications: draft.skills.certifications.filter((_, itemIndex) => itemIndex !== index) } })}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-400/30 text-rose-200 transition hover:bg-rose-500/10"
                  aria-label={`Eliminar ${certification.title}`}
                ><FiTrash2 /></button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
