import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME, hasAdminSession } from "@/lib/auth";
import { appendMediaItem, getMediaLibrary } from "@/lib/media-library";
import { isS3Configured, uploadPublicFileToS3 } from "@/lib/s3";

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

function linkedInOrganizationKey(linkedInUrl: string) {
  const segments = new URL(linkedInUrl).pathname.split("/").filter(Boolean);
  const type = segments[0]?.toLowerCase() || "organization";
  const slug = segments[1]?.toLowerCase() || "linkedin";
  return `${type}-${slug}`.replace(/[^a-z0-9_-]/g, "-");
}

function logoFileName(linkedInUrl: string, mimeType: string) {
  const extension = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : mimeType.includes("svg") ? "svg" : "jpg";
  return `linkedin-${linkedInOrganizationKey(linkedInUrl)}.${extension}`;
}

async function findStoredLogo(linkedInUrl: string) {
  const key = linkedInOrganizationKey(linkedInUrl);
  const legacySlug = key.replace(/^(?:company|school)-/, "");
  const library = await getMediaLibrary();
  return library.items.find((item) => {
    const name = item.name.toLowerCase();
    return item.kind === "image" && (
      name.startsWith(`linkedin-${key}.`) ||
      name.startsWith(`linkedin-${legacySlug}.`)
    );
  })?.url;
}

async function persistLogoToS3(sourceUrl: string, linkedInUrl: string) {
  if (!isS3Configured()) {
    throw new Error("AWS S3 debe estar configurado para guardar el logo de LinkedIn.");
  }
  const source = new URL(sourceUrl);
  if (source.protocol !== "https:") throw new Error("LinkedIn devolvió una URL de logo no segura.");

  const response = await fetch(source, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; PortfolioCertificationBot/1.0)" },
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error("No se pudo descargar el logo público de LinkedIn.");

  const mimeType = (response.headers.get("content-type") || "image/jpeg").split(";")[0];
  if (!mimeType.startsWith("image/")) throw new Error("El recurso obtenido desde LinkedIn no es una imagen.");
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > 8 * 1024 * 1024) throw new Error("El logo de LinkedIn supera el máximo de 8 MB.");

  const fileName = logoFileName(linkedInUrl, mimeType);
  const uploaded = await uploadPublicFileToS3({ fileName, buffer, mimeType, kind: "image" });
  await appendMediaItem({
    id: `${Date.now()}-${fileName}`,
    kind: "image",
    name: fileName,
    url: uploaded.url,
    storageKey: uploaded.storageKey,
    mimeType,
    size: buffer.length,
    uploadedAt: new Date().toISOString(),
  });
  return uploaded.url;
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
    const storedLogoUrl = await findStoredLogo(payload.url);
    if (storedLogoUrl) {
      return NextResponse.json({ logoUrl: storedLogoUrl, reused: true });
    }

    const externalLogoUrl = await resolveLogoUrl(payload.url);
    const logoUrl = await persistLogoToS3(externalLogoUrl, payload.url);
    return NextResponse.json({ logoUrl, reused: false });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo obtener el logo." },
      { status: 422 }
    );
  }
}
