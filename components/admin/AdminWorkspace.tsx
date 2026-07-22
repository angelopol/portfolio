"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiAward,
  FiArrowDown,
  FiArrowUp,
  FiBookOpen,
  FiBriefcase,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiCode,
  FiEye,
  FiFileText,
  FiGrid,
  FiHome,
  FiImage,
  FiLinkedin,
  FiLogOut,
  FiMove,
  FiPlus,
  FiSave,
  FiSettings,
  FiStar,
  FiTrash2,
  FiUploadCloud,
  FiUser,
} from "react-icons/fi";

import type { Certification, Project, SiteContent } from "@/types/site";
import { TranslationEditor } from "@/components/admin/TranslationEditor";
import { CareerEntriesEditor } from "@/components/admin/CareerEntriesEditor";
import { ResumeBuilder } from "@/components/admin/ResumeBuilder";

export type AdminSection =
  | "dashboard"
  | "home"
  | "about"
  | "experience"
  | "education"
  | "projects"
  | "certifications"
  | "resume-builder"
  | "settings";

const navigation: Array<{
  section: AdminSection;
  label: string;
  description: string;
  icon: typeof FiGrid;
}> = [
  {
    section: "dashboard",
    label: "Resumen",
    description: "Estado general",
    icon: FiGrid,
  },
  {
    section: "home",
    label: "Inicio",
    description: "Hero y métricas",
    icon: FiHome,
  },
  {
    section: "about",
    label: "Perfil & skills",
    description: "Acerca de ti",
    icon: FiUser,
  },
  {
    section: "experience",
    label: "Experiencia",
    description: "Trayectoria laboral",
    icon: FiBriefcase,
  },
  {
    section: "education",
    label: "Educación",
    description: "Preparación profesional",
    icon: FiBookOpen,
  },
  {
    section: "projects",
    label: "Proyectos",
    description: "Portfolio",
    icon: FiBriefcase,
  },
  {
    section: "certifications",
    label: "Certificaciones",
    description: "Credenciales",
    icon: FiAward,
  },
  {
    section: "resume-builder",
    label: "Generar CV",
    description: "Gemini + PDF",
    icon: FiFileText,
  },
  {
    section: "settings",
    label: "Configuración",
    description: "Tema, CV y JSON",
    icon: FiSettings,
  },
];

const fieldClass =
  "w-full rounded-2xl border border-white/10 bg-slate-950/65 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[var(--color-accent)]";
const labelClass =
  "mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400";
const ADMIN_PAGE_SIZE = 5;

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function lines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeLinkedInOrganizationUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return `${url.hostname.toLowerCase().replace(/^www\./, "")}${url.pathname.toLowerCase().replace(/\/+$/, "")}`;
  } catch {
    return value.trim().toLowerCase().replace(/\/+$/, "");
  }
}

function compactLinkedInImport(rawContent: string, isHtml: boolean) {
  if (!isHtml) return rawContent.trim().slice(0, 1_000_000);

  const documentNode = new DOMParser().parseFromString(rawContent, "text/html");
  const root = documentNode.querySelector("main") ?? documentNode.body;
  const lines: string[] = [];
  root.querySelectorAll("p, h1, h2, h3, a[href]").forEach((element) => {
    const text = element.textContent?.replace(/\s+/g, " ").trim() ?? "";
    if (element instanceof HTMLAnchorElement) {
      const href = element.href;
      const label = element.getAttribute("aria-label") ?? text;
      if (/credential|certificad/i.test(`${label} ${href}`)) {
        lines.push(`CREDENTIAL LINK: ${label} | ${href}`);
      }
      return;
    }
    if (text) lines.push(text);
  });
  return lines.join("\n").slice(0, 1_000_000);
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-7">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-accent-soft)]">
        {eyebrow}
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
        {description}
      </p>
    </div>
  );
}

