import { promises as fs } from "fs";
import path from "path";

import { deleteFileFromS3, isS3Configured } from "@/lib/s3";
import {
  getSupabaseAdminClient,
  isMissingSupabaseTableError,
  isSupabaseConfigured,
} from "@/lib/supabase";
import type { MediaItem, MediaKind, MediaLibrary } from "@/types/site";

const mediaLibraryPath = path.join(process.cwd(), "content", "media-library.json");
const publicRootPath = path.join(process.cwd(), "public");

function normalizeLibrary(library: MediaLibrary): MediaLibrary {
  return {
    items: [...library.items].sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt)),
  };
}

export async function getMediaLibrary(): Promise<MediaLibrary> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("media_library")
      .select("id, kind, name, url, storage_key, mime_type, size, uploaded_at")
      .order("uploaded_at", { ascending: false });

    if (error) {
      if (isMissingSupabaseTableError(error.message)) {
        const rawContent = await fs.readFile(mediaLibraryPath, "utf8");
        return normalizeLibrary(JSON.parse(rawContent) as MediaLibrary);
      }

      throw new Error(`No se pudo cargar la librería de archivos desde Supabase: ${error.message}`);
    }

    return normalizeLibrary({
      items: (data ?? []).map((item) => ({
        id: item.id as string,
        kind: item.kind as MediaKind,
        name: item.name as string,
        url: item.url as string,
        storageKey: (item.storage_key as string | null) ?? undefined,
        mimeType: item.mime_type as string,
        size: item.size as number,
        uploadedAt: item.uploaded_at as string,
      })),
    });
  }

  const rawContent = await fs.readFile(mediaLibraryPath, "utf8");
  return normalizeLibrary(JSON.parse(rawContent) as MediaLibrary);
}

export async function saveMediaLibrary(library: MediaLibrary): Promise<void> {
  const nextLibrary = `${JSON.stringify(normalizeLibrary(library), null, 2)}\n`;

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdminClient();
    const normalized = normalizeLibrary(library);
    const { error: truncateError } = await supabase.from("media_library").delete().gte("size", 0);

    if (truncateError) {
      if (isMissingSupabaseTableError(truncateError.message)) {
        await fs.writeFile(mediaLibraryPath, nextLibrary, "utf8");
        return;
      }

      throw new Error(`No se pudo limpiar la librería remota: ${truncateError.message}`);
    }

    if (normalized.items.length > 0) {
      const { error: insertError } = await supabase.from("media_library").insert(
        normalized.items.map((item) => ({
          id: item.id,
          kind: item.kind,
          name: item.name,
          url: item.url,
          storage_key: item.storageKey ?? null,
          mime_type: item.mimeType,
          size: item.size,
          uploaded_at: item.uploadedAt,
        }))
      );

      if (insertError) {
        if (isMissingSupabaseTableError(insertError.message)) {
          await fs.writeFile(mediaLibraryPath, nextLibrary, "utf8");
          return;
        }

        throw new Error(`No se pudo escribir la librería remota: ${insertError.message}`);
      }
    }

    return;
  }

  await fs.writeFile(mediaLibraryPath, nextLibrary, "utf8");
}

export async function appendMediaItem(item: MediaItem): Promise<MediaLibrary> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("media_library").upsert(
      {
        id: item.id,
        kind: item.kind,
        name: item.name,
        url: item.url,
        storage_key: item.storageKey ?? null,
        mime_type: item.mimeType,
        size: item.size,
        uploaded_at: item.uploadedAt,
      },
      { onConflict: "id" }
    );

    if (error) {
      if (isMissingSupabaseTableError(error.message)) {
        const currentLibrary = await getMediaLibrary();
        const nextLibrary: MediaLibrary = {
          items: [item, ...currentLibrary.items.filter((entry) => entry.id !== item.id)],
        };

        await saveMediaLibrary(nextLibrary);
        return normalizeLibrary(nextLibrary);
      }

      throw new Error(`No se pudo guardar el archivo en Supabase: ${error.message}`);
    }

    return getMediaLibrary();
  }

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
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdminClient();
    const { data: existingItem, error: loadError } = await supabase
      .from("media_library")
      .select("id, kind, name, url, storage_key, mime_type, size, uploaded_at")
      .eq("id", id)
      .maybeSingle();

    if (loadError) {
      if (isMissingSupabaseTableError(loadError.message)) {
        const currentLibrary = await getMediaLibrary();
        const existingLocalItem = currentLibrary.items.find((item) => item.id === id);

        if (!existingLocalItem) {
          return null;
        }

        const nextLibrary: MediaLibrary = {
          items: currentLibrary.items.filter((item) => item.id !== id),
        };

        await saveMediaLibrary(nextLibrary);
        return existingLocalItem;
      }

      throw new Error(`No se pudo cargar el archivo desde Supabase: ${loadError.message}`);
    }

    if (!existingItem) {
      return null;
    }

    const item: MediaItem = {
      id: existingItem.id as string,
      kind: existingItem.kind as MediaKind,
      name: existingItem.name as string,
      url: existingItem.url as string,
      storageKey: (existingItem.storage_key as string | null) ?? undefined,
      mimeType: existingItem.mime_type as string,
      size: existingItem.size as number,
      uploadedAt: existingItem.uploaded_at as string,
    };

    const { error: deleteError } = await supabase.from("media_library").delete().eq("id", id);

    if (deleteError) {
      if (isMissingSupabaseTableError(deleteError.message)) {
        const currentLibrary = await getMediaLibrary();
        const existingLocalItem = currentLibrary.items.find((entry) => entry.id === id);

        if (!existingLocalItem) {
          return null;
        }

        const nextLibrary: MediaLibrary = {
          items: currentLibrary.items.filter((entry) => entry.id !== id),
        };

        await saveMediaLibrary(nextLibrary);
        return existingLocalItem;
      }

      throw new Error(`No se pudo eliminar el archivo de Supabase: ${deleteError.message}`);
    }

    if (item.storageKey && isS3Configured()) {
      await deleteFileFromS3(item.storageKey);
    }

    return item;
  }

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
