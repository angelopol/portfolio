import "server-only";

import { extractText, getDocumentProxy } from "unpdf";

import type { GeneratedResume, ResumeLayout } from "@/types/resume";

const MAX_ATS_FILE_SIZE = 2_500_000;

export type ResumePdfValidation = {
  passed: true;
  layout: ResumeLayout;
  pages: number;
  fileSizeBytes: number;
  textCharacters: number;
  checks: string[];
};

export class ResumePdfValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`El PDF no supero la validacion ATS: ${issues.join(" ")}`);
    this.name = "ResumePdfValidationError";
    this.issues = issues;
  }
}

function searchable(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9@+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function contains(extracted: string, expected: string) {
  const needle = searchable(expected);
  return !needle || extracted.includes(needle);
}

function visibleUrl(value: string) {
  return value.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function followsInOrder(extracted: string, values: string[], startAt = 0) {
  let cursor = startAt;
  for (const value of values.filter(Boolean)) {
    const index = extracted.indexOf(searchable(value), cursor);
    if (index < 0) return -1;
    cursor = index + searchable(value).length;
  }
  return cursor;
}

export async function validateResumePdf(
  buffer: Uint8Array,
  resume: GeneratedResume,
  layout: ResumeLayout
): Promise<ResumePdfValidation> {
  const issues: string[] = [];
  const checks: string[] = [];

  if (buffer.byteLength > MAX_ATS_FILE_SIZE) {
    issues.push("El archivo supera 2.5 MB, limite aceptado por algunos ATS.");
  } else {
    checks.push("file-size");
  }

  const document = await getDocumentProxy(Uint8Array.from(buffer));
  let totalPages = 0;
  let extractedText = "";
  let normalizedPages: string[] = [];

  try {
    const result = await extractText(document);
    totalPages = result.totalPages;
    const pages = Array.isArray(result.text) ? result.text : [result.text];
    extractedText = pages.join("\n");
    normalizedPages = pages.map(searchable);
  } catch {
    issues.push("No se pudo extraer la capa de texto seleccionable.");
  } finally {
    await document.destroy();
  }

  if (totalPages < 1 || totalPages > 2) {
    issues.push(`El documento contiene ${totalPages || "cero"} paginas; debe contener una o dos.`);
  } else {
    checks.push("page-count");
  }

  const normalizedText = searchable(extractedText);
  if (normalizedText.length < 120) {
    issues.push("La capa de texto es demasiado corta o el PDF parece estar rasterizado.");
  } else {
    checks.push("selectable-text");
  }

  if (/\[object object\]|\bundefined\b|�/i.test(extractedText)) {
    issues.push("La capa de texto contiene valores corruptos o sin serializar.");
  } else {
    checks.push("clean-text");
  }

  const identityFields = [
    ["nombre completo", resume.fullName],
    ["correo", resume.contact.email],
    ["telefono", resume.contact.phone],
    ["ubicacion", resume.contact.location],
    ["portfolio", visibleUrl(resume.contact.portfolioUrl)],
    ["LinkedIn", visibleUrl(resume.contact.linkedinUrl)],
    ["GitHub", visibleUrl(resume.contact.githubUrl)],
  ] as const;

  for (const [label, value] of identityFields) {
    if (value && !contains(normalizedText, value)) issues.push(`Falta ${label} en la capa de texto.`);
  }
  if (!issues.some((issue) => issue.startsWith("Falta "))) checks.push("contact-data");

  const copy = resume.language === "es"
    ? {
        summary: "Resumen profesional",
        experience: "Experiencia profesional",
        education: "Educacion",
        certifications: "Certificaciones",
        skills: "Habilidades",
      }
    : {
        summary: "Professional Summary",
        experience: "Work Experience",
        education: "Education",
        certifications: "Certifications",
        skills: "Skills",
      };

  const expectedSections = [
    resume.summary ? copy.summary : "",
    resume.experience.length ? copy.experience : "",
    resume.education.length ? copy.education : "",
    resume.skills.certifications.length ? copy.certifications : "",
    copy.skills,
  ].filter(Boolean);

  let sectionCursor = -1;
  const indexes = expectedSections.map((section) => {
    const index = normalizedText.indexOf(searchable(section), sectionCursor + 1);
    if (index >= 0) sectionCursor = index;
    return index;
  });
  const missingSections = expectedSections.filter((_, index) => indexes[index] < 0);
  if (missingSections.length) {
    issues.push(`Faltan encabezados ATS estandar: ${missingSections.join(", ")}.`);
  } else {
    checks.push("standard-sections");
    checks.push("reading-order");
  }

  let manifestCursor = 0;
  let manifestValid = true;
  for (const entry of resume.experience) {
    manifestCursor = followsInOrder(normalizedText, [
      entry.organization || entry.title,
      entry.organization ? entry.title : "",
      entry.location,
      entry.startDate,
      entry.endDate,
    ], manifestCursor);
    if (manifestCursor < 0) {
      manifestValid = false;
      break;
    }
  }

  if (manifestValid) {
    for (const entry of resume.education) {
      manifestCursor = followsInOrder(normalizedText, [
        entry.institution,
        entry.title,
        entry.location,
        entry.startDate,
        entry.endDate,
      ], manifestCursor);
      if (manifestCursor < 0) {
        manifestValid = false;
        break;
      }
    }
  }

  if (manifestValid) {
    for (const certification of resume.skills.certifications) {
      manifestCursor = followsInOrder(normalizedText, [
        certification.title,
        certification.issuer,
        certification.issuedAt,
      ], manifestCursor);
      if (manifestCursor < 0) {
        manifestValid = false;
        break;
      }
    }
  }

  if (!manifestValid) {
    issues.push("El parser no conserva en orden los cargos, fechas, estudios o certificados seleccionados.");
  } else {
    checks.push("canonical-content");
    checks.push("record-reading-order");
  }

  const splitExperience = resume.experience.find((entry) => {
    const identifyingValues = [entry.organization || entry.title, entry.title]
      .map(searchable)
      .filter(Boolean);
    const contentValues = [entry.summary, ...entry.highlights]
      .map(searchable)
      .filter(Boolean);
    const page = normalizedPages.find((candidate) =>
      identifyingValues.every((value) => candidate.includes(value))
    );
    return !page || contentValues.some((value) => !page.includes(value));
  });
  if (splitExperience) {
    issues.push(`La experiencia ${splitExperience.organization || splitExperience.title} quedo dividida entre paginas.`);
  } else {
    checks.push("experience-page-integrity");
  }

  if (issues.length) throw new ResumePdfValidationError(issues);

  return {
    passed: true,
    layout,
    pages: totalPages,
    fileSizeBytes: buffer.byteLength,
    textCharacters: extractedText.length,
    checks,
  };
}
