import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME, hasAdminSession } from "@/lib/auth";
import { generateResumeContent } from "@/lib/resume/generate";
import { renderResumePdf } from "@/lib/resume/pdf";
import { getSiteContent, normalizeSiteContent } from "@/lib/site-content";
import type { SiteContent } from "@/types/site";
import type { ResumeGenerationRequest } from "@/types/resume";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Keep this compatible with Vercel Hobby's per-function ceiling.
export const maxDuration = 60;

const MAX_REQUEST_BYTES = 1_000_000;

class BadRequestError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function optionalText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : undefined;
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
    const generationRequest: ResumeGenerationRequest = {
      language: payload.language === "es" ? "es" : "en",
      layout,
      profileImageUrl: optionalText(payload.profileImageUrl, 2048),
      targetRole: optionalText(payload.targetRole, 240),
      jobDescription: optionalText(payload.jobDescription, 6000),
      additionalInstructions: optionalText(payload.additionalInstructions, 2000),
    };

    let content: SiteContent;
    if (payload.content !== undefined) {
      assertSiteContent(payload.content);
      content = normalizeSiteContent(payload.content);
    } else {
      content = await getSiteContent();
    }

    const { resume, model } = await generateResumeContent(content, generationRequest);
    const rendered = await renderResumePdf(
      resume,
      content.about.profileImage,
      layout,
      generationRequest.profileImageUrl
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
        "X-Resume-ATS": layout === "ats" ? "strict-passed" : "text-layer-passed",
        "X-Resume-Pages": String(rendered.validation.pages),
        "X-Resume-Compaction": String(rendered.compactionLevel),
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
