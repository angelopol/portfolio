"use client";

import { useEffect, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiArrowRight,
  FiAward,
  FiExternalLink,
} from "react-icons/fi";

import { interfaceCopy, type SiteLanguage } from "@/lib/i18n";
import type { Certification } from "@/types/site";

function IssuerLogo({
  certification,
  large = false,
}: {
  certification: Certification;
  large?: boolean;
}) {
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

export function CertificationsShowcase({
  certifications,
  language,
}: {
  certifications: Certification[];
  language: SiteLanguage;
}) {
  const copy = interfaceCopy[language];
  const [page, setPage] = useState(0);
  const touchX = useRef<number | null>(null);
  const pages = Math.ceil(certifications.length / 3);
  useEffect(
    () => setPage((current) => Math.min(current, Math.max(0, pages - 1))),
    [pages],
  );
  function move(offset: number) {
    if (pages > 1) setPage((current) => (current + offset + pages) % pages);
  }
  return (
    <div className="glass-panel min-w-0 overflow-hidden p-5 sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-accent-soft)]">
            {copy.skillsCertifications}
          </p>
          <h3 className="mt-2 font-display text-xl font-semibold">
            {copy.certifications}
          </h3>
        </div>
        {pages > 1 && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label={copy.previousCertification}
              className="rounded-full border border-[var(--color-border)] p-3"
            >
              <FiArrowLeft />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label={copy.nextCertification}
              className="rounded-full border border-[var(--color-border)] p-3"
            >
              <FiArrowRight />
            </button>
          </div>
        )}
      </div>
      <div
        className="mt-5 space-y-4 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
        role="region"
        aria-roledescription="carousel"
        aria-label={copy.certifications}
        tabIndex={pages > 1 ? 0 : -1}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            move(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
        onTouchStart={(event) => {
          touchX.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (touchX.current !== null) {
            const distance =
              (event.changedTouches[0]?.clientX ?? touchX.current) -
              touchX.current;
            if (Math.abs(distance) > 50) move(distance > 0 ? -1 : 1);
          }
          touchX.current = null;
        }}
      >
        {certifications.slice(page * 3, page * 3 + 3).map((certification) => (
          <article
            key={certification.id}
            className="min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-ghost)] p-4 [overflow-wrap:anywhere]"
          >
            <div className="flex items-start gap-3">
              <IssuerLogo certification={certification} />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold">{certification.title}</h4>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  {certification.issuer}
                </p>
              </div>
            </div>
            {certification.issuedAt && (
              <p className="mt-3 text-xs text-[var(--color-muted)]">
                {copy.issued}: {certification.issuedAt}
              </p>
            )}
            {certification.description && (
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[var(--color-muted)]">
                {certification.description}
              </p>
            )}
            {certification.credentialId && (
              <p className="mt-3 text-xs text-[var(--color-muted)]">
                {copy.credentialId}: {certification.credentialId}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-[var(--color-accent-soft)]">
              {[
                [certification.certificateUrl, copy.certificate],
                [certification.verificationUrl, copy.verifyCredential],
                [certification.organizationUrl, copy.organizationLinkedIn],
              ]
                .filter(
                  ([url]) =>
                    /^https?:\/\//i.test(url) ||
                    (url.startsWith("/") && !url.startsWith("//")),
                )
                .map(([url, label]) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex max-w-full items-center gap-2"
                  >
                    <FiExternalLink className="shrink-0" />
                    {label}
                  </a>
                ))}
            </div>
          </article>
        ))}
        {!certifications.length && (
          <p className="text-sm text-[var(--color-muted)]">
            {copy.emptyCertifications}
          </p>
        )}
      </div>
      {pages > 1 && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span
            className="text-xs text-[var(--color-muted)]"
            aria-live="polite"
          >
            {page + 1} / {pages}
          </span>
          {Array.from({ length: pages }, (_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setPage(index)}
              aria-label={`${copy.show} ${index + 1}`}
              aria-current={index === page ? "page" : undefined}
              className="flex h-8 items-center px-1"
            >
              <span
                className={`h-1.5 rounded-full ${index === page ? "w-8 bg-[var(--color-accent)]" : "w-3 bg-[var(--color-border-strong)]"}`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
