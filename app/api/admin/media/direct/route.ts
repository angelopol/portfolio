import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME, hasAdminSession } from "@/lib/auth";
import { appendMediaItem } from "@/lib/media-library";
import { createDirectS3Upload, isS3Configured, verifyDirectS3Upload } from "@/lib/s3";
import type { MediaItem, MediaKind } from "@/types/site";

const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 100 * 1024 * 1024;

function ensureAdmin() {
  return hasAdminSession(cookies().get(ADMIN_COOKIE_NAME)?.value);
}

function validKind(value: unknown): value is MediaKind {
  return value === "image" || value === "document";
}

export async function POST(request: Request) {
  if (!ensureAdmin()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!isS3Configured()) {
    return NextResponse.json({ error: "La subida directa requiere AWS S3 configurado." }, { status: 503 });
  }

  const payload = (await request.json()) as {
    action?: "presign" | "complete";
    fileName?: string;
    mimeType?: string;
    size?: number;
    kind?: MediaKind;
    item?: MediaItem;
  };

  if (payload.action === "presign") {
    if (!payload.fileName || !payload.mimeType || !validKind(payload.kind) || !Number.isFinite(payload.size)) {
      return NextResponse.json({ error: "Metadatos de archivo inválidos." }, { status: 400 });
    }
    if (payload.kind === "image" && !payload.mimeType.startsWith("image/")) {
      return NextResponse.json({ error: "Solo se permiten imágenes en esta sección." }, { status: 400 });
    }
    if (payload.kind === "document" && payload.mimeType !== "application/pdf") {
      return NextResponse.json({ error: "El certificado debe ser un PDF." }, { status: 400 });
    }
    const maximum = payload.kind === "image" ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE;
    if ((payload.size ?? 0) <= 0 || (payload.size ?? 0) > maximum) {
      return NextResponse.json({ error: `El archivo supera el máximo de ${maximum / 1024 / 1024} MB.` }, { status: 413 });
    }

    const signed = await createDirectS3Upload({
      fileName: payload.fileName,
      mimeType: payload.mimeType,
      kind: payload.kind,
    });
    const item: MediaItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      kind: payload.kind,
      name: payload.fileName,
      url: signed.url,
      storageKey: signed.storageKey,
      mimeType: payload.mimeType,
      size: payload.size ?? 0,
      uploadedAt: new Date().toISOString(),
    };
    return NextResponse.json({ uploadUrl: signed.uploadUrl, headers: signed.headers, item });
  }

  if (payload.action === "complete" && payload.item?.storageKey) {
    const uploaded = await verifyDirectS3Upload(payload.item.storageKey);
    if (uploaded.size !== payload.item.size) {
      return NextResponse.json({ error: "El tamaño del archivo subido no coincide." }, { status: 422 });
    }
    await appendMediaItem({ ...payload.item, mimeType: uploaded.mimeType, size: uploaded.size });
    revalidatePath("/");
    revalidatePath("/control-room");
    revalidatePath("/control-room/[section]", "page");
    return NextResponse.json({ item: { ...payload.item, mimeType: uploaded.mimeType, size: uploaded.size } });
  }

  return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
}
