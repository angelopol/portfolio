import { FiBookOpen, FiBriefcase, FiCalendar, FiExternalLink, FiMapPin } from "react-icons/fi";

import { interfaceCopy, type SiteLanguage } from "@/lib/i18n";
import type { CareerEntry } from "@/types/site";

function JourneySection({
  entries,
  kind,
  language,
}: {
  entries: CareerEntry[];
  kind: "experience" | "education";
  language: SiteLanguage;
}) {
  if (entries.length === 0) return null;

  const copy = interfaceCopy[language];
  const Icon = kind === "experience" ? FiBriefcase : FiBookOpen;
  const label = kind === "experience" ? copy.experience : copy.education;
  const title = kind === "experience" ? copy.experienceTitle : copy.educationTitle;

  return (
    <section id={kind} className="section-shell py-8 lg:py-16">
      <div className="mb-10">
        <span className="section-label">{label}</span>
        <h2 className="section-title max-w-4xl">{title}</h2>
      </div>

      <div className="relative space-y-5 before:absolute before:bottom-8 before:left-6 before:top-8 before:w-px before:bg-[var(--color-border)] sm:before:left-8">
        {entries.map((entry) => (
          <article key={entry.id} className="glass-panel relative ml-0 overflow-hidden p-6 shadow-glow sm:ml-16 sm:p-8">
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
      <JourneySection entries={workExperience} kind="experience" language={language} />
      <JourneySection entries={education} kind="education" language={language} />
    </>
  );
}
