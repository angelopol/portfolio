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
        setSelectedProjectId(null);
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
    } catch {
      window.prompt("Copy this project link", url);
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
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project, index) => (
          <button
            key={project.id}
            type="button"
            onClick={() => openProject(project.id)}
            className="group text-left"
          >
            <article className="flex h-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[var(--color-card)]/90 shadow-glow transition duration-300 hover:-translate-y-1 hover:border-[var(--color-accent)]/60">
              <div className="relative aspect-[16/10] overflow-hidden bg-white/5">
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  priority={index < 2}
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover object-top transition duration-500 group-hover:scale-[1.03]"
                />
              </div>

              <div className="flex flex-1 flex-col gap-5 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-2xl font-semibold text-[var(--color-text)]">{project.title}</h3>
                    {project.featured && (
                      <span className="mt-3 inline-flex rounded-full border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-accent-soft)]">
                        Featured
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm leading-7 text-[var(--color-muted)]">{project.description}</p>

                <div className="flex flex-wrap gap-2">
                  {project.stack.map((item) => (
                    <span
                      key={`${project.id}-${item}`}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-[var(--color-text)]"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-auto flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void shareProject(project.id);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-white/30 hover:bg-white/5"
                  >
                    <FiShare2 />
                    Share
                  </button>
                </div>
              </div>
            </article>
          </button>
        ))}
      </div>

      {selectedProject && (
        <div className="fixed inset-0 z-[80] bg-slate-950/95 backdrop-blur-sm">
          <div className="flex h-full w-full items-stretch justify-center p-2 sm:p-4">
            <div className="relative grid h-full w-full max-w-[1700px] overflow-hidden rounded-[32px] border border-white/10 bg-[var(--color-surface)] shadow-2xl lg:grid-cols-[360px_minmax(0,1fr)]">
              <button
                type="button"
                onClick={closeProject}
                className="absolute right-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-[var(--color-text)] transition hover:bg-white/10"
                aria-label="Close project"
              >
                <FiX />
              </button>

              <aside className="order-2 flex h-full flex-col border-t border-white/10 bg-[var(--color-card)]/60 p-6 lg:order-1 lg:border-r lg:border-t-0 lg:p-8">
                <div>
                  <p className="section-label">Project details</p>
                  <h3 className="font-display text-3xl font-semibold text-[var(--color-text)]">
                    {selectedProject.title}
                  </h3>
                  {selectedProject.featured && (
                    <span className="mt-4 inline-flex rounded-full border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-accent-soft)]">
                      Featured
                    </span>
                  )}
                </div>

                <p className="mt-6 text-sm leading-8 text-[var(--color-muted)]">
                  {selectedProject.description}
                </p>

                <div className="mt-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-accent-soft)]">
                    Stack used
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {selectedProject.stack.map((item) => (
                      <span
                        key={`${selectedProject.id}-modal-${item}`}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-[var(--color-text)]"
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
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-white/30 hover:bg-white/5"
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
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-white/30 hover:bg-white/5"
                    >
                      <FiGithub />
                      Source code
                    </a>
                  )}
                </div>
              </aside>

              <section className="order-1 flex min-h-[52vh] flex-col bg-slate-950 lg:order-2">
                <div className="relative flex-1 overflow-hidden bg-black">
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
                        className="absolute left-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-white transition hover:bg-white/10"
                        aria-label="Previous image"
                      >
                        <FiChevronLeft />
                      </button>
                      <button
                        type="button"
                        onClick={showNextSlide}
                        className="absolute right-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-white transition hover:bg-white/10"
                        aria-label="Next image"
                      >
                        <FiChevronRight />
                      </button>
                    </>
                  )}
                </div>

                <div className="border-t border-white/10 bg-slate-950/80 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                      {slides.length > 1
                        ? `Image ${activeSlideIndex + 1} of ${slides.length}`
                        : "Project preview"}
                    </p>
                    {slides.length > 1 && (
                      <div className="flex flex-wrap justify-end gap-2">
                        {slides.map((image, index) => (
                          <button
                            key={`${selectedProject.id}-thumb-${index}`}
                            type="button"
                            onClick={() => setActiveSlideIndex(index)}
                            className={`relative h-14 w-20 overflow-hidden rounded-2xl border transition ${
                              index === activeSlideIndex
                                ? "border-[var(--color-accent)]"
                                : "border-white/10 opacity-70 hover:opacity-100"
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
