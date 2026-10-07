import type { SiteContent } from "@/types/site";

export type AssistantChange = { path: string; value: unknown };
export type ChatMessage = { role: "user" | "assistant"; text: string };
type Shape = "string" | "boolean" | Shape[] | { [key: string]: Shape };
const strings = (...keys: string[]) =>
  Object.fromEntries(keys.map((key) => [key, "string" as const]));
const career: Shape = {
  ...strings(
    "id",
    "title",
    "organization",
    "location",
    "startDate",
    "endDate",
    "description",
  ),
  references: [strings("label", "url")],
};
export const contentShape: Shape = {
  site: strings("name", "initials", "role", "email", "location"),
  contact: strings(
    "location",
    "phone",
    "email",
    "githubUrl",
    "linkedinUrl",
    "portfolioUrl",
  ),
  theme: strings(
    "accent",
    "accentSoft",
    "background",
    "surface",
    "card",
    "text",
    "muted",
    "ring",
  ),
  home: {
    ...strings(
      "eyebrow",
      "title",
      "subtitle",
      "description",
      "availability",
      "location",
    ),
    primaryCta: strings("label", "href"),
    secondaryCta: strings("label", "href"),
    metrics: [strings("label", "value")],
    highlights: ["string"],
  },
  about: {
    ...strings("headline", "profileImage"),
    summary: ["string"],
    skillset: ["string"],
    toolset: ["string"],
    focusAreas: ["string"],
  },
  workExperience: [career],
  education: [career],
  certifications: [
    {
      ...strings(
        "id",
        "title",
        "issuer",
        "description",
        "certificateUrl",
        "verificationUrl",
        "organizationUrl",
        "issuedAt?",
        "credentialId?",
        "logoUrl?",
      ),
      "favorite?": "boolean",
    },
  ],
  projects: [
    {
      ...strings(
        "id",
        "title",
        "description",
        "image",
        "demoUrl?",
        "githubUrl?",
      ),
      stack: ["string"],
      "gallery?": ["string"],
      "featured?": "boolean",
    },
  ],
  socials: [strings("label", "href")],
  resume: {
    ...strings(
      "fullName",
      "title",
      "description",
      "previewTitle",
      "previewText",
      "downloadUrl",
      "downloadUrlEn",
      "downloadUrlEs",
      "openLabel",
      "downloadLabel",
    ),
    softSkills: ["string"],
    languages: ["string"],
  },
  github: { enabled: "boolean", ...strings("username", "repository") },
  translations: { es: { "*": "string" } },
};

function validate(value: unknown, shape: Shape, path = "") {
  if (typeof shape === "string") {
    if (
      typeof value !== shape ||
      (typeof value === "string" && value.length > 30000)
    )
      throw new Error(`Valor inválido: ${path}`);
    if (typeof value === "string") {
      const key = path.split(".").pop() || "";
      if (
        /url|href|image|profileImage/i.test(key) &&
        value &&
        !/^(https?:\/\/|mailto:|tel:|#|\/(?!\/))/i.test(value) &&
        !/^[a-z\d][a-z\d.-]*\.[a-z]{2,}(?:[/?#][^\s]*)?$/i.test(value)
      )
        throw new Error(`Enlace inválido: ${path}`);
      if (
        path.startsWith("theme.") &&
        !/^#[a-f\d]{3}(?:[a-f\d]{3})?$/i.test(value)
      )
        throw new Error(`Color inválido: ${path}`);
    }
    return;
  }
  if (Array.isArray(shape)) {
    if (!Array.isArray(value) || value.length > 300)
      throw new Error(`Lista inválida: ${path}`);
    value.forEach((item, index) =>
      validate(item, shape[0], `${path}.${index}`),
    );
    const ids = value
      .filter((item) => item && typeof item === "object" && "id" in item)
      .map((item) => item.id);
    if (ids.some((id) => !id) || new Set(ids).size !== ids.length)
      throw new Error(`Identificadores duplicados o vacíos: ${path}`);
    return;
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`Objeto inválido: ${path}`);
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (["__proto__", "prototype", "constructor"].includes(key))
      throw new Error("Campo no permitido.");
    const rule = Object.hasOwn(shape, key)
      ? shape[key]
      : Object.hasOwn(shape, `${key}?`)
        ? shape[`${key}?`]
        : shape["*"];
    if (!rule) throw new Error(`Campo desconocido: ${path}.${key}`);
    validate(record[key], rule, `${path}.${key}`.replace(/^\./, ""));
  }
  for (const key of Object.keys(shape))
    if (key !== "*" && !key.endsWith("?") && !(key in record))
      throw new Error(`Falta el campo: ${path}.${key}`);
}

export function validateAssistantContent(
  content: unknown,
): asserts content is SiteContent {
  validate(content, contentShape);
  const github = (content as SiteContent).github;
  if (
    !/^[a-z\d][a-z\d-]{0,38}$/i.test(github.username) ||
    !/^[\w.-]{1,100}$/.test(github.repository)
  )
    throw new Error("Usuario o repositorio de GitHub inválido.");
}

export function applyAssistantChanges(
  content: SiteContent,
  changes: AssistantChange[],
): SiteContent {
  if (!Array.isArray(changes) || changes.length > 30)
    throw new Error("Demasiados cambios.");
  const next = JSON.parse(JSON.stringify(content)) as SiteContent;
  for (const change of changes) {
    if (
      !change ||
      typeof change.path !== "string" ||
      !Object.hasOwn(change, "value")
    )
      throw new Error("Cambio inválido.");
    const segments = change.path.split(".");
    if (
      !segments.length ||
      segments.some(
        (segment) =>
          !segment ||
          ["__proto__", "prototype", "constructor"].includes(segment),
      )
    )
      throw new Error("Ruta no permitida.");
    let target: unknown = next;
    for (const segment of segments.slice(0, -1)) {
      if (
        !target ||
        typeof target !== "object" ||
        !Object.hasOwn(target, segment)
      )
        throw new Error(`Ruta desconocida: ${change.path}`);
      target = (target as Record<string, unknown>)[segment];
    }
    if (!target || typeof target !== "object")
      throw new Error("Destino inválido.");
    const key = segments[segments.length - 1];
    if (
      Array.isArray(target) &&
      (!/^\d+$/.test(key) || Number(key) >= target.length)
    )
      throw new Error("Índice inválido.");
    (target as Record<string, unknown>)[key] = change.value;
  }
  validateAssistantContent(next);
  return next;
}
