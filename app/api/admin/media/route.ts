import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

import { ADMIN_COOKIE_NAME, hasAdminSession } from "@/lib/auth";
import {
  appendMediaItem,
  createStoredFileName,
  getMediaLibrary,
  getPublicUploadUrl,
  getUploadFolder,
  removeMediaItemById,
} from "@/lib/media-library";
import type { MediaItem, MediaKind } from "@/types/site";

function ensureAdmin() {
  const sessionCookie = cookies().get(ADMIN_COOKIE_NAME)?.value;
  return hasAdminSession(sessionCookie);
}

export async function GET() {
  if (!ensureAdmin()) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const library = await getMediaLibrary();
  return NextResponse.json(library);
}

export async function POST(request: Request) {
  if (!ensureAdmin()) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const requestedKind = formData.get("kind");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
  }

  if (typeof requestedKind !== "string") {
    return NextResponse.json({ error: "Tipo de archivo inválido." }, { status: 400 });
  }

  const kind = requestedKind === "document" ? "document" : "image";
  const mimeType = file.type || (kind === "document" ? "application/octet-stream" : "image/jpeg");

  if (kind === "image" && !mimeType.startsWith("image/")) {
    return NextResponse.json({ error: "Solo se permiten imágenes en esta sección." }, { status: 400 });
  }

  if (kind === "document" && mimeType !== "application/pdf") {
    return NextResponse.json({ error: "El CV debe subirse en formato PDF." }, { status: 400 });
  }

  const storedFileName = createStoredFileName(file.name);
  const uploadFolder = getUploadFolder(kind as MediaKind, mimeType);
  const uploadPath = path.join(uploadFolder, storedFileName);
  const uploadUrl = getPublicUploadUrl(kind as MediaKind, storedFileName, mimeType);

  await fs.mkdir(uploadFolder, { recursive: true });

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(uploadPath, fileBuffer);

  const item: MediaItem = {
    id: `${Date.now()}-${storedFileName}`,
    kind: kind as MediaKind,
    name: file.name,
    url: uploadUrl,
    mimeType,
    size: file.size,
    uploadedAt: new Date().toISOString(),
  };

  await appendMediaItem(item);

  revalidatePath("/");
  revalidatePath("/control-room");

  return NextResponse.json({ item });
}

export async function DELETE(request: Request) {
  if (!ensureAdmin()) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Debes indicar el archivo a eliminar." }, { status: 400 });
  }

  const removedItem = await removeMediaItemById(id);

  if (!removedItem) {
    return NextResponse.json({ error: "Archivo no encontrado." }, { status: 404 });
  }

  revalidatePath("/");
  revalidatePath("/control-room");

  return NextResponse.json({ ok: true, item: removedItem });
}
