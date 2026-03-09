"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

type ResumePdfPreviewProps = {
  fileUrl: string;
  title: string;
};

export function ResumePdfPreview({ fileUrl, title }: ResumePdfPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(720);
  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

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

  const pageWidth = useMemo(() => Math.max(260, containerWidth - 32), [containerWidth]);

  return (
    <div ref={containerRef} className="w-full p-0">
      <Document
        file={fileUrl}
        loading={
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="h-[420px] animate-pulse rounded-2xl border border-white/10 bg-white/5"
              />
            ))}
          </div>
        }
        error={
          <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-5 text-sm leading-7 text-amber-100">
            No se pudo renderizar el PDF aquí. Puedes abrirlo o descargarlo desde los botones.
          </div>
        }
        onLoadSuccess={({ numPages }) => {
          setPageCount(numPages);
          setHasError(false);
          setIsLoading(false);
        }}
        onLoadError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      >
        <div className="space-y-6">
          {!hasError &&
            Array.from({ length: pageCount || 0 }).map((_, index) => (
              <div key={`page-${index + 1}`} className="overflow-hidden rounded-2xl bg-white shadow-2xl">
                <Page
                  pageNumber={index + 1}
                  width={pageWidth}
                  renderAnnotationLayer
                  renderTextLayer
                  loading={null}
                  className="resume-pdf-page"
                />
              </div>
            ))}

          {!hasError && !pageCount && isLoading && (
            <div className="h-[420px] animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          )}
        </div>
      </Document>

      <p className="mt-4 text-center text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
        {title}
      </p>
    </div>
  );
}
