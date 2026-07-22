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

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
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
          <div className="mt-4 flex flex-wrap items-center gap-2" aria-label={`${index + 1} de ${certifications.length}`}>
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
          className="fixed inset-0 z-[80] bg-[var(--color-overlay)] backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div className="flex h-full w-full items-stretch justify-center p-2 sm:p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`certification-modal-title-${selected.id}`}
              aria-describedby={selected.description ? `certification-modal-description-${selected.id}` : undefined}
              className="relative grid h-full max-h-[calc(100vh-1rem)] w-full max-w-[1700px] overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl lg:grid-cols-[360px_minmax(0,1fr)]"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="pointer-events-auto absolute right-3 top-3 z-[95] inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-soft)]/95 text-[var(--color-text)] shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-md transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ghost-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] sm:right-4 sm:top-4 sm:h-auto sm:w-auto sm:min-h-11 sm:min-w-11 sm:gap-2 sm:px-4"
                aria-label={`${copy.close}: ${selected.title}`}
                title={copy.close}
              >
                <FiX className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden text-sm font-semibold sm:inline">{copy.close}</span>
              </button>

              <aside className="relative z-0 order-2 flex h-full min-h-0 flex-col overflow-y-auto border-t border-[var(--color-border)] bg-[var(--color-surface-soft)] p-6 lg:order-1 lg:border-r lg:border-t-0 lg:p-8">
                <div className="flex items-start gap-4 pr-12 lg:pr-0">
                  <IssuerLogo certification={selected} large />
                  <div className="min-w-0 flex-1">
                    <p className="section-label">{copy.certifications}</p>
                    <h3
                      id={`certification-modal-title-${selected.id}`}
                      className="font-display text-2xl font-semibold leading-tight text-[var(--color-text)]"
                    >
                      {selected.title}
                    </h3>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-accent-soft)]">
                      {selected.issuer}
                    </p>
                  </div>
                </div>

                <div className="mt-8 space-y-3 border-y border-[var(--color-border)] py-5">
                  {selected.issuedAt && (
                    <p className="text-sm text-[var(--color-muted)]">
                      <span className="font-semibold text-[var(--color-text)]">{copy.issued}:</span> {selected.issuedAt}
                    </p>
                  )}
                  {selected.credentialId && (
                    <p className="break-all text-sm text-[var(--color-muted)]">
                      <span className="font-semibold text-[var(--color-text)]">{copy.credentialId}:</span> {selected.credentialId}
                    </p>
                  )}
                </div>

                {selected.description && (
                  <p
                    id={`certification-modal-description-${selected.id}`}
                    className="mt-6 text-sm leading-8 text-[var(--color-muted)]"
                  >
                    {selected.description}
                  </p>
                )}

                <div className="mt-auto flex flex-col gap-3 pt-10">
                  {selected.verificationUrl && (
                    <a
                      href={selected.verificationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      <FiExternalLink />
                      {copy.verifyCredential}
                    </a>
                  )}
                  {selected.organizationUrl && (
                    <a
                      href={selected.organizationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-ghost)] px-5 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ghost-strong)]"
                    >
                      {copy.organizationLinkedIn}
                    </a>
                  )}
                </div>
              </aside>

              <section className="relative z-0 order-1 flex min-h-[52vh] min-h-0 flex-col bg-[var(--color-background)] lg:order-2">
                <div className="relative min-h-0 flex-1 overflow-hidden bg-[var(--color-background)]">
                  {selected.certificateUrl ? (
                    /\.pdf(?:$|\?)/i.test(selected.certificateUrl) ? (
                      <iframe
                        src={selected.certificateUrl}
                        title={`${copy.certificate} ${selected.title}`}
                        className="h-full min-h-[52vh] w-full bg-white"
                      />
                    ) : (
                      <img
                        src={selected.certificateUrl}
                        alt={`${copy.certificate} ${selected.title}`}
                        className="h-full min-h-[52vh] w-full object-contain p-4 sm:p-8"
                      />
                    )
                  ) : (
                    <div className="flex h-full min-h-[52vh] items-center justify-center p-8 text-center text-sm text-[var(--color-muted)]">
                      {copy.missingCertificate}
                    </div>
                  )}
                </div>

                <div className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface-soft)] px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                    {copy.certificate}
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
