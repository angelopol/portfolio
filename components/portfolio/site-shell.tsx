import Image from "next/image";
import Link from "next/link";
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

import { ResumePdfPreview } from "@/components/portfolio/resume-pdf-preview";
import type { Project, SiteContent } from "@/types/site";

const sectionLinks = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#projects", label: "Projects" },
  { href: "#resume", label: "Resume" },
];

const socialIcons: Record<string, IconType> = {
  github: FiGithub,
  linkedin: FiLinkedin,
  email: FiMail,
};

function getSocialIcon(label: string): IconType {
  return socialIcons[label.toLowerCase()] ?? FiExternalLink;
}

function ProjectCard({ project, priority }: { project: Project; priority?: boolean }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[var(--color-card)]/90 shadow-glow transition duration-300 hover:-translate-y-1 hover:border-[var(--color-accent)]/60">
      <div className="relative aspect-[16/10] overflow-hidden bg-white/5">
        <Image
          src={project.image}
          alt={project.title}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover object-top transition duration-500 group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl font-semibold text-white">{project.title}</h3>
            {project.featured && (
              <span className="mt-3 inline-flex rounded-full border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-accent-soft)]">
                Featured
              </span>
            )}
          </div>
        </div>

        <p className="text-sm leading-7 text-slate-300">{project.description}</p>

        <div className="flex flex-wrap gap-2">
          {project.stack.map((item) => (
            <span
              key={`${project.id}-${item}`}
              className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-slate-300"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-auto flex flex-wrap gap-3 pt-2">
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <FiExternalLink />
              Demo
            </a>
          )}
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
            >
              <FiGithub />
              Code
            </a>
          )}
        </div>
      </div>
    </article>
  );
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

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[rgba(9,9,15,0.72)] backdrop-blur-xl">
        <div className="section-shell flex h-20 items-center justify-between gap-6">
          <Link href="/" className="font-display text-lg font-semibold tracking-[0.32em] text-white">
            {content.site.initials}
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {sectionLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-300 transition hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <a
            href={content.resume.downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10"
          >
            <FiDownload />
            CV
          </a>
        </div>
      </header>

      <main>
        <section id="home" className="section-shell grid gap-10 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-28">
          <div>
            <span className="section-label">{content.home.eyebrow}</span>
            <h1 className="font-display max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-7xl">
              {content.home.title}
            </h1>
            <p className="mt-6 max-w-3xl text-xl text-[var(--color-accent-soft)]">{content.home.subtitle}</p>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300">{content.home.description}</p>

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
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
              >
                <FiDownload />
                {content.home.secondaryCta.label}
              </a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {content.home.metrics.map((item) => (
                <div key={item.label} className="glass-panel border border-white/10 p-4">
                  <p className="text-sm text-slate-400">{item.label}</p>
                  <p className="mt-2 text-base font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel border border-white/10 p-6 shadow-glow">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative h-28 w-28 overflow-hidden rounded-3xl border border-white/10 bg-white/5 sm:h-32 sm:w-32">
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
                <h2 className="mt-2 font-display text-3xl font-semibold text-white">
                  {content.site.name}
                </h2>
                <div className="mt-4 space-y-2 text-sm text-slate-300">
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
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
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
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
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
            <div className="glass-panel border border-white/10 p-8 shadow-glow">
              <span className="section-label">About</span>
              <h2 className="section-title max-w-3xl">{content.about.headline}</h2>

              <div className="mt-6 space-y-5 text-base leading-8 text-slate-300">
                {content.about.summary.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <div className="glass-panel border border-white/10 p-8">
                <h3 className="font-display text-xl font-semibold text-white">Focus areas</h3>
                <div className="mt-5 flex flex-wrap gap-3">
                  {content.about.focusAreas.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="glass-panel border border-white/10 p-8">
                <h3 className="font-display text-xl font-semibold text-white">Tech stack</h3>
                <div className="mt-5 flex flex-wrap gap-3">
                  {content.about.skillset.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-white/5 px-4 py-2 text-sm text-slate-200"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="glass-panel border border-white/10 p-8">
                <h3 className="font-display text-xl font-semibold text-white">Tools</h3>
                <div className="mt-5 flex flex-wrap gap-3">
                  {content.about.toolset.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-white/5 px-4 py-2 text-sm text-slate-200"
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

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {content.projects.map((project, index) => (
              <ProjectCard key={project.id} project={project} priority={index < 2} />
            ))}
          </div>
        </section>

        <section id="resume" className="section-shell py-8 lg:py-16">
          <div className="grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="glass-panel border border-white/10 p-8 shadow-glow">
              <span className="section-label">Resume</span>
              <h2 className="section-title">{content.resume.title}</h2>
              <p className="mt-6 text-base leading-8 text-slate-300">{content.resume.description}</p>

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
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
                >
                  <FiDownload />
                  {content.resume.downloadLabel}
                </a>
              </div>

              <div className="mt-8 rounded-3xl border border-dashed border-white/10 bg-white/5 p-5 text-sm leading-7 text-slate-300">
                <p className="font-semibold text-white">{content.resume.previewTitle}</p>
                <p className="mt-2">{content.resume.previewText}</p>
              </div>
            </div>

            <div className="glass-panel border border-white/10 p-4 shadow-glow sm:p-6">
              <ResumePdfPreview
                fileUrl={content.resume.downloadUrl}
                title={content.resume.title}
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="section-shell py-12">
        <div className="glass-panel flex flex-col gap-4 border border-white/10 px-6 py-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-white">{content.site.name}</p>
            <p className="mt-1">{content.site.role}</p>
          </div>

          <div className="flex flex-wrap gap-4">
            {content.socials.map((social) => (
              <a
                key={`footer-${social.label}`}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-white"
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