function PaginationControls({
  page,
  pageCount,
  onChange,
  label,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  label: string;
}) {
  if (pageCount <= 1) return null;

  return (
    <nav
      className="mt-7 flex flex-wrap items-center justify-center gap-2"
      aria-label={`Paginación de ${label}`}
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        aria-label="Página anterior"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <FiChevronLeft />
      </button>
      {Array.from({ length: pageCount }, (_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onChange(index)}
          aria-current={index === page ? "page" : undefined}
          className={`h-10 min-w-10 rounded-xl border px-3 text-sm font-semibold transition ${
            index === page
              ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
              : "border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
          }`}
        >
          {index + 1}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === pageCount - 1}
        aria-label="Página siguiente"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <FiChevronRight />
      </button>
      <span className="ml-2 text-xs tabular-nums text-slate-500">
        Página {page + 1} de {pageCount}
      </span>
    </nav>
  );
}

export function AdminWorkspace({
  initialContent,
  section,
}: {
  initialContent: SiteContent;
  section: AdminSection;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(initialContent);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [resolvingLogo, setResolvingLogo] = useState<string | null>(null);
  const [linkedInCertificationsUrl, setLinkedInCertificationsUrl] =
    useState("");
  const [linkedInImportContent, setLinkedInImportContent] = useState("");
  const [linkedInImportFileName, setLinkedInImportFileName] = useState("");
  const [
    recentlyImportedCertificationIds,
    setRecentlyImportedCertificationIds,
  ] = useState<Set<string>>(() => new Set());
  const [importingLinkedInCertifications, setImportingLinkedInCertifications] =
    useState(false);
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(
    null,
  );
  const [draggedCertificationId, setDraggedCertificationId] = useState<
    string | null
  >(null);
  const [dragOverCertificationId, setDragOverCertificationId] = useState<
    string | null
  >(null);
  const [projectsPage, setProjectsPage] = useState(0);
  const [certificationsPage, setCertificationsPage] = useState(0);
  const [openProjectIds, setOpenProjectIds] = useState<Set<string>>(
    () =>
      new Set(
        initialContent.projects[0] ? [initialContent.projects[0].id] : [],
      ),
  );
  const projectRenderKeys = useRef(
    new Map(
      initialContent.projects.map((project, index) => [
        project.id,
        `project-editor-${index}`,
      ]),
    ),
  );
  const [jsonValue, setJsonValue] = useState(
    JSON.stringify(initialContent, null, 2),
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  const currentNav =
    navigation.find((item) => item.section === section) ?? navigation[0];

  const stats = useMemo(
    () => [
      {
        label: "Proyectos",
        value: draft.projects.length,
        icon: FiBriefcase,
        href: "/control-room/projects",
      },
      {
        label: "Skills",
        value: draft.about.skillset.length,
        icon: FiCode,
        href: "/control-room/about",
      },
      {
        label: "Certificaciones",
        value: draft.certifications.length,
        icon: FiAward,
        href: "/control-room/certifications",
      },
    ],
    [draft],
  );
  const projectsPageCount = Math.max(
    1,
    Math.ceil(draft.projects.length / ADMIN_PAGE_SIZE),
  );
  const certificationsPageCount = Math.max(
    1,
    Math.ceil(draft.certifications.length / ADMIN_PAGE_SIZE),
  );
  const paginatedProjects = draft.projects.slice(
    projectsPage * ADMIN_PAGE_SIZE,
    (projectsPage + 1) * ADMIN_PAGE_SIZE,
  );
  const paginatedCertifications = draft.certifications.slice(
    certificationsPage * ADMIN_PAGE_SIZE,
    (certificationsPage + 1) * ADMIN_PAGE_SIZE,
  );

  useEffect(() => {
    setProjectsPage((current) => Math.min(current, projectsPageCount - 1));
  }, [projectsPageCount]);

  useEffect(() => {
    setCertificationsPage((current) =>
      Math.min(current, certificationsPageCount - 1),
    );
  }, [certificationsPageCount]);

  function commit(next: SiteContent) {
    setDraft(next);
    setJsonValue(JSON.stringify(next, null, 2));
    setDirty(true);
    setMessage(null);
  }

  function updateResumeDocument(language: "en" | "es", url: string) {
    const isEnglish = language === "en";
    commit({
      ...draft,
      resume: {
        ...draft.resume,
        ...(isEnglish
          ? { downloadUrl: url, downloadUrlEn: url }
          : { downloadUrlEs: url }),
      },
      home: isEnglish
        ? {
            ...draft.home,
            secondaryCta: { ...draft.home.secondaryCta, href: url },
          }
        : draft.home,
    });
  }

  async function save(nextDraft = draft, quiet = false) {
    setSaving(true);
    if (!quiet) setMessage(null);

    try {
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextDraft),
      });

      if (!response.ok) throw new Error("No se pudo guardar el contenido.");
      setDirty(false);
      setSavedAt(
        new Date().toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
      if (!quiet) setMessage("Cambios guardados correctamente.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se pudo guardar.",
      );
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!dirty || jsonError) return;
    const timeout = window.setTimeout(() => void save(draft, true), 1800);
    return () => window.clearTimeout(timeout);
    // save deliberately tracks the latest draft through this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, draft, jsonError]);

  useEffect(() => {
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [dirty]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/control-room");
    router.refresh();
  }

  async function uploadAsset(
    file: File,
    kind: "image" | "document",
    key: string,
  ) {
    setUploading(key);
    setMessage(null);
    try {
      if (file.size > 4 * 1024 * 1024) {
        const presignResponse = await fetch("/api/admin/media/direct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "presign",
            fileName: file.name,
            mimeType: file.type,
            size: file.size,
            kind,
          }),
        });
        const presignData = (await presignResponse.json()) as {
          uploadUrl?: string;
          headers?: Record<string, string>;
          item?: import("@/types/site").MediaItem;
          error?: string;
        };

        if (presignResponse.ok && presignData.uploadUrl && presignData.item) {
          const s3Response = await fetch(presignData.uploadUrl, {
            method: "PUT",
            headers: presignData.headers,
            body: file,
          });
          if (!s3Response.ok)
            throw new Error(
              "S3 rechazó la subida. Revisa la configuración CORS del bucket.",
            );

          const completionResponse = await fetch("/api/admin/media/direct", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "complete",
              item: presignData.item,
            }),
          });
          const completionData = (await completionResponse.json()) as {
            item?: import("@/types/site").MediaItem;
            error?: string;
          };
          if (!completionResponse.ok || !completionData.item) {
            throw new Error(
              completionData.error ?? "No se pudo registrar el archivo subido.",
            );
          }
          return completionData.item.url;
        }
        throw new Error(
          presignData.error ?? "No se pudo preparar la subida directa.",
        );
      }

      const body = new FormData();
      body.append("file", file);
      body.append("kind", kind);
      const response = await fetch("/api/admin/media", {
        method: "POST",
        body,
      });
      const data = (await response.json()) as {
        item?: { url: string };
        error?: string;
      };
      if (!response.ok || !data.item)
        throw new Error(data.error ?? "No se pudo subir el archivo.");
      return data.item.url;
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se pudo subir el archivo.",
      );
      return null;
    } finally {
      setUploading(null);
    }
  }

  function updateProject(id: string, patch: Partial<Project>) {
    let nextPatch = patch;
    if (
      patch.stack &&
      typeof document !== "undefined" &&
      document.activeElement instanceof HTMLInputElement
    ) {
      nextPatch = {
        ...patch,
        stack: document.activeElement.value
          .split(",")
          .map((item) => item.trim()),
      };
    }

    if (nextPatch.id !== undefined && nextPatch.id !== id) {
      const renderKey =
        projectRenderKeys.current.get(id) ?? `project-editor-${id}`;
      projectRenderKeys.current.delete(id);
      projectRenderKeys.current.set(nextPatch.id, renderKey);
      setOpenProjectIds((current) => {
        if (!current.has(id)) return current;
        const next = new Set(current);
        next.delete(id);
        next.add(nextPatch.id as string);
        return next;
      });
    }
    commit({
      ...draft,
      projects: draft.projects.map((project) =>
        project.id === id ? { ...project, ...nextPatch } : project,
      ),
    });
  }

  function setProjectAccordionOpen(projectId: string, open: boolean) {
    setOpenProjectIds((current) => {
      if (current.has(projectId) === open) return current;
      const next = new Set(current);
      if (open) next.add(projectId);
      else next.delete(projectId);
      return next;
    });
  }

  function getProjectRenderKey(projectId: string) {
    return projectRenderKeys.current.get(projectId) ?? projectId;
  }

  async function uploadProjectGallery(projectId: string, files: FileList) {
    const uploadedUrls: string[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadAsset(file, "image", `gallery-${projectId}`);
      if (url) uploadedUrls.push(url);
    }
    if (uploadedUrls.length === 0) return;

    const project = draft.projects.find((item) => item.id === projectId);
    if (!project) return;
    updateProject(projectId, {
      gallery: [...(project.gallery ?? []), ...uploadedUrls],
    });
  }

  function removeProjectGalleryImage(projectId: string, imageIndex: number) {
    const project = draft.projects.find((item) => item.id === projectId);
    if (!project) return;
    updateProject(projectId, {
      gallery: (project.gallery ?? []).filter(
        (_, index) => index !== imageIndex,
      ),
    });
  }

  function moveProjectGalleryImage(
    projectId: string,
    imageIndex: number,
    offset: -1 | 1,
  ) {
    const project = draft.projects.find((item) => item.id === projectId);
    const gallery = [...(project?.gallery ?? [])];
    const targetIndex = imageIndex + offset;
    if (!project || targetIndex < 0 || targetIndex >= gallery.length) return;
    [gallery[imageIndex], gallery[targetIndex]] = [
      gallery[targetIndex],
      gallery[imageIndex],
    ];
    updateProject(projectId, { gallery });
  }

  function reorderProjects(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;

    const projects = [...draft.projects];
    const sourceIndex = projects.findIndex(
      (project) => project.id === sourceId,
    );
    const targetIndex = projects.findIndex(
      (project) => project.id === targetId,
    );
    if (sourceIndex < 0 || targetIndex < 0) return;

    const [project] = projects.splice(sourceIndex, 1);
    projects.splice(targetIndex, 0, project);
    commit({ ...draft, projects });
    setMessage("Orden actualizado. Se guardará automáticamente.");
  }

  function moveProject(projectId: string, offset: -1 | 1) {
    const sourceIndex = draft.projects.findIndex(
      (project) => project.id === projectId,
    );
    const target = draft.projects[sourceIndex + offset];
    if (sourceIndex < 0 || !target) return;
    reorderProjects(projectId, target.id);
  }

  function projectDropTargetAt(clientX: number, clientY: number) {
    const element = document.elementFromPoint(clientX, clientY);
    return (
      element?.closest<HTMLElement>("[data-project-drop-id]")?.dataset
        .projectDropId ?? null
    );
  }

  function resetProjectDrag() {
    setDraggedProjectId(null);
    setDragOverProjectId(null);
  }

  function reorderCertifications(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;

    const certifications = [...draft.certifications];
    const sourceIndex = certifications.findIndex(
      (certification) => certification.id === sourceId,
    );
    const targetIndex = certifications.findIndex(
      (certification) => certification.id === targetId,
    );
    if (sourceIndex < 0 || targetIndex < 0) return;

    const [certification] = certifications.splice(sourceIndex, 1);
    certifications.splice(targetIndex, 0, certification);
    commit({ ...draft, certifications });
    setMessage(
      "Orden de certificaciones actualizado. Se guardará automáticamente.",
    );
  }

  function moveCertification(certificationId: string, offset: -1 | 1) {
    const sourceIndex = draft.certifications.findIndex(
      (certification) => certification.id === certificationId,
    );
    const target = draft.certifications[sourceIndex + offset];
    if (sourceIndex < 0 || !target) return;
    reorderCertifications(certificationId, target.id);
  }

  function certificationDropTargetAt(clientX: number, clientY: number) {
    const element = document.elementFromPoint(clientX, clientY);
    return (
      element?.closest<HTMLElement>("[data-certification-drop-id]")?.dataset
        .certificationDropId ?? null
    );
  }

  function resetCertificationDrag() {
    setDraggedCertificationId(null);
    setDragOverCertificationId(null);
  }

  function updateContact(
    field: "location" | "phone" | "email" | "portfolioUrl",
    value: string,
  ) {
    commit({
      ...draft,
      contact: { ...draft.contact, [field]: value },
      site: {
        ...draft.site,
        ...(field === "email" ? { email: value } : {}),
        ...(field === "location" ? { location: value } : {}),
      },
      home:
        field === "location" ? { ...draft.home, location: value } : draft.home,
    });
  }

  function getSocialProfile(label: "GitHub" | "LinkedIn") {
    return label === "GitHub"
      ? draft.contact.githubUrl
      : draft.contact.linkedinUrl;
  }

  function updateSocialProfile(label: "GitHub" | "LinkedIn", href: string) {
    const contactField = label === "GitHub" ? "githubUrl" : "linkedinUrl";
    const otherSocials = draft.socials.filter(
      (social) => social.label.toLowerCase() !== label.toLowerCase(),
    );

    commit({
      ...draft,
      contact: { ...draft.contact, [contactField]: href },
      socials: href.trim() ? [...otherSocials, { label, href }] : otherSocials,
    });
  }

  function updateCertification(id: string, patch: Partial<Certification>) {
    let nextPatch = patch;
    if (patch.organizationUrl && patch.logoUrl === undefined) {
      const organizationKey = normalizeLinkedInOrganizationUrl(
        patch.organizationUrl,
      );
      const reusableLogo = draft.certifications.find(
        (item) =>
          item.id !== id &&
          item.logoUrl &&
          normalizeLinkedInOrganizationUrl(item.organizationUrl) ===
            organizationKey,
      )?.logoUrl;
      if (reusableLogo) nextPatch = { ...patch, logoUrl: reusableLogo };
    }

    commit({
      ...draft,
      certifications: draft.certifications.map((certification) =>
        certification.id === id
          ? { ...certification, ...nextPatch }
          : certification,
      ),
    });
  }

  function addProject() {
    const id = `project-${Date.now()}`;
    setProjectsPage(Math.floor(draft.projects.length / ADMIN_PAGE_SIZE));
    commit({
      ...draft,
      projects: [
        ...draft.projects,
        {
          id,
          title: "Nuevo proyecto",
          description: "",
          stack: [],
          image: "/assets/home-main.svg",
        },
      ],
    });
  }

  function addCertification() {
    const id = `certification-${Date.now()}`;
    setCertificationsPage(
      Math.floor(draft.certifications.length / ADMIN_PAGE_SIZE),
    );
    commit({
      ...draft,
      certifications: [
        ...draft.certifications,
        {
          id,
          title: "Nueva certificación",
          issuer: "",
          description: "",
          certificateUrl: "",
          verificationUrl: "",
          organizationUrl: "",
          logoUrl: "",
          favorite: false,
        },
      ],
    });
  }

  async function resolveLinkedInLogo(certification: Certification) {
    if (!certification.organizationUrl) {
      setMessage("Primero añade el enlace de empresa o escuela en LinkedIn.");
      return;
    }
    setResolvingLogo(certification.id);
    setMessage(null);
    try {
      const response = await fetch("/api/linkedin-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: certification.organizationUrl }),
      });
      const data = (await response.json()) as {
        logoUrl?: string;
        reused?: boolean;
        error?: string;
      };
      if (!response.ok || !data.logoUrl)
        throw new Error(data.error ?? "No se encontró el logo.");
      updateCertification(certification.id, { logoUrl: data.logoUrl });
      setMessage(
        data.reused
          ? "Se reutilizó el logo guardado para esta organización."
          : "Logo obtenido desde LinkedIn y guardado en S3.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se pudo obtener el logo.",
      );
    } finally {
      setResolvingLogo(null);
    }
  }

  async function importLinkedInCertifications() {
    if (!linkedInCertificationsUrl.trim() && !linkedInImportContent.trim())
      return;
    setImportingLinkedInCertifications(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/certifications/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: linkedInCertificationsUrl.trim(),
          content: linkedInImportContent.trim(),
        }),
      });
      const data = (await response.json()) as {
        certifications?: Array<
          Pick<
            Certification,
            | "title"
            | "issuer"
            | "issuedAt"
            | "credentialId"
            | "verificationUrl"
            | "organizationUrl"
          >
        >;
        error?: string;
      };
      if (!response.ok || !data.certifications) {
        throw new Error(
          data.error ?? "No se pudieron importar las certificaciones.",
        );
      }

      const existingKeys = new Set(
        draft.certifications.map((item) =>
          `${item.title}|${item.issuer}|${item.credentialId ?? ""}`.toLowerCase(),
        ),
      );
      const imported = data.certifications
        .filter((item) => {
          const key =
            `${item.title}|${item.issuer}|${item.credentialId ?? ""}`.toLowerCase();
          if (existingKeys.has(key)) return false;
          existingKeys.add(key);
          return true;
        })
        .map((item, index): Certification => {
          const organizationKey = normalizeLinkedInOrganizationUrl(
            item.organizationUrl,
          );
          const reusableLogo = organizationKey
            ? draft.certifications.find(
                (existing) =>
                  existing.logoUrl &&
                  normalizeLinkedInOrganizationUrl(existing.organizationUrl) ===
                    organizationKey,
              )?.logoUrl
            : undefined;
          return {
            id: `linkedin-${slugify(item.title) || "certification"}-${Date.now()}-${index}`,
            title: item.title,
            issuer: item.issuer,
            issuedAt: item.issuedAt,
            credentialId: item.credentialId,
            description: "",
            certificateUrl: "",
            verificationUrl: item.verificationUrl,
            organizationUrl: item.organizationUrl,
            logoUrl: reusableLogo ?? "",
            favorite: false,
          };
        });

      if (imported.length === 0) {
        setMessage(
          "No hay certificados nuevos para importar; los encontrados ya existen.",
        );
        return;
      }

      commit({
        ...draft,
        certifications: [...draft.certifications, ...imported],
      });
      setRecentlyImportedCertificationIds((current) => {
        const next = new Set(current);
        imported.forEach((certification) => next.add(certification.id));
        return next;
      });
      setCertificationsPage(
        Math.floor(
          (draft.certifications.length + imported.length - 1) / ADMIN_PAGE_SIZE,
        ),
      );
      setMessage(
        `${imported.length} certificado${imported.length === 1 ? " importado" : "s importados"} desde LinkedIn. Ya puedes revisar y editar sus datos.`,
      );
      setLinkedInImportContent("");
      setLinkedInImportFileName("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudieron importar las certificaciones.",
      );
    } finally {
      setImportingLinkedInCertifications(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)] text-white">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-white/10 bg-slate-950/35 p-5 backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:p-6">
          <div className="flex items-center justify-between lg:block">
            <Link href="/control-room" className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-accent)] font-display font-bold shadow-glow">
                CR
              </span>
              <div>
                <p className="font-display font-semibold">Control Room</p>
                <p className="text-xs text-slate-500">Portfolio CMS</p>
              </div>
            </Link>
            <Link
              href="/"
              target="_blank"
              className="rounded-xl border border-white/10 p-3 text-slate-300 transition hover:bg-white/10 lg:hidden"
              aria-label="Ver sitio"
            >
              <FiEye />
            </Link>
          </div>

          <nav
            className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1"
            aria-label="Secciones del panel"
          >
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = item.section === section;
              return (
                <Link
                  key={item.section}
                  href={
                    item.section === "dashboard"
                      ? "/control-room"
                      : `/control-room/${item.section}`
                  }
                  className={`flex items-center gap-3 rounded-2xl border px-3 py-3 transition ${active ? "border-[var(--color-accent)]/50 bg-[var(--color-accent)]/15 text-white" : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-white"}`}
                >
                  <Icon className="shrink-0" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {item.label}
                    </span>
                    <span className="hidden text-xs text-slate-500 lg:block">
                      {item.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 hidden space-y-2 border-t border-white/10 pt-5 lg:block">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <FiEye /> Ver portfolio
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-100"
            >
              <FiLogOut /> Cerrar sesión
            </button>
          </div>
        </aside>

        <div className="min-w-0 p-5 sm:p-8 lg:p-10">
          <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Control Room / {currentNav.label}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {dirty
                  ? "Cambios pendientes de sincronización"
                  : savedAt
                    ? `Sincronizado a las ${savedAt}`
                    : "Contenido sincronizado"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {message && (
                <p className="max-w-sm text-xs text-[var(--color-accent-soft)]">
                  {message}
                </p>
              )}
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving || Boolean(jsonError)}
                className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
              >
                {saving ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : dirty ? (
                  <FiSave />
                ) : (
                  <FiCheck />
                )}
                {saving ? "Guardando" : dirty ? "Guardar" : "Guardado"}
              </button>
            </div>
          </header>

          {section === "dashboard" && (
            <section>
              <PageHeading
                eyebrow="Vista general"
                title="Todo tu portfolio, mejor organizado."
                description="Cada grupo de contenido vive ahora en su propia página. Entra a una sección, edita y el guardado automático se encargará del resto."
              />
              <div className="grid gap-4 md:grid-cols-3">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <Link
                      key={stat.label}
                      href={stat.href}
                      className="glass-panel group border border-white/10 p-6 transition hover:-translate-y-1 hover:border-[var(--color-accent)]/40"
                    >
                      <div className="flex items-center justify-between">
                        <Icon className="text-xl text-[var(--color-accent-soft)]" />
                        <span className="text-3xl font-semibold">
                          {stat.value}
                        </span>
                      </div>
                      <p className="mt-7 font-semibold">{stat.label}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Gestionar contenido →
                      </p>
                    </Link>
                  );
                })}
              </div>
              <div className="mt-8 grid gap-5 lg:grid-cols-2">
                {navigation.slice(1).map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.section}
                      href={`/control-room/${item.section}`}
                      className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.035] p-5 transition hover:bg-white/[0.07]"
                    >
                      <span className="rounded-2xl bg-white/5 p-4 text-[var(--color-accent-soft)]">
                        <Icon />
                      </span>
                      <span>
                        <span className="block font-semibold">
                          {item.label}
                        </span>
                        <span className="mt-1 block text-sm text-slate-500">
                          {item.description}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {section === "home" && (
            <section>
              <PageHeading
                eyebrow="Landing"
                title="Inicio y presentación"
                description="Edita el mensaje principal, las llamadas a la acción, métricas y puntos destacados del hero."
              />
              <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
                <div className="glass-panel space-y-5 border border-white/10 p-6">
                  <Field label="Etiqueta superior">
                    <input
                      className={fieldClass}
                      value={draft.home.eyebrow}
                      onChange={(event) =>
                        commit({
                          ...draft,
                          home: { ...draft.home, eyebrow: event.target.value },
                        })
                      }
                    />
                  </Field>
                  <Field label="Título">
                    <textarea
                      className={`${fieldClass} min-h-28`}
                      value={draft.home.title}
                      onChange={(event) =>
                        commit({
                          ...draft,
                          home: { ...draft.home, title: event.target.value },
                        })
                      }
                    />
                  </Field>
                  <Field label="Subtítulo">
                    <textarea
                      className={`${fieldClass} min-h-20`}
                      value={draft.home.subtitle}
                      onChange={(event) =>
                        commit({
                          ...draft,
                          home: { ...draft.home, subtitle: event.target.value },
                        })
                      }
                    />
                  </Field>
                  <Field label="Descripción">
                    <textarea
                      className={`${fieldClass} min-h-32`}
                      value={draft.home.description}
                      onChange={(event) =>
                        commit({
                          ...draft,
                          home: {
                            ...draft.home,
                            description: event.target.value,
                          },
                        })
                      }
                    />
                  </Field>
                  <Field label="Disponibilidad">
                    <input
                      className={fieldClass}
                      value={draft.home.availability}
                      onChange={(event) =>
                        commit({
                          ...draft,
                          home: {
                            ...draft.home,
                            availability: event.target.value,
                          },
                        })
                      }
                    />
                  </Field>
                  {(["primaryCta", "secondaryCta"] as const).map((cta) => (
                    <div
                      key={cta}
                      className="grid gap-4 rounded-2xl border border-white/10 p-4 sm:grid-cols-2"
                    >
                      <Field
                        label={`${cta === "primaryCta" ? "CTA principal" : "CTA secundario"} · texto`}
                      >
                        <input
                          className={fieldClass}
                          value={draft.home[cta].label}
                          onChange={(event) =>
                            commit({
                              ...draft,
                              home: {
                                ...draft.home,
                                [cta]: {
                                  ...draft.home[cta],
                                  label: event.target.value,
                                },
                              },
                            })
                          }
                        />
                      </Field>
                      <Field label="Enlace">
                        <input
                          className={fieldClass}
                          value={draft.home[cta].href}
                          onChange={(event) =>
                            commit({
                              ...draft,
                              home: {
                                ...draft.home,
                                [cta]: {
                                  ...draft.home[cta],
                                  href: event.target.value,
                                },
                              },
                            })
                          }
                        />
                      </Field>
                    </div>
                  ))}
                </div>
                <div className="space-y-6">
                  <div className="glass-panel border border-white/10 p-6">
                    <Field label="Highlights · uno por línea">
                      <textarea
                        className={`${fieldClass} min-h-52`}
                        value={draft.home.highlights.join("\n")}
                        onChange={(event) =>
                          commit({
                            ...draft,
                            home: {
                              ...draft.home,
                              highlights: lines(event.target.value),
                            },
                          })
                        }
                      />
                    </Field>
                  </div>
                  <div className="glass-panel border border-white/10 p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="font-display text-xl font-semibold">
                        Métricas
                      </h2>
                      <button
                        type="button"
                        onClick={() =>
                          commit({
                            ...draft,
                            home: {
                              ...draft.home,
                              metrics: [
                                ...draft.home.metrics,
                                { label: "Nueva métrica", value: "" },
                              ],
                            },
                          })
                        }
                        className="rounded-xl border border-white/10 p-2 hover:bg-white/10"
                      >
                        <FiPlus />
                      </button>
                    </div>
                    {draft.home.metrics.map((metric, index) => (
                      <div
                        key={index}
                        className="mb-3 grid grid-cols-[1fr_1fr_auto] gap-2"
                      >
                        <input
                          className={fieldClass}
                          value={metric.label}
                          onChange={(event) =>
                            commit({
                              ...draft,
                              home: {
                                ...draft.home,
                                metrics: draft.home.metrics.map(
                                  (item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, label: event.target.value }
                                      : item,
                                ),
                              },
                            })
                          }
                        />
                        <input
                          className={fieldClass}
                          value={metric.value}
                          onChange={(event) =>
                            commit({
                              ...draft,
                              home: {
                                ...draft.home,
                                metrics: draft.home.metrics.map(
                                  (item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, value: event.target.value }
                                      : item,
                                ),
                              },
                            })
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            commit({
                              ...draft,
                              home: {
                                ...draft.home,
                                metrics: draft.home.metrics.filter(
                                  (_, itemIndex) => itemIndex !== index,
                                ),
                              },
                            })
                          }
                          className="px-3 text-rose-300"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {section === "about" && (
            <section>
              <PageHeading
                eyebrow="Perfil"
                title="Acerca de ti, skills y tools"
                description="Centraliza tu identidad profesional y las listas que aparecen junto a tu presentación."
              />
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="glass-panel space-y-5 border border-white/10 p-6">
                  <h2 className="font-display text-xl font-semibold">
                    Identidad
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Nombre">
                      <input
                        className={fieldClass}
                        value={draft.site.name}
                        onChange={(event) =>
                          commit({
                            ...draft,
                            site: { ...draft.site, name: event.target.value },
                          })
                        }
                      />
                    </Field>
                    <Field label="Iniciales">
                      <input
                        className={fieldClass}
                        value={draft.site.initials}
                        onChange={(event) =>
                          commit({
                            ...draft,
                            site: {
                              ...draft.site,
                              initials: event.target.value,
                            },
                          })
                        }
                      />
                    </Field>
                    <Field label="Rol">
                      <input
                        className={fieldClass}
                        value={draft.site.role}
                        onChange={(event) =>
                          commit({
                            ...draft,
                            site: { ...draft.site, role: event.target.value },
                          })
                        }
                      />
                    </Field>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-5">
                    <div className="mb-4">
                      <h3 className="font-display text-lg font-semibold">
                        Información de contacto
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Datos reutilizables para el banner y futuras funciones
                        de contacto.
                      </p>
                    </div>
                    <div className="grid gap-4">
                      <Field label="Ubicación">
                        <input
                          className={fieldClass}
                          value={draft.contact.location}
                          onChange={(event) =>
                            updateContact("location", event.target.value)
                          }
                          placeholder="Valencia, Venezuela · UTC-4"
                        />
                      </Field>
                      <Field label="Correo electrónico">
                        <input
                          type="email"
                          className={fieldClass}
                          value={draft.contact.email}
                          onChange={(event) =>
                            updateContact("email", event.target.value)
                          }
                          placeholder="nombre@dominio.com"
                        />
                      </Field>
                      <Field label="Teléfono">
                        <input
                          type="tel"
                          className={fieldClass}
                          value={draft.contact.phone}
                          onChange={(event) =>
                            updateContact("phone", event.target.value)
                          }
                          placeholder="+58 000 0000000"
                        />
                      </Field>
                      <Field label="Portfolio">
                        <input
                          type="url"
                          className={fieldClass}
                          value={draft.contact.portfolioUrl}
                          onChange={(event) =>
                            updateContact("portfolioUrl", event.target.value)
                          }
                          placeholder="https://tudominio.com"
                        />
                      </Field>
                      <div className="border-t border-white/10 pt-4">
                        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Perfiles profesionales
                        </p>
                        <div className="grid gap-4">
                          <Field label="GitHub">
                            <input
                              type="url"
                              className={fieldClass}
                              value={getSocialProfile("GitHub")}
                              onChange={(event) =>
                                updateSocialProfile(
                                  "GitHub",
                                  event.target.value,
                                )
                              }
                              placeholder="https://github.com/usuario"
                            />
                          </Field>
                          <Field label="LinkedIn">
                            <input
                              type="url"
                              className={fieldClass}
                              value={getSocialProfile("LinkedIn")}
                              onChange={(event) =>
                                updateSocialProfile(
                                  "LinkedIn",
                                  event.target.value,
                                )
                              }
                              placeholder="https://www.linkedin.com/in/usuario"
                            />
                          </Field>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Field label="Titular">
                    <textarea
                      className={`${fieldClass} min-h-24`}
                      value={draft.about.headline}
                      onChange={(event) =>
                        commit({
                          ...draft,
                          about: {
                            ...draft.about,
                            headline: event.target.value,
                          },
                        })
                      }
                    />
                  </Field>
                  <Field label="Resumen · un párrafo por línea">
                    <textarea
                      className={`${fieldClass} min-h-44`}
                      value={draft.about.summary.join("\n")}
                      onChange={(event) =>
                        commit({
                          ...draft,
                          about: {
                            ...draft.about,
                            summary: lines(event.target.value),
                          },
                        })
                      }
                    />
                  </Field>
                  <Field label="Imagen de perfil · URL">
                    <input
                      className={fieldClass}
                      value={draft.about.profileImage}
                      onChange={(event) =>
                        commit({
                          ...draft,
                          about: {
                            ...draft.about,
                            profileImage: event.target.value,
                          },
                        })
                      }
                    />
                  </Field>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/5">
                    <FiUploadCloud />{" "}
                    {uploading === "profile" ? "Subiendo..." : "Subir imagen"}
                    <input
                      className="hidden"
                      type="file"
                      accept="image/*"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        const url = await uploadAsset(file, "image", "profile");
                        if (url)
                          commit({
                            ...draft,
                            about: { ...draft.about, profileImage: url },
                          });
                      }}
                    />
                  </label>
                </div>
                <div className="space-y-6">
                  <div className="glass-panel border border-white/10 p-6">
                    <Field label="Tech stack · uno por línea">
                      <textarea
                        className={`${fieldClass} min-h-64`}
                        value={draft.about.skillset.join("\n")}
                        onChange={(event) =>
                          commit({
                            ...draft,
                            about: {
                              ...draft.about,
                              skillset: lines(event.target.value),
                            },
                          })
                        }
                      />
                    </Field>
                  </div>
                  <div className="glass-panel border border-white/10 p-6">
                    <Field label="Tools · uno por línea">
                      <textarea
                        className={`${fieldClass} min-h-56`}
                        value={draft.about.toolset.join("\n")}
                        onChange={(event) =>
                          commit({
                            ...draft,
                            about: {
                              ...draft.about,
                              toolset: lines(event.target.value),
                            },
                          })
                        }
                      />
                    </Field>
                  </div>
                  <div className="glass-panel border border-white/10 p-6">
                    <Field label="Áreas de enfoque · una por línea">
                      <textarea
                        className={`${fieldClass} min-h-44`}
                        value={draft.about.focusAreas.join("\n")}
                        onChange={(event) =>
                          commit({
                            ...draft,
                            about: {
                              ...draft.about,
                              focusAreas: lines(event.target.value),
                            },
                          })
                        }
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </section>
          )}

          {section === "projects" && (
            <section>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <PageHeading
                  eyebrow="Portfolio"
                  title="Proyectos"
                  description="Añade, actualiza, elimina y ordena los proyectos según deban aparecer en el portfolio."
                />
                <button
                  type="button"
                  onClick={addProject}
                  className="mb-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold"
                >
                  <FiPlus /> Nuevo proyecto
                </button>
              </div>

              {draft.projects.length > 1 && (
                <div className="mb-8 space-y-3">
                  <p className="flex items-center gap-2 text-xs text-slate-500">
                    <FiMove /> Arrastra los proyectos para cambiar su orden de
                    aparición. Las flechas funcionan como alternativa táctil y
                    accesible.
                  </p>
                  {paginatedProjects.map((project, index) => {
                    const absoluteIndex =
                      projectsPage * ADMIN_PAGE_SIZE + index;
                    return (
                      <div
                        key={`project-order-${project.id}`}
                        data-project-drop-id={project.id}
                        onDragEnter={(event) => {
                          event.preventDefault();
                          event.dataTransfer.dropEffect = "move";
                          setDragOverProjectId(project.id);
                        }}
                        onDragOver={(event) => {
                          event.preventDefault();
                          event.dataTransfer.dropEffect = "move";
                          setDragOverProjectId(project.id);
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          const sourceId =
                            draggedProjectId ??
                            event.dataTransfer.getData("text/plain");
                          if (sourceId) reorderProjects(sourceId, project.id);
                          resetProjectDrag();
                        }}
                        className={`glass-panel flex items-center gap-3 border p-3 transition sm:gap-4 ${
                          dragOverProjectId === project.id &&
                          draggedProjectId !== project.id
                            ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 shadow-glow"
                            : "border-white/10"
                        } ${draggedProjectId === project.id ? "opacity-60" : "opacity-100"}`}
                      >
                        <span
                          draggable
                          role="button"
                          tabIndex={0}
                          title="Arrastrar para cambiar el orden"
                          aria-label={`Mover ${project.title}`}
                          onDragStart={(event) => {
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData(
                              "text/plain",
                              project.id,
                            );
                            setDraggedProjectId(project.id);
                            setDragOverProjectId(project.id);
                          }}
                          onDragEnd={resetProjectDrag}
                          onPointerDown={(event) => {
                            if (event.pointerType === "mouse") return;
                            event.preventDefault();
                            event.currentTarget.setPointerCapture(
                              event.pointerId,
                            );
                            setDraggedProjectId(project.id);
                            setDragOverProjectId(project.id);
                          }}
                          onPointerMove={(event) => {
                            if (event.pointerType === "mouse") return;
                            const targetId = projectDropTargetAt(
                              event.clientX,
                              event.clientY,
                            );
                            if (targetId) setDragOverProjectId(targetId);
                          }}
                          onPointerUp={(event) => {
                            if (event.pointerType === "mouse") return;
                            const targetId = projectDropTargetAt(
                              event.clientX,
                              event.clientY,
                            );
                            if (targetId) reorderProjects(project.id, targetId);
                            resetProjectDrag();
                          }}
                          onPointerCancel={resetProjectDrag}
                          className="inline-flex h-11 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-xl border border-dashed border-white/15 text-slate-500 transition hover:border-white/30 hover:bg-white/5 hover:text-white active:cursor-grabbing"
                        >
                          <FiMove />
                        </span>
                        <span className="w-5 text-center text-xs font-bold text-slate-600">
                          {absoluteIndex + 1}
                        </span>
                        <div className="h-12 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                          <img
                            src={project.image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {project.title}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {project.stack.join(" · ") || "Sin tecnologías"}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            disabled={absoluteIndex === 0}
                            onClick={() => moveProject(project.id, -1)}
                            aria-label={`Subir ${project.title}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                          >
                            <FiArrowUp />
                          </button>
                          <button
                            type="button"
                            disabled={
                              absoluteIndex === draft.projects.length - 1
                            }
                            onClick={() => moveProject(project.id, 1)}
                            aria-label={`Bajar ${project.title}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                          >
                            <FiArrowDown />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="space-y-6">
                {paginatedProjects.map((project) => (
                  <details
                    key={getProjectRenderKey(project.id)}
                    className="glass-panel border border-white/10 p-6"
                    open={openProjectIds.has(project.id)}
                    onToggle={(event) =>
                      setProjectAccordionOpen(
                        project.id,
                        event.currentTarget.open,
                      )
                    }
                  >
                    <summary className="flex cursor-pointer list-none items-center gap-4">
                      <div className="h-16 w-24 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                        <img
                          src={project.image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate font-display text-xl font-semibold">
                          {project.title}
                        </h2>
                        <p className="mt-1 truncate text-sm text-slate-500">
                          {project.stack.join(" · ") || "Sin tecnologías"}
                        </p>
                      </div>
                      <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Editar
                      </span>
                    </summary>
                    <div className="mt-6 grid gap-5 border-t border-white/10 pt-6 lg:grid-cols-2">
                      <Field label="Título">
                        <input
                          className={fieldClass}
                          value={project.title}
                          onChange={(event) =>
                            updateProject(project.id, {
                              title: event.target.value,
                              id: project.id.startsWith("project-")
                                ? slugify(event.target.value) || project.id
                                : project.id,
                            })
                          }
                        />
                      </Field>
                      <Field label="ID">
                        <input
                          className={fieldClass}
                          value={project.id}
                          onChange={(event) =>
                            updateProject(project.id, {
                              id: slugify(event.target.value),
                            })
                          }
                        />
                      </Field>
                      <div className="lg:col-span-2">
                        <Field label="Descripción">
                          <textarea
                            className={`${fieldClass} min-h-28`}
                            value={project.description}
                            onChange={(event) =>
                              updateProject(project.id, {
                                description: event.target.value,
                              })
                            }
                          />
                        </Field>
                      </div>
                      <Field label="Stack · separado por comas">
                        <input
                          className={fieldClass}
                          value={project.stack.join(", ")}
                          onChange={(event) =>
                            updateProject(project.id, {
                              stack: event.target.value
                                .split(",")
                                .map((item) => item.trim())
                                .filter(Boolean),
                            })
                          }
                        />
                      </Field>
                      <Field label="Imagen principal · URL">
                        <input
                          className={fieldClass}
                          value={project.image}
                          onChange={(event) =>
                            updateProject(project.id, {
                              image: event.target.value,
                            })
                          }
                        />
                      </Field>
                      <Field label="Demo URL">
                        <input
                          className={fieldClass}
                          value={project.demoUrl ?? ""}
                          onChange={(event) =>
                            updateProject(project.id, {
                              demoUrl: event.target.value,
                            })
                          }
                        />
                      </Field>
                      <Field label="GitHub URL">
                        <input
                          className={fieldClass}
                          value={project.githubUrl ?? ""}
                          onChange={(event) =>
                            updateProject(project.id, {
                              githubUrl: event.target.value,
                            })
                          }
                        />
                      </Field>
                      <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/25 p-4 lg:col-span-2">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <span className={labelClass}>
                              Galería del proyecto
                            </span>
                            <p className="text-sm text-slate-500">
                              Selecciona una o varias imágenes. Se subirán al
                              almacenamiento configurado y podrás ordenar su
                              aparición.
                            </p>
                          </div>
                          <label
                            className={`inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold transition ${uploading === `gallery-${project.id}` ? "cursor-wait opacity-60" : "cursor-pointer hover:bg-white/5"}`}
                          >
                            <FiUploadCloud />{" "}
                            {uploading === `gallery-${project.id}`
                              ? "Subiendo..."
                              : "Añadir imágenes"}
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              disabled={uploading === `gallery-${project.id}`}
                              className="hidden"
                              onChange={async (event) => {
                                const files = event.target.files;
                                if (!files?.length) return;
                                await uploadProjectGallery(project.id, files);
                                event.target.value = "";
                              }}
                            />
                          </label>
                        </div>
                        {(project.gallery ?? []).length > 0 ? (
                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {(project.gallery ?? []).map(
                              (imageUrl, imageIndex) => (
                                <div
                                  key={`${imageUrl}-${imageIndex}`}
                                  className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60"
                                >
                                  <div className="aspect-video overflow-hidden bg-white/5">
                                    <img
                                      src={imageUrl}
                                      alt={`Imagen ${imageIndex + 1} de ${project.title}`}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                  <div className="flex items-center justify-between gap-2 p-2">
                                    <span className="min-w-0 flex-1 truncate px-1 text-xs text-slate-500">
                                      {imageUrl}
                                    </span>
                                    <div className="flex shrink-0 gap-1">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          moveProjectGalleryImage(
                                            project.id,
                                            imageIndex,
                                            -1,
                                          )
                                        }
                                        disabled={imageIndex === 0}
                                        aria-label="Mover imagen a la izquierda"
                                        className="rounded-lg p-2 text-slate-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                                      >
                                        <FiArrowUp className="-rotate-90" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          moveProjectGalleryImage(
                                            project.id,
                                            imageIndex,
                                            1,
                                          )
                                        }
                                        disabled={
                                          imageIndex ===
                                          (project.gallery ?? []).length - 1
                                        }
                                        aria-label="Mover imagen a la derecha"
                                        className="rounded-lg p-2 text-slate-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                                      >
                                        <FiArrowDown className="-rotate-90" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeProjectGalleryImage(
                                            project.id,
                                            imageIndex,
                                          )
                                        }
                                        aria-label="Eliminar imagen de la galería"
                                        className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10"
                                      >
                                        <FiTrash2 />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-white/15 px-5 py-8 text-center text-sm text-slate-500">
                            <FiImage className="mx-auto mb-2 text-xl" />
                            Aún no hay imágenes en la galería.
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 lg:col-span-2">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/5">
                          <FiImage />{" "}
                          {uploading === project.id
                            ? "Subiendo..."
                            : "Subir portada"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (event) => {
                              const file = event.target.files?.[0];
                              if (!file) return;
                              const url = await uploadAsset(
                                file,
                                "image",
                                project.id,
                              );
                              if (url)
                                updateProject(project.id, { image: url });
                            }}
                          />
                        </label>
                        <label className="flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm">
                          <input
                            type="checkbox"
                            checked={Boolean(project.featured)}
                            onChange={(event) =>
                              updateProject(project.id, {
                                featured: event.target.checked,
                              })
                            }
                          />{" "}
                          Destacado
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar ${project.title}?`))
                              commit({
                                ...draft,
                                projects: draft.projects.filter(
                                  (item) => item.id !== project.id,
                                ),
                              });
                          }}
                          className="ml-auto inline-flex items-center gap-2 rounded-2xl border border-rose-400/30 px-4 py-3 text-sm font-semibold text-rose-100 hover:bg-rose-500/10"
                        >
                          <FiTrash2 /> Eliminar
                        </button>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
              <PaginationControls
                page={projectsPage}
                pageCount={projectsPageCount}
                onChange={setProjectsPage}
                label="proyectos"
              />
            </section>
          )}

          {section === "experience" && (
            <CareerEntriesEditor
              content={draft}
              kind="workExperience"
              onChange={commit}
            />
          )}

          {section === "education" && (
            <CareerEntriesEditor
              content={draft}
              kind="education"
              onChange={commit}
            />
          )}

          {section === "certifications" && (
            <section>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <PageHeading
                  eyebrow="Skills & Certifications"
                  title="Certificaciones verificables"
                  description="Gestiona el slider de la landing. Cada tarjeta puede abrir el documento de referencia y enlazar a la validación oficial."
                />
                <button
                  type="button"
                  onClick={addCertification}
                  className="mb-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold"
                >
                  <FiPlus /> Nueva certificación
                </button>
              </div>
              <div className="mb-7 rounded-3xl border border-[#0a66c2]/35 bg-[#0a66c2]/10 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="rounded-2xl bg-[#0a66c2] p-3 text-xl text-white">
                    <FiLinkedin />
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-semibold">
                      Importar desde LinkedIn
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Importa desde una URL pública, un archivo HTML guardado o
                      contenido pegado. Los duplicados se descartan y cada
                      resultado queda completamente editable.
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3">
                  <input
                    type="url"
                    className={fieldClass}
                    value={linkedInCertificationsUrl}
                    onChange={(event) =>
                      setLinkedInCertificationsUrl(event.target.value)
                    }
                    placeholder="https://www.linkedin.com/in/usuario/details/certifications/"
                  />
                  <div className="flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-slate-500">
                    <span className="h-px flex-1 bg-white/10" /> o usa un
                    archivo / texto <span className="h-px flex-1 bg-white/10" />
                  </div>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-slate-950/25 px-5 py-4 text-sm font-semibold transition hover:border-[#0a66c2] hover:bg-white/5">
                    <FiUploadCloud />{" "}
                    {linkedInImportFileName ||
                      "Seleccionar HTML o TXT de LinkedIn"}
                    <input
                      type="file"
                      accept=".html,.htm,.txt,text/html,text/plain"
                      className="hidden"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        if (file.size > 10 * 1024 * 1024) {
                          setMessage(
                            "El archivo HTML supera el máximo de 10 MB.",
                          );
                          event.currentTarget.value = "";
                          return;
                        }
                        const rawContent = await file.text();
                        const compactContent = compactLinkedInImport(
                          rawContent,
                          /\.html?$/i.test(file.name) ||
                            file.type === "text/html",
                        );
                        if (!compactContent) {
                          setMessage(
                            "El archivo no contiene texto utilizable.",
                          );
                          return;
                        }
                        setLinkedInImportContent(compactContent);
                        setLinkedInImportFileName(file.name);
                        setMessage(`Archivo preparado: ${file.name}`);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                  <textarea
                    className={`${fieldClass} min-h-32`}
                    value={linkedInImportContent}
                    onChange={(event) => {
                      setLinkedInImportContent(
                        event.target.value.slice(0, 1_000_000),
                      );
                      setLinkedInImportFileName("");
                    }}
                    placeholder="También puedes pegar aquí el texto o HTML de la sección de certificaciones..."
                  />
                  <button
                    type="button"
                    onClick={() => void importLinkedInCertifications()}
                    disabled={
                      (!linkedInCertificationsUrl.trim() &&
                        !linkedInImportContent.trim()) ||
                      importingLinkedInCertifications
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0a66c2] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#07569f] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FiLinkedin />{" "}
                    {importingLinkedInCertifications
                      ? "Importando..."
                      : "Importar certificados"}
                  </button>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  El archivo se procesa localmente para eliminar scripts y
                  estilos antes de enviarlo. No se cargan cookies ni datos de
                  sesión de LinkedIn.
                </p>
              </div>
              {draft.certifications.length > 1 && (
                <div className="mb-8 space-y-3">
                  <p className="flex items-center gap-2 text-xs text-slate-500">
                    <FiMove /> Arrastra las certificaciones para cambiar su
                    orden de aparición. Las flechas funcionan como alternativa
                    táctil y accesible. Este ordenador siempre muestra la lista
                    completa.
                  </p>
                  <div className="grid gap-3 xl:grid-cols-2">
                  {draft.certifications.map((certification, index) => {
                    const absoluteIndex = index;

                    return (
                      <div
                        key={`certification-order-${certification.id}`}
                        data-certification-drop-id={certification.id}
                        onDragEnter={(event) => {
                          event.preventDefault();
                          event.dataTransfer.dropEffect = "move";
                          setDragOverCertificationId(certification.id);
                        }}
                        onDragOver={(event) => {
                          event.preventDefault();
                          event.dataTransfer.dropEffect = "move";
                          setDragOverCertificationId(certification.id);
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          const sourceId =
                            draggedCertificationId ??
                            event.dataTransfer.getData("text/plain");
                          if (sourceId) {
                            reorderCertifications(
                              sourceId,
                              certification.id,
                            );
                          }
                          resetCertificationDrag();
                        }}
                        className={`glass-panel flex items-center gap-3 border p-3 transition sm:gap-4 ${
                          dragOverCertificationId === certification.id &&
                          draggedCertificationId !== certification.id
                            ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 shadow-glow"
                            : "border-white/10"
                        } ${
                          draggedCertificationId === certification.id
                            ? "opacity-60"
                            : "opacity-100"
                        }`}
                      >
                        <span
                          draggable
                          role="button"
                          tabIndex={0}
                          title="Arrastrar para cambiar el orden"
                          aria-label={`Mover ${certification.title}`}
                          onDragStart={(event) => {
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData(
                              "text/plain",
                              certification.id,
                            );
                            setDraggedCertificationId(certification.id);
                            setDragOverCertificationId(certification.id);
                          }}
                          onDragEnd={resetCertificationDrag}
                          onPointerDown={(event) => {
                            if (event.pointerType === "mouse") return;
                            event.preventDefault();
                            event.currentTarget.setPointerCapture(
                              event.pointerId,
                            );
                            setDraggedCertificationId(certification.id);
                            setDragOverCertificationId(certification.id);
                          }}
                          onPointerMove={(event) => {
                            if (event.pointerType === "mouse") return;
                            const targetId = certificationDropTargetAt(
                              event.clientX,
                              event.clientY,
                            );
                            if (targetId) {
                              setDragOverCertificationId(targetId);
                            }
                          }}
                          onPointerUp={(event) => {
                            if (event.pointerType === "mouse") return;
                            const targetId = certificationDropTargetAt(
                              event.clientX,
                              event.clientY,
                            );
                            if (targetId) {
                              reorderCertifications(
                                certification.id,
                                targetId,
                              );
                            }
                            resetCertificationDrag();
                          }}
                          onPointerCancel={resetCertificationDrag}
                          className="inline-flex h-11 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-xl border border-dashed border-white/15 text-slate-500 transition hover:border-white/30 hover:bg-white/5 hover:text-white active:cursor-grabbing"
                        >
                          <FiMove />
                        </span>

                        <span className="w-5 text-center text-xs font-bold text-slate-600">
                          {absoluteIndex + 1}
                        </span>

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white text-xs font-bold text-slate-800">
                          {certification.logoUrl ? (
                            <img
                              src={certification.logoUrl}
                              alt=""
                              className="h-full w-full object-contain p-1"
                            />
                          ) : (
                            certification.issuer
                              .slice(0, 2)
                              .toUpperCase() || <FiAward />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {certification.title}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {certification.issuer || "Emisor pendiente"}
                          </p>
                        </div>

                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            aria-pressed={Boolean(certification.favorite)}
                            onClick={() =>
                              updateCertification(certification.id, {
                                favorite: !certification.favorite,
                              })
                            }
                            aria-label={`${certification.favorite ? "Quitar de favoritos" : "Marcar como favorito"}: ${certification.title}`}
                            title={
                              certification.favorite
                                ? "Quitar prioridad para el CV"
                                : "Priorizar en el CV"
                            }
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                              certification.favorite
                                ? "border-amber-300/40 bg-amber-300/10 text-amber-200"
                                : "border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <FiStar
                              className={
                                certification.favorite ? "fill-current" : ""
                              }
                            />
                          </button>
                          <button
                            type="button"
                            disabled={absoluteIndex === 0}
                            onClick={() =>
                              moveCertification(certification.id, -1)
                            }
                            aria-label={`Subir ${certification.title}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                          >
                            <FiArrowUp />
                          </button>
                          <button
                            type="button"
                            disabled={
                              absoluteIndex ===
                              draft.certifications.length - 1
                            }
                            onClick={() =>
                              moveCertification(certification.id, 1)
                            }
                            aria-label={`Bajar ${certification.title}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                          >
                            <FiArrowDown />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              )}
              {draft.certifications.length === 0 ? (
                <div className="glass-panel border border-dashed border-white/15 p-12 text-center">
                  <FiAward className="mx-auto text-4xl text-[var(--color-accent-soft)]" />
                  <h2 className="mt-4 font-display text-xl font-semibold">
                    Aún no hay certificaciones
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Añade la primera para activar el slider en la landing.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {paginatedCertifications.map((certification, index) => (
                    <details
                      key={certification.id}
                      open={index === 0}
                      className="glass-panel border border-white/10 p-6"
                    >
                      <summary className="flex cursor-pointer list-none items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white text-sm font-bold text-slate-800">
                          {certification.logoUrl ? (
                            <img
                              src={certification.logoUrl}
                              alt=""
                              className="h-full w-full object-contain p-1"
                            />
                          ) : (
                            certification.issuer.slice(0, 2).toUpperCase() || (
                              <FiAward />
                            )
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="truncate font-display text-xl font-semibold">
                            {certification.title}
                          </h2>
                          <p className="mt-1 truncate text-sm text-slate-500">
                            {certification.issuer || "Emisor pendiente"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          {certification.favorite ? (
                            <span
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-300/30 bg-amber-300/10 text-amber-200"
                              title="Favorito para el CV"
                              aria-label="Favorito para el CV"
                            >
                              <FiStar className="fill-current" />
                            </span>
                          ) : null}
                          {recentlyImportedCertificationIds.has(
                            certification.id,
                          ) && (
                            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">
                              Recién agregado
                            </span>
                          )}
                          <span className="hidden text-xs uppercase tracking-[0.18em] text-slate-500 sm:inline">
                            Editar
                          </span>
                        </div>
                      </summary>
                      <div className="mt-6 grid gap-5 border-t border-white/10 pt-6 lg:grid-cols-2">
                        <Field label="Título">
                          <input
                            className={fieldClass}
                            value={certification.title}
                            onChange={(event) =>
                              updateCertification(certification.id, {
                                title: event.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field label="Emisor">
                          <input
                            className={fieldClass}
                            value={certification.issuer}
                            onChange={(event) =>
                              updateCertification(certification.id, {
                                issuer: event.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field label="Fecha de emisión">
                          <input
                            className={fieldClass}
                            placeholder="Ej. Marzo 2026"
                            value={certification.issuedAt ?? ""}
                            onChange={(event) =>
                              updateCertification(certification.id, {
                                issuedAt: event.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field label="ID de credencial">
                          <input
                            className={fieldClass}
                            value={certification.credentialId ?? ""}
                            onChange={(event) =>
                              updateCertification(certification.id, {
                                credentialId: event.target.value,
                              })
                            }
                          />
                        </Field>
                        <div className="lg:col-span-2">
                          <Field label="Descripción">
                            <textarea
                              className={`${fieldClass} min-h-28`}
                              value={certification.description}
                              onChange={(event) =>
                                updateCertification(certification.id, {
                                  description: event.target.value,
                                })
                              }
                            />
                          </Field>
                        </div>
                        <Field label="URL de verificación">
                          <input
                            type="url"
                            className={fieldClass}
                            value={certification.verificationUrl}
                            onChange={(event) =>
                              updateCertification(certification.id, {
                                verificationUrl: event.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field label="PDF o imagen del certificado">
                          <input
                            className={fieldClass}
                            value={certification.certificateUrl}
                            onChange={(event) =>
                              updateCertification(certification.id, {
                                certificateUrl: event.target.value,
                              })
                            }
                          />
                        </Field>
                        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-slate-950/35 p-5">
                          <div className="grid items-end gap-4 lg:grid-cols-[1fr_auto]">
                            <Field label="Empresa o escuela en LinkedIn">
                              <input
                                type="url"
                                className={fieldClass}
                                placeholder="https://www.linkedin.com/company/..."
                                value={certification.organizationUrl}
                                onChange={(event) =>
                                  updateCertification(certification.id, {
                                    organizationUrl: event.target.value,
                                  })
                                }
                              />
                            </Field>
                            <button
                              type="button"
                              onClick={() =>
                                void resolveLinkedInLogo(certification)
                              }
                              disabled={resolvingLogo === certification.id}
                              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/10 disabled:opacity-50"
                            >
                              {resolvingLogo === certification.id
                                ? "Buscando..."
                                : "Obtener logo"}
                            </button>
                          </div>
                          <div className="mt-4 grid items-end gap-4 lg:grid-cols-[1fr_auto]">
                            <Field label="URL del logo · también puedes ajustarla manualmente">
                              <input
                                className={fieldClass}
                                value={certification.logoUrl ?? ""}
                                onChange={(event) =>
                                  updateCertification(certification.id, {
                                    logoUrl: event.target.value,
                                  })
                                }
                              />
                            </Field>
                            {certification.logoUrl && (
                              <img
                                src={certification.logoUrl}
                                alt={`Logo ${certification.issuer}`}
                                className="h-14 w-14 rounded-xl bg-white object-contain p-1"
                              />
                            )}
                          </div>
                          <p className="mt-3 text-xs leading-5 text-slate-500">
                            LinkedIn puede limitar la lectura automática. Si
                            ocurre, pega una URL pública del logo en el campo
                            anterior.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3 lg:col-span-2">
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/5">
                            <FiFileText />{" "}
                            {uploading === certification.id
                              ? "Subiendo..."
                              : "Subir certificado"}
                            <input
                              type="file"
                              accept="application/pdf,image/*"
                              className="hidden"
                              onChange={async (event) => {
                                const file = event.target.files?.[0];
                                if (!file) return;
                                const url = await uploadAsset(
                                  file,
                                  file.type === "application/pdf"
                                    ? "document"
                                    : "image",
                                  certification.id,
                                );
                                if (url)
                                  updateCertification(certification.id, {
                                    certificateUrl: url,
                                  });
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `¿Eliminar ${certification.title}?`,
                                )
                              )
                                commit({
                                  ...draft,
                                  certifications: draft.certifications.filter(
                                    (item) => item.id !== certification.id,
                                  ),
                                });
                            }}
                            className="ml-auto inline-flex items-center gap-2 rounded-2xl border border-rose-400/30 px-4 py-3 text-sm font-semibold text-rose-100 hover:bg-rose-500/10"
                          >
                            <FiTrash2 /> Eliminar
                          </button>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              )}
              <PaginationControls
                page={certificationsPage}
                pageCount={certificationsPageCount}
                onChange={setCertificationsPage}
                label="certificaciones"
              />
            </section>
          )}

          {section === "resume-builder" && (
            <ResumeBuilder
              content={draft}
              onChange={commit}
              onUploadProfileImage={(file) =>
                uploadAsset(file, "image", "resume-profile")
              }
              uploadingProfileImage={uploading === "resume-profile"}
            />
          )}

          {section === "settings" && (
            <section>
              <PageHeading
                eyebrow="Sistema"
                title="Configuración avanzada"
                description="Ajusta el tema, enlaces sociales, CV o edita el contenido completo en JSON."
              />
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="glass-panel border border-white/10 p-6">
                  <h2 className="font-display text-xl font-semibold">
                    Tema visual
                  </h2>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {Object.entries(draft.theme).map(([key, value]) => (
                      <label
                        key={key}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 p-3"
                      >
                        <input
                          type="color"
                          value={value}
                          onChange={(event) =>
                            commit({
                              ...draft,
                              theme: {
                                ...draft.theme,
                                [key]: event.target.value,
                              },
                            })
                          }
                          className="h-10 w-10 rounded-lg bg-transparent"
                        />
                        <span className="text-sm capitalize text-slate-300">
                          {key}
                        </span>
                        <span className="ml-auto text-xs text-slate-600">
                          {value}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="glass-panel space-y-5 border border-white/10 p-6">
                  <h2 className="font-display text-xl font-semibold">
                    Currículum
                  </h2>
                  <Field label="Título">
                    <input
                      className={fieldClass}
                      value={draft.resume.title}
                      onChange={(event) =>
                        commit({
                          ...draft,
                          resume: {
                            ...draft.resume,
                            title: event.target.value,
                          },
                        })
                      }
                    />
                  </Field>
                  <Field label="Descripción">
                    <textarea
                      className={`${fieldClass} min-h-24`}
                      value={draft.resume.description}
                      onChange={(event) =>
                        commit({
                          ...draft,
                          resume: {
                            ...draft.resume,
                            description: event.target.value,
                          },
                        })
                      }
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {([
                      {
                        language: "en",
                        title: "Currículum en inglés",
                        hint: "Documento predeterminado",
                        url: draft.resume.downloadUrlEn,
                      },
                      {
                        language: "es",
                        title: "Currículum en español",
                        hint: "Se muestra al seleccionar ES",
                        url: draft.resume.downloadUrlEs,
                      },
                    ] as const).map((document) => {
                      const uploadKey = `resume-${document.language}`;
                      return (
                        <div
                          key={document.language}
                          className="rounded-2xl border border-white/10 bg-slate-950/30 p-4"
                        >
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-white">{document.title}</p>
                            <p className="mt-1 text-xs text-slate-500">{document.hint}</p>
                          </div>
                          <Field label={`URL del PDF · ${document.language.toUpperCase()}`}>
                            <input
                              className={fieldClass}
                              value={document.url}
                              onChange={(event) =>
                                updateResumeDocument(document.language, event.target.value)
                              }
                            />
                          </Field>
                          <label
                            className={`mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/5 ${
                              uploading ? "cursor-wait opacity-60" : "cursor-pointer"
                            }`}
                          >
                            <FiUploadCloud />
                            {uploading === uploadKey
                              ? "Subiendo..."
                              : `Subir PDF ${document.language.toUpperCase()}`}
                            <input
                              type="file"
                              accept="application/pdf"
                              className="hidden"
                              disabled={Boolean(uploading)}
                              onChange={async (event) => {
                                const input = event.currentTarget;
                                const file = input.files?.[0];
                                if (!file) return;
                                const url = await uploadAsset(file, "document", uploadKey);
                                if (url) updateResumeDocument(document.language, url);
                                input.value = "";
                              }}
                            />
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="mt-6 glass-panel border border-white/10 p-6">
                <h2 className="font-display text-xl font-semibold">
                  Otros enlaces sociales
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  GitHub y LinkedIn se administran junto a la información de
                  contacto en Perfil &amp; skills.
                </p>
                <div className="mt-5 space-y-3">
                  {draft.socials.map((social, index) => {
                    if (
                      ["github", "linkedin"].includes(
                        social.label.toLowerCase(),
                      )
                    )
                      return null;
                    return (
                      <div
                        key={`${social.label}-${index}`}
                        className="grid grid-cols-[0.5fr_1fr_auto] gap-3"
                      >
                        <input
                          className={fieldClass}
                          value={social.label}
                          onChange={(event) =>
                            commit({
                              ...draft,
                              socials: draft.socials.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, label: event.target.value }
                                  : item,
                              ),
                            })
                          }
                        />
                        <input
                          className={fieldClass}
                          value={social.href}
                          onChange={(event) =>
                            commit({
                              ...draft,
                              socials: draft.socials.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, href: event.target.value }
                                  : item,
                              ),
                            })
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            commit({
                              ...draft,
                              socials: draft.socials.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            })
                          }
                          className="px-3 text-rose-300"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    commit({
                      ...draft,
                      socials: [
                        ...draft.socials,
                        { label: "Nuevo", href: "https://" },
                      ],
                    })
                  }
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm"
                >
                  <FiPlus /> Añadir enlace
                </button>
              </div>
              <div className="mt-6 glass-panel border border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-xl font-semibold">
                      JSON completo
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Para ajustes avanzados o copias de seguridad.
                    </p>
                  </div>
                  <FiFileText className="text-[var(--color-accent-soft)]" />
                </div>
                <textarea
                  spellCheck={false}
                  className={`${fieldClass} mt-5 min-h-[520px] font-mono text-xs leading-6`}
                  value={jsonValue}
                  onChange={(event) => {
                    const value = event.target.value;
                    setJsonValue(value);
                    try {
                      const parsed = JSON.parse(value) as SiteContent;
                      if (!Array.isArray(parsed.certifications))
                        parsed.certifications = [];
                      if (!Array.isArray(parsed.workExperience))
                        parsed.workExperience = [];
                      if (!Array.isArray(parsed.education))
                        parsed.education = [];
                      parsed.translations = {
                        es: parsed.translations?.es ?? {},
                      };
                      parsed.contact = {
                        location:
                          parsed.contact?.location ||
                          parsed.home.location ||
                          parsed.site.location,
                        phone: parsed.contact?.phone || "",
                        email: parsed.contact?.email || parsed.site.email,
                        githubUrl:
                          parsed.contact?.githubUrl ||
                          parsed.socials.find(
                            (social) => social.label.toLowerCase() === "github",
                          )?.href ||
                          "",
                        linkedinUrl:
                          parsed.contact?.linkedinUrl ||
                          parsed.socials.find(
                            (social) =>
                              social.label.toLowerCase() === "linkedin",
                          )?.href ||
                          "",
                        portfolioUrl: parsed.contact?.portfolioUrl || "",
                      };
                      parsed.resume = {
                        ...parsed.resume,
                        fullName: parsed.resume?.fullName || parsed.site.name,
                        softSkills: Array.isArray(parsed.resume?.softSkills)
                          ? parsed.resume.softSkills
                          : [],
                        languages: Array.isArray(parsed.resume?.languages)
                          ? parsed.resume.languages
                          : [],
                      };
                      setDraft(parsed);
                      setDirty(true);
                      setJsonError(null);
                    } catch {
                      setJsonError(
                        "El JSON no es válido. Corrígelo antes de guardar.",
                      );
                    }
                  }}
                />
                {jsonError && (
                  <p className="mt-3 text-sm text-rose-300">{jsonError}</p>
                )}
              </div>
            </section>
          )}

          {section !== "dashboard" && section !== "resume-builder" && (
            <TranslationEditor
              content={draft}
              section={section}
              onChange={commit}
            />
          )}
        </div>
      </div>
    </main>
  );
}
