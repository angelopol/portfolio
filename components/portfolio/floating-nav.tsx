"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FiDownload } from "react-icons/fi";
import { LANGUAGE_COOKIE_NAME, type SiteLanguage } from "@/lib/i18n";

export function FloatingNav({
  initials,
  resumeUrl,
  language,
}: {
  initials: string;
  resumeUrl: string;
  language: SiteLanguage;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = useState(true);
  const hidden = Boolean(searchParams.get("project"));
  const navIsActive = isVisible && !hidden;
  const sectionLinks = [
    { href: "#home", label: "Home" },
    { href: "#about", label: language === "es" ? "Sobre mí" : "About" },
    { href: "#projects", label: language === "es" ? "Proyectos" : "Projects" },
    { href: "#resume", label: language === "es" ? "Currículum" : "Resume" },
  ];

  function changeLanguage(nextLanguage: SiteLanguage) {
    document.cookie = `${LANGUAGE_COOKIE_NAME}=${nextLanguage}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  }

  useEffect(() => {
    let lastScrollY = window.scrollY;

    function handleScroll() {
      const currentScrollY = window.scrollY;
      const isNearTop = currentScrollY < 32;
      const scrollingUp = currentScrollY < lastScrollY;

      setIsVisible(isNearTop || scrollingUp);
      lastScrollY = currentScrollY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div
        aria-hidden={!navIsActive}
        className={`w-full max-w-5xl transition duration-300 ${
          navIsActive ? "translate-y-0 opacity-100" : "invisible -translate-y-8 opacity-0"
        }`}
        style={{ pointerEvents: navIsActive ? "auto" : "none" }}
      >
        <div
          className="mx-auto flex min-h-[68px] items-center justify-between gap-3 rounded-full border border-[var(--color-border)] px-5 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:px-6 lg:px-8"
          style={{ backgroundColor: "var(--color-surface-soft)" }}
        >
          <Link
            href="/"
            className="shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-ghost)] px-4 py-2 font-display text-base font-semibold tracking-[0.32em] text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ghost-strong)]"
          >
            {initials}
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {sectionLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-[var(--color-muted)] transition hover:bg-[var(--color-ghost)] hover:text-[var(--color-text)]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <div
              className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-ghost)] p-1"
              aria-label={language === "es" ? "Idioma" : "Language"}
            >
              {(["en", "es"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => changeLanguage(option)}
                  aria-pressed={language === option}
                  className={`rounded-full px-2.5 py-1.5 text-xs font-bold uppercase transition ${
                    language === option
                      ? "bg-[var(--color-accent)] text-white"
                      : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

          <a
            href={resumeUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-ghost)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ghost-strong)]"
          >
            <FiDownload />
            CV
          </a>
          </div>
        </div>
      </div>
    </div>
  );
}
