import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME, hasAdminSession } from "@/lib/auth";

type ImportedCertification = {
  title?: unknown;
  issuer?: unknown;
  issuedAt?: unknown;
  credentialId?: unknown;
  verificationUrl?: unknown;
  organizationUrl?: unknown;
};

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
};

function validProfileCertificationsUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      (hostname === "linkedin.com" || hostname.endsWith(".linkedin.com")) &&
      /^\/in\/[^/]+\/details\/certifications\/?$/i.test(url.pathname)
    );
  } catch {
    return false;
  }
}

function cleanPage(html: string) {
  return html
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/\s{3,}/g, " ")
    .slice(0, 350_000);
}

function parseGeminiJson(value: string) {
  const cleaned = value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const parsed = JSON.parse(cleaned) as
    | { certifications?: ImportedCertification[] }
    | ImportedCertification[];
  return Array.isArray(parsed) ? parsed : (parsed.certifications ?? []);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  if (!hasAdminSession(cookies().get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = (await request.json()) as { url?: string; content?: string };
  const linkedInUrl = payload.url?.trim() ?? "";
  const suppliedContent = payload.content?.trim() ?? "";
  if (!suppliedContent && !validProfileCertificationsUrl(linkedInUrl)) {
    return NextResponse.json(
      {
        error:
          "Usa una URL de LinkedIn con formato /in/usuario/details/certifications/.",
      },
      { status: 400 },
    );
  }

  const apiKey = process.env.AI_AGENT_API_KEY?.trim();
  const model = (process.env.AI_AGENT_MODEL || "gemini-3.1-flash-lite")
    .replace(/[*`"']/g, "")
    .trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI_AGENT_API_KEY no está configurada." },
      { status: 503 },
    );
  }

  if (suppliedContent.length > 1_000_000) {
    return NextResponse.json(
      { error: "El contenido procesado supera el máximo de 1 MB." },
      { status: 413 },
    );
  }

  try {
    let pageContent = suppliedContent;
    if (!pageContent) {
      const linkedInResponse = await fetch(linkedInUrl, {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
        },
        redirect: "follow",
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });

      if (!linkedInResponse.ok) {
        throw new Error(
          `LinkedIn bloqueó la lectura pública (estado ${linkedInResponse.status}).`,
        );
      }

      pageContent = await linkedInResponse.text();
      if (/authwall|checkpoint\/challenge|sign in to view/i.test(pageContent)) {
        throw new Error(
          "LinkedIn solicitó iniciar sesión y no expuso las certificaciones públicamente.",
        );
      }
    }

    const prompt = [
      "Extract only professional certifications and licenses from this LinkedIn certifications page.",
      'Return JSON with this exact shape: {"certifications":[{"title":"","issuer":"","issuedAt":"","credentialId":"","verificationUrl":"","organizationUrl":""}]}',
      "Do not invent values. Use empty strings for unavailable fields. Exclude education, jobs, skills and recommendations.",
      "Preserve certificate and issuer names as displayed. Return JSON only.",
      "LINKEDIN PAGE START",
      cleanPage(pageContent),
      "LINKEDIN PAGE END",
    ].join("\n");

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
      },
    );

    const data = (await geminiResponse.json()) as GeminiResponse;
    if (!geminiResponse.ok)
      throw new Error(
        data.error?.message || "Gemini no pudo analizar la página.",
      );
    const raw =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("") ?? "";
    const certifications = parseGeminiJson(raw)
      .map((item) => ({
        title: stringValue(item.title),
        issuer: stringValue(item.issuer),
        issuedAt: stringValue(item.issuedAt),
        credentialId: stringValue(item.credentialId),
        verificationUrl: stringValue(item.verificationUrl),
        organizationUrl: stringValue(item.organizationUrl),
      }))
      .filter((item) => item.title);

    if (certifications.length === 0) {
      throw new Error(
        "No se encontraron certificaciones visibles en la página pública.",
      );
    }

    return NextResponse.json({ certifications });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudieron importar las certificaciones.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
