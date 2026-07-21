"use client";

import { useEffect, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiArrowRight,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiExternalLink,
  FiMapPin,
} from "react-icons/fi";

import { interfaceCopy, type SiteLanguage } from "@/lib/i18n";
import type { CareerEntry } from "@/types/site";

function JourneyCard({
  entry,
  kind,
  language,
  animationDirection,
}: {
  entry: CareerEntry;
  kind: "experience" | "education";
  language: SiteLanguage;
  animationDirection?: "left" | "right";
}) {
  const copy = interfaceCopy[language];
  const Icon = kind === "experience" ? FiBriefcase : FiBookOpen;

  return (
    <article
      key={entry.id}
      className={`glass-panel relative ml-0 overflow-hidden p-6 shadow-glow sm:ml-16 sm:p-8 ${
        animationDirection ? `journey-card-enter-${animationDirection}` : ""
      }`}
    >
      <span className="absolute left-6 top-6 z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-accent-soft)] sm:-left-[65px] sm:top-8">
        <Icon />
      </span>

      <div className="pl-16 sm:pl-0">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="font-display text-2xl font-semibold text-[var(--color-text)]">{entry.title}</h3>
            {entry.organization && <p className="mt-2 font-semibold text-[var(--color-accent-soft)]">{entry.organization}</p>}
          </div>
          <div className="flex flex-col gap-2 text-sm text-[var(--color-muted)] lg:items-end">
            {(entry.startDate || entry.endDate) && (
              <p className="inline-flex items-center gap-2"><FiCalendar /> {entry.startDate}{entry.startDate && " — "}{entry.endDate || copy.present}</p>
            )}
            {entry.location && <p className="inline-flex items-center gap-2"><FiMapPin /> {entry.location}</p>}
          </div>
        </div>

        {entry.description && <p className="mt-6 whitespace-pre-line text-sm leading-8 text-[var(--color-muted)]">{entry.description}</p>}

        {entry.references.some((reference) => reference.url) && (
          <div className="mt-6 border-t border-[var(--color-border)] pt-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-muted)]">{copy.references}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {entry.references.filter((reference) => reference.url).map((reference, index) => (
                <a
                  key={`${entry.id}-reference-${index}`}
                  href={reference.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-ghost)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ghost-strong)]"
                >
                  <FiExternalLink /> {reference.label || reference.url}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function ExperienceSlider({ entries, language }: { entries: CareerEntry[]; language: SiteLanguage }) {
  const copy = interfaceCopy[language];
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setIndex((current) => Math.min(current, Math.max(0, entries.length - 1)));
  }, [entries.length]);

  const current = entries[index];

  if (!current) return null;

  function move(offset: -1 | 1) {
    if (entries.length <= 1) return;
    setDirection(offset < 0 ? "left" : "right");
    setIndex((currentIndex) => (currentIndex + offset + entries.length) % entries.length);
  }

  function select(nextIndex: number) {
    if (nextIndex === index) return;
    setDirection(nextIndex < index ? "left" : "right");
    setIndex(nextIndex);
  }

  return (
    <section id="experience" className="section-shell py-8 lg:py-16">
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="section-label">{copy.experience}</span>
          <h2 className="section-title max-w-4xl">{copy.experienceTitle}</h2>
        </div>

        {entries.length > 1 && (
          <div className="flex shrink-0 items-center gap-3">
            <span className="min-w-16 text-center text-xs font-bold tabular-nums tracking-[0.18em] text-[var(--color-muted)]">
              {String(index + 1).padStart(2, "0")} / {String(entries.length).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label={copy.previousExperience}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-ghost)] text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ghost-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            >
              <FiArrowLeft />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label={copy.nextExperience}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-ghost)] text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ghost-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            >
              <FiArrowRight />
            </button>
          </div>
        )}
      </div>

      <div
        className="relative outline-none before:absolute before:bottom-8 before:left-6 before:top-8 before:w-px before:bg-[var(--color-border)] focus-visible:rounded-[28px] focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] sm:before:left-8"
        tabIndex={entries.length > 1 ? 0 : -1}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            move(-1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            move(1);
          }
        }}
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (touchStartX.current === null) return;
          const distance = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(distance) < 45) return;
          move(distance > 0 ? -1 : 1);
        }}
        aria-roledescription="carousel"
        aria-label={copy.experience}
      >
        <div aria-live="polite">
          <JourneyCard
            key={current.id}
            entry={current}
            kind="experience"
            language={language}
            animationDirection={direction}
          />
        </div>
      </div>

      {entries.length > 1 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:ml-16" aria-label={`${index + 1} / ${entries.length}`}>
          {entries.map((entry, dotIndex) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => select(dotIndex)}
              aria-label={`${copy.showExperience}: ${entry.title}`}
              aria-current={dotIndex === index ? "true" : undefined}
              className={`h-2 rounded-full transition-all ${
                dotIndex === index
                  ? "w-9 bg-[var(--color-accent)]"
                  : "w-3 bg-[var(--color-border-strong)] hover:bg-[var(--color-accent-soft)]"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function EducationSection({ entries, language }: { entries: CareerEntry[]; language: SiteLanguage }) {
  if (entries.length === 0) return null;
  const copy = interfaceCopy[language];

  return (
    <section id="education" className="section-shell py-8 lg:py-16">
      <div className="mb-10">
        <span className="section-label">{copy.education}</span>
        <h2 className="section-title max-w-4xl">{copy.educationTitle}</h2>
      </div>
      <div className="relative space-y-5 before:absolute before:bottom-8 before:left-6 before:top-8 before:w-px before:bg-[var(--color-border)] sm:before:left-8">
        {entries.map((entry) => (
          <JourneyCard key={entry.id} entry={entry} kind="education" language={language} />
        ))}
      </div>
    </section>
  );
}

export function ProfessionalJourney({
  workExperience,
  education,
  language,
}: {
  workExperience: CareerEntry[];
  education: CareerEntry[];
  language: SiteLanguage;
}) {
  return (
    <>
      {workExperience.length > 0 && <ExperienceSlider entries={workExperience} language={language} />}
      <EducationSection entries={education} language={language} />
    </>
  );
}
