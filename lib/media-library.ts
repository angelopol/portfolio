import { promises as fs } from "fs";
import path from "path";

import type { MediaItem, MediaKind, MediaLibrary } from "@/types/site";

const mediaLibraryPath = path.join(process.cwd(), "content", "media-library.json");
const publicRootPath = path.join(process.cwd(), "public");

function normalizeLibrary(library: MediaLibrary): MediaLibrary {
  return {
    items: [...library.items].sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt)),
  };
}

export async function getMediaLibrary(): Promise<MediaLibrary> {
  const rawContent = await fs.readFile(mediaLibraryPath, "utf8");
  return normalizeLibrary(JSON.parse(rawContent) as MediaLibrary);
}

export async function saveMediaLibrary(library: MediaLibrary): Promise<void> {
  const nextLibrary = `${JSON.stringify(normalizeLibrary(library), null, 2)}\n`;
  await fs.writeFile(mediaLibraryPath, nextLibrary, "utf8");
}

export async function appendMediaItem(item: MediaItem): Promise<MediaLibrary> {
  const currentLibrary = await getMediaLibrary();
  const nextLibrary: MediaLibrary = {
    items: [item, ...currentLibrary.items.filter((entry) => entry.id !== item.id)],
  };

  await saveMediaLibrary(nextLibrary);
  return normalizeLibrary(nextLibrary);
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export function createStoredFileName(fileName: string): string {
  const sanitized = sanitizeFileName(fileName) || "asset";
  return `${Date.now()}-${sanitized}`;
}

export function getUploadFolder(kind: MediaKind, mimeType: string): string {
  if (kind === "image" || mimeType.startsWith("image/")) {
    return path.join(publicRootPath, "uploads", "images");
  }

  return path.join(publicRootPath, "uploads", "documents");
}

export function getPublicUploadUrl(kind: MediaKind, fileName: string, mimeType: string): string {
  if (kind === "image" || mimeType.startsWith("image/")) {
    return `/uploads/images/${fileName}`;
  }

  return `/uploads/documents/${fileName}`;
}

function getPublicFilePath(url: string): string {
  const normalizedUrl = url.startsWith("/") ? url.slice(1) : url;
  return path.join(publicRootPath, normalizedUrl);
}

export async function removeMediaItemById(id: string): Promise<MediaItem | null> {
  const currentLibrary = await getMediaLibrary();
  const existingItem = currentLibrary.items.find((item) => item.id === id);

  if (!existingItem) {
    return null;
  }

  const nextLibrary: MediaLibrary = {
    items: currentLibrary.items.filter((item) => item.id !== id),
  };

  await saveMediaLibrary(nextLibrary);

  try {
    await fs.unlink(getPublicFilePath(existingItem.url));
  } catch {
    // Ignore missing files to keep JSON storage resilient.
  }

  return existingItem;
}
