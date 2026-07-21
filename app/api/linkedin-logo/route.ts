import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME, hasAdminSession } from "@/lib/auth";

function isAllowedLinkedInUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const allowedHost = hostname === "linkedin.com" || hostname.endsWith(".linkedin.com");
    const allowedPath = /^\/(company|school)\/[^/]+\/?$/i.test(url.pathname);
    return url.protocol === "https:" && allowedHost && allowedPath;
  } catch {
    return false;
  }
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function resolveLogoUrl(linkedInUrl: string) {
  const response = await fetch(linkedInUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; PortfolioCertificationBot/1.0; +https://www.linkedin.com)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    next: { revalidate: 86400 },
  });

  if (!response.ok) throw new Error("LinkedIn no devolvió una página pública.");

  const html = await response.text();
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]);
  }

  throw new Error("No se encontró un logo público en esa página de LinkedIn.");
}

export async function POST(request: Request) {
  const sessionCookie = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!hasAdminSession(sessionCookie)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = (await request.json()) as { url?: string };
  if (!payload.url || !isAllowedLinkedInUrl(payload.url)) {
    return NextResponse.json(
      { error: "Usa una URL pública de LinkedIn con formato /company/... o /school/...." },
      { status: 400 }
    );
  }

  try {
    const logoUrl = await resolveLogoUrl(payload.url);
    return NextResponse.json({ logoUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo obtener el logo." },
      { status: 422 }
    );
  }
}
