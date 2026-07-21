"use client";

import { useEffect, useState } from "react";
import { FiArrowLeft, FiArrowRight, FiAward, FiExternalLink, FiX } from "react-icons/fi";

import { interfaceCopy, type SiteLanguage } from "@/lib/i18n";
import type { Certification } from "@/types/site";

function IssuerLogo({ certification, large = false }: { certification: Certification; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  const initials = certification.issuer
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`${large ? "h-16 w-16 rounded-2xl text-lg" : "h-12 w-12 rounded-xl text-sm"} flex shrink-0 items-center justify-center overflow-hidden border border-[var(--color-border)] bg-white font-bold text-slate-800`}
    >
      {certification.logoUrl && !failed ? (
        <img
          src={certification.logoUrl}
          alt={`Logo de ${certification.issuer}`}
          className="h-full w-full object-contain p-1.5"
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{initials || <FiAward />}</span>
      )}
    </div>
  );
}

export function CertificationsShowcase({ certifications, language }: { certifications: Certification[]; language: SiteLanguage }) {
  const copy = interfaceCopy[language];
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Certification | null>(null);

  useEffect(() => {
    setIndex((current) => Math.min(current, Math.max(0, certifications.length - 1)));
  }, [certifications.length]);

  useEffect(() => {
    if (!selected) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelected(null);
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selected]);

  const current = certifications[index];

  return (
    <>
      <div className="glass-panel overflow-hidden p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-accent-soft)]">
              {copy.skillsCertifications}
            </p>
            <h3 className="mt-2 font-display text-xl font-semibold text-[var(--color-text)]">
              {copy.certifications}
            </h3>
          </div>

          {certifications.length > 1 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIndex((currentIndex) => (currentIndex - 1 + certifications.length) % certifications.length)}
                aria-label={copy.previousCertification}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-ghost)] p-2 text-[var(--color-text)] transition hover:bg-[var(--color-ghost-strong)]"
              >
                <FiArrowLeft />
              </button>
              <button
                type="button"
                onClick={() => setIndex((currentIndex) => (currentIndex + 1) % certifications.length)}
                aria-label={copy.nextCertification}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-ghost)] p-2 text-[var(--color-text)] transition hover:bg-[var(--color-ghost-strong)]"
              >
                <FiArrowRight />
              </button>
            </div>
          )}
        </div>

        {current ? (
          <button
            type="button"
            onClick={() => setSelected(current)}
            className="mt-5 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-ghost)] p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ghost-strong)]"
          >
            <div className="flex items-center gap-4">
              <IssuerLogo certification={current} />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold text-[var(--color-text)]">{current.title}</p>
                <p className="mt-1 truncate text-xs text-[var(--color-muted)]">{current.issuer}</p>
              </div>
              <FiExternalLink className="shrink-0 text-[var(--color-accent-soft)]" />
            </div>
          </button>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-ghost)] px-4 py-5 text-sm leading-6 text-[var(--color-muted)]">
            {copy.emptyCertifications}
          </div>
        )}

        {certifications.length > 1 && (
          <div className="mt-4 flex items-center gap-2" aria-label={`${index + 1} de ${certifications.length}`}>
            {certifications.map((item, dotIndex) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(dotIndex)}
                aria-label={`${copy.show} ${item.title}`}
                className={`h-1.5 rounded-full transition-all ${dotIndex === index ? "w-8 bg-[var(--color-accent)]" : "w-3 bg-[var(--color-border-strong)]"}`}
              />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--color-overlay)] p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="certification-title"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setSelected(null);
          }}
        >
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 p-6 backdrop-blur">
              <div className="flex items-center gap-4">
                <IssuerLogo certification={selected} large />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-accent-soft)]">{selected.issuer}</p>
                  <h3 id="certification-title" className="mt-1 font-display text-2xl font-semibold text-[var(--color-text)]">{selected.title}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label={copy.close}
                className="rounded-full border border-[var(--color-border)] p-3 text-[var(--color-text)] transition hover:bg-[var(--color-ghost)]"
              >
                <FiX />
              </button>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[0.68fr_1.32fr]">
              <div>
                {selected.issuedAt && <p className="text-sm text-[var(--color-muted)]">{copy.issued}: {selected.issuedAt}</p>}
                {selected.credentialId && <p className="mt-2 break-all text-sm text-[var(--color-muted)]">{copy.credentialId}: {selected.credentialId}</p>}
                <p className="mt-5 text-sm leading-7 text-[var(--color-muted)]">{selected.description}</p>
                <div className="mt-6 flex flex-col gap-3">
                  {selected.verificationUrl && (
                    <a href={selected.verificationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90">
                      <FiExternalLink /> {copy.verifyCredential}
                    </a>
                  )}
                  {selected.organizationUrl && (
                    <a href={selected.organizationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-ghost)]">
                      {copy.organizationLinkedIn}
                    </a>
                  )}
                </div>
              </div>

              <div className="min-h-[420px] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white/5">
                {selected.certificateUrl ? (
                  /\.pdf(?:$|\?)/i.test(selected.certificateUrl) ? (
                    <iframe src={selected.certificateUrl} title={`${copy.certificate} ${selected.title}`} className="h-[65vh] min-h-[420px] w-full bg-white" />
                  ) : (
                    <img src={selected.certificateUrl} alt={`${copy.certificate} ${selected.title}`} className="h-full min-h-[420px] w-full object-contain" />
                  )
                ) : (
                  <div className="flex min-h-[420px] items-center justify-center p-8 text-center text-sm text-[var(--color-muted)]">{copy.missingCertificate}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
