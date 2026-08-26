import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME, hasAdminSession } from "@/lib/auth";
import { sanitizeGeneratedResumeDraft } from "@/lib/resume/draft";
import { generateResumeContent } from "@/lib/resume/generate";
import { renderResumePdf } from "@/lib/resume/pdf";
import { getSiteContent, normalizeSiteContent } from "@/lib/site-content";
import type { SiteContent } from "@/types/site";
import {
  DEFAULT_RESUME_SECTIONS,
  type GeneratedResume,
  type ResumeGenerationRequest,
} from "@/types/resume";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Keep this compatible with Vercel Hobby's per-function ceiling.
export const maxDuration = 60;

const MAX_REQUEST_BYTES = 3_500_000;

class BadRequestError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function optionalText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : undefined;
}

function optionalJobImage(value: unknown): ResumeGenerationRequest["jobImage"] {
  if (value === undefined || value === null) return undefined;
  if (!isRecord(value)) throw new BadRequestError("La imagen de la oferta no tiene un formato valido.");
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;
  const mimeType = allowedMimeTypes.find((candidate) => candidate === value.mimeType);
  if (!mimeType || typeof value.data !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(value.data)) {
    throw new BadRequestError("La imagen de la oferta no tiene un formato valido.");
  }
  if (Buffer.byteLength(value.data, "base64") > 2_000_000) {
    throw new BadRequestError("La imagen de la oferta no puede superar 2 MB.");
  }
  return { mimeType, data: value.data };
}

function optionalCertificationLimit(value: unknown) {
  if (value === null || value === undefined || value === "") return undefined;
  const candidate = Number(value);
  if (!Number.isInteger(candidate) || candidate < 1 || candidate > 50) {
    throw new BadRequestError("El limite de certificaciones debe estar entre 1 y 50.");
  }
  return candidate;
}

function optionalExperienceIds(value: unknown) {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    throw new BadRequestError("La selección de experiencias no tiene un formato válido.");
  }
  return Array.from(new Set(
    value.filter((item): item is string => typeof item === "string")
      .map((item) => item.trim().slice(0, 200))
      .filter(Boolean),
  )).slice(0, 6);
}

function resumeSections(value: unknown) {
  const source = isRecord(value) ? value : {};
  return {
    summary: source.summary !== false,
    experience: source.experience !== false,
    education: source.education !== false,
    certifications: source.certifications !== false,
    skills: source.skills !== false,
  } satisfies typeof DEFAULT_RESUME_SECTIONS;
}

function withoutBlankLines(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");
}

function compactResumeText(resume: GeneratedResume): GeneratedResume {
  return {
    ...resume,
    summary: withoutBlankLines(resume.summary),
    experience: resume.experience.map((entry) => ({
      ...entry,
      summary: withoutBlankLines(entry.summary),
      highlights: entry.highlights.map(withoutBlankLines).filter(Boolean),
    })),
    education: resume.education.map((entry) => ({
      ...entry,
      description: withoutBlankLines(entry.description),
    })),
  };
}

function applyGenerationOptions(
  resume: GeneratedResume,
  request: ResumeGenerationRequest,
): GeneratedResume {
  const sections = { ...DEFAULT_RESUME_SECTIONS, ...request.sections };
  const nextResume: GeneratedResume = {
    ...resume,
    summary: sections.summary ? resume.summary : "",
    experience: sections.experience ? resume.experience : [],
    education: sections.education ? resume.education : [],
    skills: {
      technical: sections.skills ? resume.skills.technical : [],
      soft: sections.skills ? resume.skills.soft : [],
      languages: sections.skills ? resume.skills.languages : [],
      certifications: sections.certifications
        ? resume.skills.certifications.slice(0, request.certificationLimit)
        : [],
    },
  };
  return request.compactSpacing ? compactResumeText(nextResume) : nextResume;
}

