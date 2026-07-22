"use client";

import { useMemo, useState } from "react";
import { FiGlobe, FiZap } from "react-icons/fi";

import type { SiteContent } from "@/types/site";

type TranslationSection = "home" | "about" | "experience" | "education" | "projects" | "certifications" | "settings";

type TranslationFieldDefinition = {
  key: string;
  label: string;
  source: string;
  multiline?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getArrayIndex(collection: unknown[], segment: string) {
  const idIndex = collection.findIndex(
    (item) => isRecord(item) && item.id === segment
  );
  if (idIndex >= 0) return idIndex;

  const numericIndex = Number(segment);
  return Number.isInteger(numericIndex) && numericIndex >= 0 && numericIndex < collection.length
    ? numericIndex
    : -1;
}

function createFields(content: SiteContent, section: TranslationSection): TranslationFieldDefinition[] {
  if (section === "home") {
    return [
      { key: "home.eyebrow", label: "Etiqueta superior", source: content.home.eyebrow },
      { key: "home.title", label: "Título", source: content.home.title, multiline: true },
      { key: "home.subtitle", label: "Subtítulo", source: content.home.subtitle, multiline: true },
      { key: "home.description", label: "Descripción", source: content.home.description, multiline: true },
      { key: "home.availability", label: "Disponibilidad", source: content.home.availability },
      { key: "home.primaryCta.label", label: "CTA principal", source: content.home.primaryCta.label },
      { key: "home.secondaryCta.label", label: "CTA secundario", source: content.home.secondaryCta.label },
      ...content.home.metrics.flatMap((metric, index) => [
        { key: `home.metrics.${index}.label`, label: `Métrica ${index + 1} · etiqueta`, source: metric.label },
        { key: `home.metrics.${index}.value`, label: `Métrica ${index + 1} · valor`, source: metric.value },
      ]),
      ...content.home.highlights.map((item, index) => ({
        key: `home.highlights.${index}`,
        label: `Highlight ${index + 1}`,
        source: item,
      })),
    ];
  }

  if (section === "about") {
    return [
      { key: "site.name", label: "Nombre", source: content.site.name },
      { key: "site.role", label: "Rol", source: content.site.role },
      { key: "contact.location", label: "Ubicación de contacto", source: content.contact.location },
      { key: "about.headline", label: "Titular", source: content.about.headline, multiline: true },
      ...content.about.summary.map((item, index) => ({ key: `about.summary.${index}`, label: `Resumen ${index + 1}`, source: item, multiline: true })),
      ...content.about.skillset.map((item, index) => ({ key: `about.skillset.${index}`, label: `Tech stack ${index + 1}`, source: item })),
      ...content.about.toolset.map((item, index) => ({ key: `about.toolset.${index}`, label: `Tool ${index + 1}`, source: item })),
      ...content.about.focusAreas.map((item, index) => ({ key: `about.focusAreas.${index}`, label: `Área de enfoque ${index + 1}`, source: item })),
    ];
  }

  if (section === "experience" || section === "education") {
    const collectionKey = section === "experience" ? "workExperience" : "education";
    const entries = content[collectionKey];

    return entries.flatMap((entry) => [
      { key: `${collectionKey}.${entry.id}.title`, label: `${entry.title} · título`, source: entry.title },
      { key: `${collectionKey}.${entry.id}.organization`, label: `${entry.title} · organización`, source: entry.organization },
      { key: `${collectionKey}.${entry.id}.location`, label: `${entry.title} · ubicación`, source: entry.location },
      { key: `${collectionKey}.${entry.id}.startDate`, label: `${entry.title} · fecha de inicio`, source: entry.startDate },
      { key: `${collectionKey}.${entry.id}.endDate`, label: `${entry.title} · fecha de fin`, source: entry.endDate },
      { key: `${collectionKey}.${entry.id}.description`, label: `${entry.title} · descripción`, source: entry.description, multiline: true },
      ...entry.references.map((reference, index) => ({
        key: `${collectionKey}.${entry.id}.references.${index}.label`,
        label: `${entry.title} · referencia ${index + 1}`,
        source: reference.label,
      })),
    ]);
  }

  if (section === "projects") {
    return content.projects.flatMap((project) => [
      { key: `projects.${project.id}.title`, label: `${project.title} · título`, source: project.title },
      { key: `projects.${project.id}.description`, label: `${project.title} · descripción`, source: project.description, multiline: true },
      ...project.stack.map((item, index) => ({ key: `projects.${project.id}.stack.${index}`, label: `${project.title} · stack ${index + 1}`, source: item })),
    ]);
  }

  if (section === "certifications") {
    return content.certifications.flatMap((certification) => [
      { key: `certifications.${certification.id}.title`, label: `${certification.title} · título`, source: certification.title },
      { key: `certifications.${certification.id}.issuer`, label: `${certification.title} · emisor`, source: certification.issuer },
      { key: `certifications.${certification.id}.issuedAt`, label: `${certification.title} · fecha`, source: certification.issuedAt ?? "" },
      { key: `certifications.${certification.id}.description`, label: `${certification.title} · descripción`, source: certification.description, multiline: true },
    ]);
  }

  return [
    { key: "resume.fullName", label: "Currículum · nombre completo", source: content.resume.fullName },
    { key: "resume.title", label: "Currículum · título", source: content.resume.title },
    { key: "resume.description", label: "Currículum · descripción", source: content.resume.description, multiline: true },
    { key: "resume.previewTitle", label: "Vista del CV · título", source: content.resume.previewTitle },
    { key: "resume.previewText", label: "Vista del CV · descripción", source: content.resume.previewText, multiline: true },
    { key: "resume.openLabel", label: "Botón abrir CV", source: content.resume.openLabel },
    { key: "resume.downloadLabel", label: "Botón descargar CV", source: content.resume.downloadLabel },
    ...content.resume.softSkills.map((item, index) => ({ key: `resume.softSkills.${index}`, label: `Habilidad blanda ${index + 1}`, source: item })),
    ...content.resume.languages.map((item, index) => ({ key: `resume.languages.${index}`, label: `Idioma ${index + 1}`, source: item })),
    ...content.socials.map((social, index) => ({ key: `socials.${index}.label`, label: `Red social ${index + 1}`, source: social.label })),
  ];
}

export function TranslationEditor({
  content,
  section,
  onChange,
}: {
  content: SiteContent;
  section: TranslationSection;
  onChange: (content: SiteContent) => void;
}) {
  const fields = useMemo(() => createFields(content, section), [content, section]);
  const [translatingKey, setTranslatingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateTranslation(key: string, value: string) {
    onChange({
      ...content,
      translations: {
        ...content.translations,
        es: { ...content.translations.es, [key]: value },
      },
    });
  }

  function updateEnglishSource(key: string, value: string) {
    const nextContent = structuredClone(content) as SiteContent;
    const segments = key.split(".");
    let current: unknown = nextContent;
    setError(null);

    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index];
      const last = index === segments.length - 1;

      if (Array.isArray(current)) {
        const itemIndex = getArrayIndex(current, segment);
        if (itemIndex < 0) return;
        if (last) {
          current[itemIndex] = value;
          onChange(nextContent);
          return;
        }
        current = current[itemIndex];
        continue;
      }

      if (!isRecord(current)) return;
      if (last) {
        current[segment] = value;
        onChange(nextContent);
        return;
      }
      if (!(segment in current)) return;
      current = current[segment];
    }
  }

  async function suggestTranslation(field: TranslationFieldDefinition) {
    if (!field.source.trim()) return;
    setTranslatingKey(field.key);
    setError(null);

    try {
      const response = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: field.source,
          context: field.label.split("·").at(-1)?.trim() || "contenido de portfolio",
        }),
      });
      const data = (await response.json()) as { translation?: string; error?: string };
      if (!response.ok || !data.translation) throw new Error(data.error ?? "No se pudo sugerir la traducción.");
      updateTranslation(field.key, data.translation);
    } catch (translationError) {
      setError(translationError instanceof Error ? translationError.message : "No se pudo sugerir la traducción.");
    } finally {
      setTranslatingKey(null);
    }
  }

  return (
    <section className="mt-10 rounded-[30px] border border-cyan-400/20 bg-cyan-500/[0.04] p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <span className="rounded-2xl bg-cyan-400/10 p-3 text-xl text-cyan-200"><FiGlobe /></span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Traducción · Español</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">Versión en español</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Edita directamente el contenido principal en inglés y completa la versión en español manualmente o con una sugerencia de Gemini.
          </p>
        </div>
      </div>

      {error && <div className="mt-5 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div>}

      {fields.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-white/10 p-5 text-sm text-slate-500">Añade contenido en inglés para habilitar sus traducciones.</p>
      ) : (
        <div className="mt-7 space-y-4">
          {fields.map((field) => {
            const Input = field.multiline ? "textarea" : "input";
            const translating = translatingKey === field.key;

            return (
              <div key={field.key} className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/30 p-4 xl:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">English · {field.label}</span>
                  <Input
                    value={field.source}
                    onChange={(event) => updateEnglishSource(field.key, event.target.value)}
                    rows={field.multiline ? 4 : undefined}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-cyan-400/50"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                    <span>Español · {field.label}</span>
                    <button
                      type="button"
                      onClick={() => void suggestTranslation(field)}
                      disabled={!field.source.trim() || translatingKey !== null}
                      className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1.5 normal-case tracking-normal text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                      title="Sugerir traducción con IA"
                    >
                      <FiZap /> {translating ? "Traduciendo..." : "Sugerir con IA"}
                    </button>
                  </span>
                  <Input
                    value={content.translations.es[field.key] ?? ""}
                    onChange={(event) => updateTranslation(field.key, event.target.value)}
                    rows={field.multiline ? 4 : undefined}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-cyan-400/50"
                  />
                </label>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
