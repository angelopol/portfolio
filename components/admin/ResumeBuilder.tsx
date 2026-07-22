"use client";

import { useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiCpu, FiDownload, FiFileText, FiImage, FiRefreshCw, FiShield, FiUser } from "react-icons/fi";

import type { SiteContent } from "@/types/site";
import type { ResumeGenerationRequest, ResumeLanguage, ResumeLayout } from "@/types/resume";

const fieldClass =
  "w-full rounded-2xl border border-white/10 bg-slate-950/65 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[var(--color-accent)]";

function lines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</span>
      {children}
      {hint ? <span className="mt-2 block text-xs leading-5 text-slate-500">{hint}</span> : null}
    </label>
  );
}

function getDownloadName(disposition: string | null) {
  const match = disposition?.match(/filename="([^"]+)"/i);
  return match?.[1] || "curriculum-personalizado.pdf";
}

export function ResumeBuilder({
  content,
  onChange,
  onUploadProfileImage,
  uploadingProfileImage,
}: {
  content: SiteContent;
  onChange: (content: SiteContent) => void;
  onUploadProfileImage: (file: File) => Promise<string | null>;
  uploadingProfileImage: boolean;
}) {
  const [language, setLanguage] = useState<ResumeLanguage>("en");
  const [layout, setLayout] = useState<ResumeLayout>("ats");
  const [softSkillsInput, setSoftSkillsInput] = useState(() => content.resume.softSkills.join("\n"));
  const [languagesInput, setLanguagesInput] = useState(() => content.resume.languages.join("\n"));
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("curriculum-personalizado.pdf");
  const [usedModel, setUsedModel] = useState<string | null>(null);
  const [validation, setValidation] = useState<{
    ats: string;
    pages: string;
    compaction: string;
    certifications: string;
    imageIncluded: boolean;
    layout: ResumeLayout;
  } | null>(null);

  const readiness = useMemo(
    () => [
      { label: "Experiencias", value: content.workExperience.length },
      { label: "Estudios", value: content.education.length },
      { label: "Certificaciones", value: content.certifications.length },
      { label: "Skills", value: content.about.skillset.length + content.about.toolset.length },
      { label: "Contacto", value: [content.contact.email, content.contact.phone, content.contact.location].filter(Boolean).length },
    ],
    [content]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const nextValue = content.resume.softSkills.join("\n");
    setSoftSkillsInput((currentValue) =>
      lines(currentValue).join("\n") === nextValue ? currentValue : nextValue
    );
  }, [content.resume.softSkills]);

  useEffect(() => {
    const nextValue = content.resume.languages.join("\n");
    setLanguagesInput((currentValue) =>
      lines(currentValue).join("\n") === nextValue ? currentValue : nextValue
    );
  }, [content.resume.languages]);

  function updateResume(patch: Partial<SiteContent["resume"]>) {
    onChange({ ...content, resume: { ...content.resume, ...patch } });
  }

  function updatePortfolioUrl(value: string) {
    onChange({ ...content, contact: { ...content.contact, portfolioUrl: value } });
  }

  async function generateResume() {
    setGenerating(true);
    setError(null);
    setValidation(null);

    const request: ResumeGenerationRequest & { content: SiteContent } = {
      language,
      layout,
      profileImageUrl: profileImageUrl || undefined,
      targetRole,
      jobDescription,
      additionalInstructions,
      content,
    };

    try {
      const response = await fetch("/api/admin/resume/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "No se pudo generar el CV.");
      }

      const blob = await response.blob();
      const nextUrl = URL.createObjectURL(blob);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(nextUrl);
      setDownloadName(getDownloadName(response.headers.get("Content-Disposition")));
      setUsedModel(response.headers.get("X-Resume-Model"));
      setValidation({
        ats: response.headers.get("X-Resume-ATS") || "text-layer-passed",
        pages: response.headers.get("X-Resume-Pages") || "-",
        compaction: response.headers.get("X-Resume-Compaction") || "0",
        certifications: response.headers.get("X-Resume-Certifications") || "0",
        imageIncluded: response.headers.get("X-Resume-Image-Included") === "true",
        layout: response.headers.get("X-Resume-Layout") === "visual" ? "visual" : "ats",
      });
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "No se pudo generar el CV.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section>
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-accent-soft)]">Gemini · PDF</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">Generador de CV personalizado</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
          Gemini analiza el JSON completo del portfolio, adapta el contenido a una posición y el servidor lo convierte en un PDF clásico de máximo dos páginas.
        </p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {readiness.map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 2xl:grid-cols-[0.82fr_1.18fr]">
        <div className="space-y-6">
          <div className="glass-panel space-y-5 border border-white/10 p-6">
            <div className="flex items-center gap-3"><span className="rounded-xl bg-white/5 p-3 text-[var(--color-accent-soft)]"><FiUser /></span><div><h2 className="font-display text-xl font-semibold">Datos base del CV</h2><p className="mt-1 text-xs text-slate-500">Se guardan como parte del contenido del portfolio.</p></div></div>
            <Field label="Nombre completo"><input className={fieldClass} value={content.resume.fullName} onChange={(event) => updateResume({ fullName: event.target.value })} /></Field>
            <Field label="URL del portfolio"><input type="url" className={fieldClass} value={content.contact.portfolioUrl} onChange={(event) => updatePortfolioUrl(event.target.value)} placeholder="https://tudominio.com" /></Field>
            <Field label="Habilidades blandas · una por línea"><textarea className={`${fieldClass} min-h-36`} value={softSkillsInput} onChange={(event) => { const value = event.target.value; setSoftSkillsInput(value); updateResume({ softSkills: lines(value) }); }} /></Field>
            <Field label="Idiomas · uno por línea"><textarea className={`${fieldClass} min-h-28`} value={languagesInput} onChange={(event) => { const value = event.target.value; setLanguagesInput(value); updateResume({ languages: lines(value) }); }} /></Field>
          </div>

          <div className="glass-panel space-y-5 border border-white/10 p-6">
            <div className="flex items-center gap-3"><span className="rounded-xl bg-cyan-400/10 p-3 text-cyan-200"><FiCpu /></span><div><h2 className="font-display text-xl font-semibold">Personalización con IA</h2><p className="mt-1 text-xs text-slate-500">No se inventan experiencias ni credenciales.</p></div></div>
            <Field label="Formato del documento">
              <div className="grid gap-2 rounded-2xl border border-white/10 bg-slate-950/50 p-1.5 sm:grid-cols-2">
                <button type="button" onClick={() => setLayout("ats")} className={`rounded-xl px-4 py-3 text-left transition ${layout === "ats" ? "bg-[var(--color-accent)] text-white" : "text-slate-400 hover:bg-white/5"}`}>
                  <span className="flex items-center gap-2 text-sm font-semibold"><FiShield /> ATS estricto</span>
                  <span className="mt-1 block text-[11px] leading-4 opacity-75">Una columna, sin foto y lectura lineal.</span>
                </button>
                <button type="button" onClick={() => setLayout("visual")} className={`rounded-xl px-4 py-3 text-left transition ${layout === "visual" ? "bg-[var(--color-accent)] text-white" : "text-slate-400 hover:bg-white/5"}`}>
                  <span className="flex items-center gap-2 text-sm font-semibold"><FiImage /> Plantilla visual</span>
                  <span className="mt-1 block text-[11px] leading-4 opacity-75">Con foto y apariencia del CV original.</span>
                </button>
              </div>
              <div className={`mt-3 rounded-xl border px-3 py-2.5 text-xs leading-5 ${layout === "ats" ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100" : "border-amber-400/20 bg-amber-500/10 text-amber-100"}`}>
                {layout === "ats"
                  ? "Recomendado para portales de empleo: texto seleccionable, encabezados estándar y sin elementos que alteren el orden de lectura."
                  : "Mantiene la foto solicitada y usa texto real, pero una plantilla visual no ofrece la misma compatibilidad que el modo ATS estricto."}
              </div>
            </Field>
            {layout === "visual" ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Foto para este CV · opcional
                </p>
                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <img
                    src={profileImageUrl || content.about.profileImage}
                    alt="Foto seleccionada para el CV"
                    className="h-24 w-20 shrink-0 rounded-xl border border-white/10 bg-white/5 object-cover"
                  />
                  <div className="flex flex-1 flex-col gap-3">
                    <p className="text-xs leading-5 text-slate-500">
                      {profileImageUrl
                        ? "Se usará esta foto personalizada en la próxima generación."
                        : "Se usará la foto de perfil configurada en la landing."}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                        <FiImage />
                        {uploadingProfileImage ? "Subiendo..." : "Subir otra foto"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png"
                          className="hidden"
                          disabled={uploadingProfileImage}
                          onChange={async (event) => {
                            const input = event.currentTarget;
                            const file = input.files?.[0];
                            if (!file) return;
                            if (!["image/jpeg", "image/png"].includes(file.type)) {
                              setError("La foto debe estar en formato JPG o PNG.");
                              input.value = "";
                              return;
                            }
                            if (file.size > 1_500_000) {
                              setError("La foto para el CV no puede superar 1.5 MB.");
                              input.value = "";
                              return;
                            }
                            setError(null);
                            const url = await onUploadProfileImage(file);
                            if (url) setProfileImageUrl(url);
                            input.value = "";
                          }}
                        />
                      </label>
                      {profileImageUrl ? (
                        <button
                          type="button"
                          onClick={() => setProfileImageUrl("")}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                        >
                          <FiRefreshCw /> Usar foto del portfolio
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            <Field label="Idioma del documento">
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-slate-950/50 p-1.5">
                {(["es", "en"] as const).map((option) => <button key={option} type="button" onClick={() => setLanguage(option)} className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${language === option ? "bg-[var(--color-accent)] text-white" : "text-slate-400 hover:bg-white/5"}`}>{option === "es" ? "Español" : "English"}</button>)}
              </div>
            </Field>
            <Field label="Cargo objetivo" hint="Ejemplo: Senior Backend Developer"><input className={fieldClass} value={targetRole} onChange={(event) => setTargetRole(event.target.value)} /></Field>
            <Field label="Oferta o descripción del empleo" hint="Gemini priorizará los hechos y tecnologías relevantes sin inventar información."><textarea className={`${fieldClass} min-h-44`} value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} placeholder="Pega aquí la descripción de la vacante..." /></Field>
            <Field label="Instrucciones adicionales"><textarea className={`${fieldClass} min-h-28`} value={additionalInstructions} onChange={(event) => setAdditionalInstructions(event.target.value)} placeholder="Ej. resaltar experiencia con AWS y arquitectura backend" /></Field>

            {error ? <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-100">{error}</div> : null}

            {validation ? (
              <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                <p className="flex items-center gap-2 font-semibold"><FiCheckCircle /> {validation.ats === "strict-passed" ? "Validación ATS estricta superada" : "Capa de texto y estructura verificadas"}</p>
                <p className="mt-1 text-xs leading-5 text-emerald-100/75">{validation.pages} página(s) · {validation.certifications} certificado(s) incluidos · nivel de ajuste {validation.compaction}{validation.imageIncluded ? " · foto incluida" : " · sin foto"}</p>
              </div>
            ) : null}

            <button type="button" onClick={() => void generateResume()} disabled={generating} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-5 py-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60">
              {generating ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Gemini está redactando y maquetando...</> : previewUrl ? <><FiRefreshCw /> Generar una nueva versión</> : <><FiFileText /> Generar CV en PDF</>}
            </button>
            <p className="text-center text-xs leading-5 text-slate-500">La generación puede tardar aproximadamente un minuto.</p>
          </div>
        </div>

        <div className="glass-panel flex min-h-[760px] flex-col border border-white/10 p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="font-display text-xl font-semibold">Vista previa</h2><p className="mt-1 text-xs text-slate-500">{usedModel ? `Generado con ${usedModel} · ${validation?.layout === "visual" ? "Plantilla visual" : "ATS estricto"}` : "El PDF aparecerá aquí al finalizar."}</p></div>
            {previewUrl ? <a href={previewUrl} download={downloadName} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950"><FiDownload /> Descargar PDF</a> : null}
          </div>
          {previewUrl ? (
            <iframe src={previewUrl} title="Vista previa del CV generado" className="min-h-[720px] flex-1 rounded-2xl border border-white/10 bg-white" />
          ) : (
            <div className="flex min-h-[720px] flex-1 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950/25 p-10 text-center"><div><FiFileText className="mx-auto text-5xl text-slate-700" /><p className="mt-4 font-semibold text-slate-300">Aún no se ha generado un documento</p><p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Completa la experiencia, educación, habilidades y certificaciones para obtener un resultado más sólido.</p></div></div>
          )}
        </div>
      </div>
    </section>
  );
}
