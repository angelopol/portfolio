"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiExternalLink,
  FiGithub,
  FiShare2,
  FiStar,
  FiX,
} from "react-icons/fi";

import type { Project } from "@/types/site";

function getProjectSlides(project: Project) {
  return [project.image, ...(project.gallery ?? [])].filter(
    (value, index, array) => Boolean(value) && array.indexOf(value) === index
  );
}

export function ProjectsShowcase({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const projectParam = searchParams.get("project");

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const slides = useMemo(
    () => (selectedProject ? getProjectSlides(selectedProject) : []),
    [selectedProject]
  );

  useEffect(() => {
    if (!projectParam) {
      setSelectedProjectId(null);
      setActiveSlideIndex(0);
      return;
    }

    const existingProject = projects.find((project) => project.id === projectParam);

    if (!existingProject) {
      return;
    }

    setSelectedProjectId(projectParam);
    setActiveSlideIndex(0);
  }, [projectParam, projects]);

  useEffect(() => {
    if (!selectedProject) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeProject();
        return;
      }

      if (slides.length <= 1) {
        return;
      }

      if (event.key === "ArrowLeft") {
        setActiveSlideIndex((currentIndex) =>
          currentIndex === 0 ? slides.length - 1 : currentIndex - 1
        );
      }

      if (event.key === "ArrowRight") {
        setActiveSlideIndex((currentIndex) =>
          currentIndex === slides.length - 1 ? 0 : currentIndex + 1
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedProject, slides.length]);

  useEffect(() => {
    if (!shareFeedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => setShareFeedback(null), 2200);

    return () => window.clearTimeout(timeoutId);
  }, [shareFeedback]);

  function openProject(projectId: string) {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("project", projectId);
    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });

    setSelectedProjectId(projectId);
    setActiveSlideIndex(0);
  }

  function closeProject() {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("project");
    const nextUrl = nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname;

    router.replace(nextUrl, { scroll: false });
    setSelectedProjectId(null);
    setActiveSlideIndex(0);
  }

  async function shareProject(projectId: string) {
    const url = `${window.location.origin}${pathname}?project=${encodeURIComponent(projectId)}`;

    try {
      await navigator.clipboard.writeText(url);
      setShareFeedback("Link copied to clipboard.");
    } catch {
      try {
        window.prompt("Copy this project link", url);
        setShareFeedback("Copy the link from the dialog.");
      } catch {
        setShareFeedback("Could not copy the project link.");
      }
    }
  }

  function showPreviousSlide() {
    if (slides.length <= 1) {
      return;
    }

    setActiveSlideIndex((currentIndex) =>
      currentIndex === 0 ? slides.length - 1 : currentIndex - 1
    );
  }

  function showNextSlide() {
    if (slides.length <= 1) {
      return;
    }

    setActiveSlideIndex((currentIndex) =>
      currentIndex === slides.length - 1 ? 0 : currentIndex + 1
    );
  }

  return (
    <>
      {shareFeedback && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-[90] -translate-x-1/2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] shadow-glow">
          {shareFeedback}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project, index) => (
          <article
            key={project.id}
            className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface-soft)] shadow-glow transition duration-300 hover:-translate-y-1 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface)]/90"
          >
              <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-ghost)]">
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  priority={index < 2}
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover object-top transition duration-500 group-hover:scale-[1.03]"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-background)]/80 via-[var(--color-background)]/20 to-transparent p-4">
                  {project.featured && (
                    <span
                      className="absolute left-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 text-[var(--color-accent-soft)]"
                      aria-label="Featured project"
                      title="Featured project"
                    >
                      <FiStar className="h-4 w-4 fill-current" />
                    </span>
                  )}

                  <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => openProject(project.id)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ghost-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
                    aria-label={`Open ${project.title} project modal`}
                    title="Open project preview"
                  >
                    <FiExternalLink />
                  </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-5 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <button
                      type="button"
                      onClick={() => openProject(project.id)}
                      className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--color-background)]"
                      aria-label={`Open ${project.title} project modal`}
                    >
                      <h3 className="font-display text-2xl font-semibold text-[var(--color-text)]">{project.title}</h3>
                    </button>
                  </div>
                </div>

                <p className="text-sm leading-7 text-[var(--color-muted)]">{project.description}</p>

                <div className="flex flex-wrap gap-2">
                  {project.stack.map((item) => (
                    <span
                      key={`${project.id}-${item}`}
                      className="rounded-full border border-[var(--color-border)] bg-[var(--color-ghost)] px-3 py-1 text-xs font-medium text-[var(--color-text)]"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-auto flex justify-end pt-2">
                  <div className="flex flex-wrap justify-end gap-2">
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
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-ghost)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ghost-strong)]"
                      >
                        <FiGithub />
                        GitHub
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => void shareProject(project.id)}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-ghost)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ghost-strong)]"
                    >
                      <FiShare2 />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </article>
        ))}
      </div>

      {selectedProject && (
          <div
            className="fixed inset-0 z-[80] bg-[var(--color-overlay)] backdrop-blur-sm"
            onClick={closeProject}
          >
          <div className="flex h-full w-full items-stretch justify-center p-2 sm:p-4">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={`project-modal-title-${selectedProject.id}`}
                aria-describedby={`project-modal-description-${selectedProject.id}`}
                className="relative grid h-full max-h-[calc(100vh-1rem)] w-full max-w-[1700px] overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl lg:grid-cols-[360px_minmax(0,1fr)]"
                onClick={(event) => event.stopPropagation()}
              >
              <button
                type="button"
                onClick={closeProject}
                  className="absolute right-3 top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-soft)]/95 text-[var(--color-text)] shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-md transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ghost-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] sm:right-4 sm:top-4 sm:h-auto sm:w-auto sm:min-h-11 sm:min-w-11 sm:gap-2 sm:px-4"
                  aria-label={`Close ${selectedProject.title} project dialog`}
                  title="Close project"
              >
                <FiX className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden text-sm font-semibold sm:inline">Close</span>
              </button>

                <aside className="order-2 flex h-full min-h-0 flex-col overflow-y-auto border-t border-[var(--color-border)] bg-[var(--color-surface-soft)] p-6 lg:order-1 lg:border-r lg:border-t-0 lg:p-8">
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                  <p className="section-label">Project details</p>
                    <h3
                      id={`project-modal-title-${selectedProject.id}`}
                      className="font-display text-3xl font-semibold text-[var(--color-text)]"
                    >
                    {selectedProject.title}
                  </h3>
                  </div>
                  {selectedProject.featured && (
                      <span
                        className="mt-12 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 text-[var(--color-accent-soft)]"
                        aria-label="Featured project"
                        title="Featured project"
                      >
                        <FiStar className="h-4.5 w-4.5 fill-current" />
                    </span>
                  )}
                </div>

                <p
                  id={`project-modal-description-${selectedProject.id}`}
                  className="mt-6 text-sm leading-8 text-[var(--color-muted)]"
                >
                  {selectedProject.description}
                </p>

                <div className="mt-8">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--color-accent-soft)]">
                    Stack used
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {selectedProject.stack.map((item) => (
                      <span
                        key={`${selectedProject.id}-modal-${item}`}
                        className="rounded-full border border-[var(--color-border)] bg-[var(--color-ghost)] px-4 py-2 text-sm text-[var(--color-text)]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-auto flex flex-wrap gap-3 pt-10">
                  <button
                    type="button"
                    onClick={() => void shareProject(selectedProject.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-ghost)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ghost-strong)]"
                  >
                    <FiShare2 />
                    Share project
                  </button>
                  {selectedProject.demoUrl && (
                    <a
                      href={selectedProject.demoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      <FiExternalLink />
                      Live demo
                    </a>
                  )}
                  {selectedProject.githubUrl && (
                    <a
                      href={selectedProject.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-ghost)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ghost-strong)]"
                    >
                      <FiGithub />
                      Source code
                    </a>
                  )}
                </div>
              </aside>

              <section className="order-1 flex min-h-[52vh] min-h-0 flex-col bg-[var(--color-background)] lg:order-2">
                <div className="relative min-h-0 flex-1 overflow-hidden bg-[var(--color-background)]">
                  <Image
                    src={slides[activeSlideIndex]}
                    alt={`${selectedProject.title} preview ${activeSlideIndex + 1}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 70vw"
                    className="object-contain"
                    priority
                  />

                  {slides.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={showPreviousSlide}
                        className="absolute left-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-soft)]/95 text-[var(--color-text)] shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-md transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ghost-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] sm:inline-flex"
                        aria-label="Previous image"
                      >
                        <FiChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={showNextSlide}
                        className="absolute right-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-soft)]/95 text-[var(--color-text)] shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-md transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ghost-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] sm:inline-flex"
                        aria-label="Next image"
                      >
                        <FiChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                <div className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="flex items-center justify-between gap-3 sm:block">
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
                        {slides.length > 1
                          ? `Image ${activeSlideIndex + 1} of ${slides.length}`
                          : "Project preview"}
                      </p>
                      {slides.length > 1 && (
                        <div className="flex items-center gap-2 sm:hidden">
                          <button
                            type="button"
                            onClick={showPreviousSlide}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-ghost)] text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ghost-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-soft)]"
                            aria-label="Previous image"
                          >
                            <FiChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={showNextSlide}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-ghost)] text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ghost-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-soft)]"
                            aria-label="Next image"
                          >
                            <FiChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    {slides.length > 1 && (
                      <div className="flex max-w-full flex-wrap justify-end gap-2">
                        {slides.map((image, index) => (
                          <button
                            key={`${selectedProject.id}-thumb-${index}`}
                            type="button"
                            onClick={() => setActiveSlideIndex(index)}
                            className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-2xl border transition ${
                              index === activeSlideIndex
                                ? "border-[var(--color-accent)]"
                                : "border-[var(--color-border)] opacity-70 hover:border-[var(--color-border-strong)] hover:opacity-100"
                            }`}
                            aria-label={`Open image ${index + 1}`}
                          >
                            <Image
                              src={image}
                              alt={`${selectedProject.title} thumbnail ${index + 1}`}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
