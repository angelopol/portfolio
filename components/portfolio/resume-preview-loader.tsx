"use client";

import dynamic from "next/dynamic";

export const ResumePdfPreview = dynamic(
  () =>
    import("./resume-pdf-preview").then((module) => module.ResumePdfPreview),
  {
    ssr: false,
    loading: () => (
      <div className="h-[420px] animate-pulse rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface-soft)]" />
    ),
  },
);
