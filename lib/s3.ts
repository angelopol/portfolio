import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import type { MediaKind } from "@/types/site";

const region = process.env.AWS_S3_REGION?.trim();
const bucket = process.env.AWS_S3_BUCKET?.trim();
const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
const publicBaseUrl = process.env.AWS_S3_PUBLIC_BASE_URL?.trim();
const keyPrefix = process.env.AWS_S3_KEY_PREFIX?.trim() || "portfolio";

let s3Client: S3Client | null = null;

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

export function isS3Configured(): boolean {
  return Boolean(region && bucket && accessKeyId && secretAccessKey);
}

function getS3Client(): S3Client {
  if (!region || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "AWS S3 no está configurado. Define AWS_S3_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY."
    );
  }

  if (!s3Client) {
    s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  return s3Client;
}

function getPublicBaseUrl(): string {
  if (publicBaseUrl) {
    return publicBaseUrl.replace(/\/$/, "");
  }

  if (!bucket || !region) {
    throw new Error("No se pudo construir la URL pública de S3.");
  }

  return `https://${bucket}.s3.${region}.amazonaws.com`;
}

export function buildPublicS3Url(storageKey: string): string {
  return `${getPublicBaseUrl()}/${storageKey}`;
}

export async function uploadPublicFileToS3(options: {
  fileName: string;
  buffer: Buffer;
  mimeType: string;
  kind: MediaKind;
}): Promise<{ storageKey: string; url: string }> {
  const client = getS3Client();
  const storedFileName = createStoredFileName(options.fileName);
  const folder = options.kind === "image" ? "images" : "documents";
  const storageKey = `${keyPrefix}/${folder}/${storedFileName}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      Body: options.buffer,
      ContentType: options.mimeType,
      CacheControl: options.kind === "image" ? "public, max-age=31536000, immutable" : "public, max-age=3600",
      ContentDisposition: options.kind === "document" ? "inline" : undefined,
    })
  );

  return {
    storageKey,
    url: buildPublicS3Url(storageKey),
  };
}

export async function deleteFileFromS3(storageKey: string): Promise<void> {
  const client = getS3Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: storageKey,
    })
  );
}
