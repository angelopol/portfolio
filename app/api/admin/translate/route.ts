import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME, hasAdminSession } from "@/lib/auth";

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
};

function ensureAdmin() {
  return hasAdminSession(cookies().get(ADMIN_COOKIE_NAME)?.value);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanTranslation(value: string, context?: string) {
  let cleaned = value
    .trim()
    .replace(/^```(?:text|plaintext|spanish|español)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  if (context?.trim()) {
    const contextPrefix = new RegExp(
      `^${escapeRegExp(context.trim())}\\s*(?:[·:—-]\\s*|\\r?\\n)`,
      "i"
    );
    cleaned = cleaned.replace(contextPrefix, "").trim();
  }

  return cleaned
    .replace(/^(?:traducción(?:\s+al\s+español)?|español)\s*:\s*/i, "")
    .trim();
}

export async function POST(request: Request) {
  if (!ensureAdmin()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const apiKey = process.env.AI_AGENT_API_KEY?.trim();
  const model = (process.env.AI_AGENT_MODEL || "gemini-3.1-flash-lite")
    .replace(/[*`"']/g, "")
    .trim();

  if (!apiKey) {
    return NextResponse.json(
      { error: "AI_AGENT_API_KEY no está configurada en el servidor." },
      { status: 503 }
    );
  }

  const payload = (await request.json()) as { text?: string; context?: string };
  const text = payload.text?.trim();

  if (!text) {
    return NextResponse.json({ error: "No hay texto para traducir." }, { status: 400 });
  }

  if (text.length > 12000) {
    return NextResponse.json({ error: "El texto es demasiado largo." }, { status: 413 });
  }

  const prompt = [
    "Translate only the source content below from English to natural, professional Latin American Spanish.",
    "Preserve product names, technology names, URLs, identifiers, punctuation, and the original formatting.",
    "The field type is metadata for meaning only. Never copy it, translate it, or add it to the output.",
    "Do not add a title, field name, prefix, explanation, quotation marks, or Markdown.",
    "Return exactly and exclusively the translated source content.",
    payload.context ? `FIELD TYPE (DO NOT OUTPUT): ${payload.context}` : "",
    "",
    "SOURCE CONTENT START",
    text,
    "SOURCE CONTENT END",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
        }),
        cache: "no-store",
      }
    );

    const data = (await response.json()) as GeminiResponse;
    if (!response.ok) {
      throw new Error(data.error?.message || "Gemini no pudo generar la traducción.");
    }

    const rawTranslation = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    const translation = rawTranslation
      ? cleanTranslation(rawTranslation, payload.context)
      : "";

    if (!translation) throw new Error("Gemini devolvió una respuesta vacía.");

    return NextResponse.json({ translation, model });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo sugerir la traducción." },
      { status: 502 }
    );
  }
}
