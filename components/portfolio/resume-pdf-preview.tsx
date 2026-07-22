"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { interfaceCopy, type SiteLanguage } from "@/lib/i18n";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

type ResumePdfPreviewProps = {
  fileUrl: string;
  title: string;
  language: SiteLanguage;
};

export function ResumePdfPreview({ fileUrl, title, language }: ResumePdfPreviewProps) {
  const copy = interfaceCopy[language];
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(720);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const updateWidth = () => {
      setContainerWidth(Math.max(280, Math.floor(element.clientWidth)));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setPageCount(0);
    setIsLoading(true);
    setHasError(false);
  }, [fileUrl, language]);

  const pageWidth = useMemo(() => Math.max(260, containerWidth - 32), [containerWidth]);

  function movePage(offset: -1 | 1) {
    if (pageCount <= 1) return;
    setDirection(offset < 0 ? "left" : "right");
    setCurrentPage((page) => Math.min(pageCount, Math.max(1, page + offset)));
  }

  function selectPage(page: number) {
    if (page === currentPage) return;
    setDirection(page < currentPage ? "left" : "right");
    setCurrentPage(page);
  }

  return (
    <div ref={containerRef} className="w-full p-0">
      <Document
        file={fileUrl}
        loading={
          <div className="h-[420px] animate-pulse rounded-2xl border border-white/10 bg-white/5" />
        }
        error={
          <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-5 text-sm leading-7 text-amber-100">
            {copy.resumeRenderError}
          </div>
        }
        onLoadSuccess={({ numPages }) => {
          setPageCount(numPages);
          setCurrentPage((page) => Math.min(Math.max(1, page), numPages));
          setHasError(false);
          setIsLoading(false);
        }}
        onLoadError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      >
        <div>
          {!hasError && pageCount > 1 && (
            <div className="mb-4 flex items-center justify-between gap-3">
              <span
                className="text-xs font-bold tabular-nums tracking-[0.16em] text-[var(--color-muted)]"
                aria-live="polite"
              >
                {copy.resumePage} {currentPage} {copy.of} {pageCount}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => movePage(-1)}
                  disabled={currentPage === 1}
                  aria-label={copy.previousResumePage}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-ghost)] text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ghost-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <FiChevronLeft />
                </button>
                <button
                  type="button"
                  onClick={() => movePage(1)}
                  disabled={currentPage === pageCount}
                  aria-label={copy.nextResumePage}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-ghost)] text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ghost-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          )}

          {!hasError && pageCount > 0 && (
            <div
              className="outline-none focus-visible:rounded-2xl focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              tabIndex={pageCount > 1 ? 0 : -1}
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  movePage(-1);
                }
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  movePage(1);
                }
              }}
              onTouchStart={(event) => {
                touchStartX.current = event.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(event) => {
                if (touchStartX.current === null) return;
                const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
                const distance = endX - touchStartX.current;
                touchStartX.current = null;
                if (Math.abs(distance) >= 45) movePage(distance > 0 ? -1 : 1);
              }}
              aria-roledescription="carousel"
              aria-label={title}
            >
              <div
                key={`${fileUrl}-${currentPage}`}
                className={`overflow-hidden rounded-2xl bg-white shadow-2xl ${
                  direction === "left" ? "resume-page-enter-left" : "resume-page-enter-right"
                }`}
              >
                <Page
                  pageNumber={currentPage}
                  width={pageWidth}
                  renderAnnotationLayer
                  renderTextLayer
                  loading={null}
                  className="resume-pdf-page"
                />
              </div>
            </div>
          )}

          {!hasError && !pageCount && isLoading && (
            <div className="h-[420px] animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          )}
        </div>
      </Document>

      {!hasError && pageCount > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {Array.from({ length: pageCount }, (_, index) => {
            const page = index + 1;
            return (
              <button
                key={page}
                type="button"
                onClick={() => selectPage(page)}
                aria-label={`${copy.showResumePage} ${page}`}
                aria-current={page === currentPage ? "page" : undefined}
                className={`h-2 rounded-full transition-all ${
                  page === currentPage
                    ? "w-9 bg-[var(--color-accent)]"
                    : "w-3 bg-[var(--color-border-strong)] hover:bg-[var(--color-accent-soft)]"
                }`}
              />
            );
          })}
        </div>
      )}

      <p className="mt-4 text-center text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
        {title}
      </p>
    </div>
  );
}
