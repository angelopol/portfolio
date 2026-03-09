import Image from "next/image";
import dynamic from "next/dynamic";
import type { CSSProperties } from "react";
import type { IconType } from "react-icons";
import {
  FiArrowRight,
  FiDownload,
  FiExternalLink,
  FiGithub,
  FiLinkedin,
  FiMail,
  FiMapPin,
} from "react-icons/fi";

import { FloatingNav } from "@/components/portfolio/floating-nav";
import { ProjectsShowcase } from "@/components/portfolio/projects-showcase";
import type { SiteContent } from "@/types/site";

const ResumePdfPreview = dynamic(
  () => import("@/components/portfolio/resume-pdf-preview").then((module) => module.ResumePdfPreview),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-8 text-sm text-[var(--color-muted)]">
        Loading resume preview...
      </div>
    ),
  }
);

const socialIcons: Record<string, IconType> = {
  github: FiGithub,
  linkedin: FiLinkedin,
  email: FiMail,
};

function getSocialIcon(label: string): IconType {
  return socialIcons[label.toLowerCase()] ?? FiExternalLink;
}

export function SiteShell({ content }: { content: SiteContent }) {
  const themeStyle = {
    "--color-background": content.theme.background,
    "--color-surface": content.theme.surface,
    "--color-card": content.theme.card,
    "--color-text": content.theme.text,
    "--color-muted": content.theme.muted,
    "--color-accent": content.theme.accent,
    "--color-accent-soft": content.theme.accentSoft,
    "--color-ring": content.theme.ring,
    "--color-border": "color-mix(in srgb, var(--color-text) 14%, transparent)",
    "--color-border-strong": "color-mix(in srgb, var(--color-text) 26%, transparent)",
    "--color-ghost": "color-mix(in srgb, var(--color-text) 6%, transparent)",
    "--color-ghost-strong": "color-mix(in srgb, var(--color-text) 10%, transparent)",
    "--color-surface-soft": "color-mix(in srgb, var(--color-surface) 72%, var(--color-background))",
    "--color-overlay": "color-mix(in srgb, var(--color-background) 90%, transparent)",
  } as CSSProperties;

  const currentYear = new Date().getFullYear();

  return (
    <div style={themeStyle} className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
      <div aria-hidden="true" className="sparkle-field">
        {Array.from({ length: 18 }).map((_, index) => (
          <span
            key={index}
            className="sparkle"
            style={
              {
                left: `${(index * 7 + 9) % 100}%`,
                animationDelay: `${(index % 6) * 1.2}s`,
                animationDuration: `${10 + (index % 5)}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <FloatingNav initials={content.site.initials} resumeUrl={content.resume.downloadUrl} />

      <main>
        <section id="home" className="section-shell grid gap-10 pt-28 pb-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:pt-32 lg:pb-16">
          <div>
            <span className="section-label">{content.home.eyebrow}</span>
            <h1 className="font-display max-w-4xl text-4xl font-semibold tracking-tight text-[var(--color-text)] sm:text-5xl lg:text-7xl">
              {content.home.title}
            </h1>
            <p className="mt-6 max-w-3xl text-xl text-[var(--color-accent-soft)]">{content.home.subtitle}</p>
            <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--color-muted)]">{content.home.description}</p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={content.home.primaryCta.href}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                {content.home.primaryCta.label}
                <FiArrowRight />
              </a>
              <a
                href={content.home.secondaryCta.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-ghost)] px-5 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ghost-strong)]"
              >
                <FiDownload />
                {content.home.secondaryCta.label}
              </a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {content.home.metrics.map((item) => (
                <div key={item.label} className="glass-panel p-4">
                  <p className="text-sm text-[var(--color-muted)]">{item.label}</p>
                  <p className="mt-2 text-base font-semibold text-[var(--color-text)]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 shadow-glow">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative h-28 w-28 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-ghost)] sm:h-32 sm:w-32">
                <Image
                  src={content.about.profileImage}
                  alt={content.site.name}
                  fill
                  priority
                  sizes="128px"
                  className="object-cover"
                />
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[var(--color-accent-soft)]">
                  {content.site.role}
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold text-[var(--color-text)]">
                  {content.site.name}
                </h2>
                <div className="mt-4 space-y-2 text-sm text-[var(--color-muted)]">
                  <p className="inline-flex items-center gap-2">
                    <FiMapPin />
                    {content.home.location}
                  </p>
                  <p>{content.home.availability}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              {content.home.highlights.map((item) => (
                <div key={item} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-ghost)] px-4 py-3 text-sm text-[var(--color-text)]">
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {content.socials.map((social) => {
                const Icon = getSocialIcon(social.label);

                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-ghost)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ghost-strong)]"
                  >
                    <Icon />
                    {social.label}
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        <section id="about" className="section-shell py-8 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="glass-panel p-8 shadow-glow">
              <span className="section-label">About</span>
              <h2 className="section-title max-w-3xl">{content.about.headline}</h2>

              <div className="mt-6 space-y-5 text-base leading-8 text-[var(--color-muted)]">
                {content.about.summary.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <div className="glass-panel p-8">
                <h3 className="font-display text-xl font-semibold text-[var(--color-text)]">Focus areas</h3>
                <div className="mt-5 flex flex-wrap gap-3">
                  {content.about.focusAreas.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[var(--color-border)] bg-[var(--color-ghost)] px-4 py-2 text-sm text-[var(--color-text)]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="glass-panel p-8">
                <h3 className="font-display text-xl font-semibold text-[var(--color-text)]">Tech stack</h3>
                <div className="mt-5 flex flex-wrap gap-3">
                  {content.about.skillset.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[var(--color-border)] bg-[var(--color-ghost)] px-4 py-2 text-sm text-[var(--color-text)]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="glass-panel p-8">
                <h3 className="font-display text-xl font-semibold text-[var(--color-text)]">Tools</h3>
                <div className="mt-5 flex flex-wrap gap-3">
                  {content.about.toolset.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[var(--color-border)] bg-[var(--color-ghost)] px-4 py-2 text-sm text-[var(--color-text)]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="projects" className="section-shell py-8 lg:py-16">
          <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="section-label">Projects</span>
              <h2 className="section-title">Real products, useful systems, and end-to-end execution.</h2>
            </div>
          </div>

          <ProjectsShowcase projects={content.projects} />
        </section>

        <section id="resume" className="section-shell py-8 lg:py-16">
          <div className="grid items-start gap-8 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="glass-panel p-8 shadow-glow">
              <span className="section-label">Resume</span>
              <h2 className="section-title">{content.resume.title}</h2>
              <p className="mt-6 text-base leading-8 text-[var(--color-muted)]">{content.resume.description}</p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href={content.resume.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <FiExternalLink />
                  {content.resume.openLabel}
                </a>
                <a
                  href={content.resume.downloadUrl}
                  download
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-ghost)] px-5 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ghost-strong)]"
                >
                  <FiDownload />
                  {content.resume.downloadLabel}
                </a>
              </div>

              <div className="mt-8 rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-ghost)] p-5 text-sm leading-7 text-[var(--color-muted)]">
                <p className="font-semibold text-[var(--color-text)]">{content.resume.previewTitle}</p>
                <p className="mt-2">{content.resume.previewText}</p>
              </div>
            </div>

            <div className="glass-panel p-4 shadow-glow sm:p-6">
              <ResumePdfPreview
                fileUrl={content.resume.downloadUrl}
                title={content.resume.title}
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="section-shell py-12">
        <div className="glass-panel flex flex-col gap-4 px-6 py-6 text-sm text-[var(--color-muted)] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-[var(--color-text)]">{content.site.name}</p>
            <p className="mt-1">{content.site.role}</p>
          </div>

          <div className="flex flex-wrap gap-4">
            {content.socials.map((social) => (
              <a
                key={`footer-${social.label}`}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-[var(--color-text)]"
              >
                {social.label}
              </a>
            ))}
          </div>

          <p>© {currentYear} · Built with Next.js, TypeScript and Tailwind CSS.</p>
        </div>
      </footer>
    </div>
  );
}