function assertSiteContent(value: unknown): asserts value is SiteContent {
  if (!isRecord(value)) throw new BadRequestError("El borrador de contenido no es valido.");

  const requiredObjects = ["site", "home", "about", "resume", "theme"];
  const requiredArrays = ["socials", "projects", "certifications", "workExperience", "education"];
  if (requiredObjects.some((key) => !isRecord(value[key]))) {
    throw new BadRequestError("El borrador no contiene todos los modulos requeridos.");
  }
  if (requiredArrays.some((key) => !Array.isArray(value[key]))) {
    throw new BadRequestError("Las colecciones del borrador no tienen un formato valido.");
  }
}

async function readPayload(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_REQUEST_BYTES) throw new BadRequestError("La solicitud es demasiado grande.");

  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_REQUEST_BYTES) {
    throw new BadRequestError("La solicitud es demasiado grande.");
  }

  try {
    const value = JSON.parse(raw) as unknown;
    if (!isRecord(value)) throw new BadRequestError("La solicitud no contiene un objeto JSON valido.");
    return value;
  } catch (error) {
    if (error instanceof BadRequestError) throw error;
    throw new BadRequestError("La solicitud no contiene JSON valido.");
  }
}

function safeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function POST(request: Request) {
  if (!hasAdminSession(cookies().get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const payload = await readPayload(request);
    const layout = payload.layout === "visual" ? "visual" : "ats";
    const experienceDetail = payload.experienceDetail === "concise" ||
      payload.experienceDetail === "detailed"
      ? payload.experienceDetail
      : "explanatory";
    const generationRequest: ResumeGenerationRequest = {
      language: payload.language === "es" ? "es" : "en",
      layout,
      experienceDetail,
      experienceIds: optionalExperienceIds(payload.experienceIds),
      certificationLimit: optionalCertificationLimit(payload.certificationLimit),
      sections: resumeSections(payload.sections),
      compactSpacing: payload.compactSpacing === true,
      profileImageUrl: optionalText(payload.profileImageUrl, 2048),
      targetRole: optionalText(payload.targetRole, 240),
      jobDescription: optionalText(payload.jobDescription, 6000),
      jobImage: optionalJobImage(payload.jobImage),
      generateDirectContactMessage: payload.generateDirectContactMessage === true,
      additionalInstructions: optionalText(payload.additionalInstructions, 2000),
    };

    let content: SiteContent;
    if (payload.content !== undefined) {
      assertSiteContent(payload.content);
      content = normalizeSiteContent(payload.content);
    } else {
      content = await getSiteContent();
    }

    const mode = payload.mode === "draft" || payload.mode === "render" ? payload.mode : "pdf";
    if (mode === "render" && !isRecord(payload.resumeDraft)) {
      throw new BadRequestError("El borrador editable del CV no tiene un formato valido.");
    }

    const generated = mode === "render"
      ? {
          resume: applyGenerationOptions(
            sanitizeGeneratedResumeDraft(payload.resumeDraft, generationRequest.language),
            generationRequest,
          ),
          model: optionalText(payload.model, 120) || "borrador editado",
          directContactMessage: undefined,
        }
      : await generateResumeContent(content, generationRequest);

    if (mode === "draft") {
      return NextResponse.json(
        { resume: generated.resume, model: generated.model, directContactMessage: generated.directContactMessage },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const resume = applyGenerationOptions(generated.resume, generationRequest);
    const { model } = generated;
    const rendered = await renderResumePdf(
      resume,
      content.about.profileImage,
      layout,
      generationRequest.profileImageUrl,
      generationRequest.compactSpacing,
    );
    const fileName = `${safeFileName(resume.fullName) || "resume"}-${generationRequest.language}-${layout}.pdf`;

    return new Response(new Uint8Array(rendered.buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Resume-Model": model,
        "X-Resume-Layout": layout,
        "X-Resume-Experience-Detail": experienceDetail,
        "X-Resume-ATS": layout === "ats" ? "strict-passed" : "text-layer-passed",
        "X-Resume-Pages": String(rendered.validation.pages),
        "X-Resume-Compaction": String(rendered.compactionLevel),
        "X-Resume-Certifications": String(rendered.certificationsIncluded),
        "X-Resume-Image-Included": String(rendered.imageIncluded),
      },
    });
  } catch (error) {
    const status = error instanceof BadRequestError ? 400 : 502;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo generar el CV." },
      { status }
    );
  }
}
