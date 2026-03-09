"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  FiCopy,
  FiEye,
  FiFileText,
  FiImage,
  FiLogOut,
  FiPlus,
  FiSave,
  FiTrash2,
  FiUploadCloud,
} from "react-icons/fi";

import type {
  MediaItem,
  MediaLibrary,
  Project,
  SiteContent,
  ThemeConfig,
} from "@/types/site";

const themeFields: Array<{ key: keyof ThemeConfig; label: string }> = [
  { key: "accent", label: "Accent" },
  { key: "accentSoft", label: "Accent soft" },
  { key: "background", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "card", label: "Card" },
  { key: "text", label: "Text" },
  { key: "muted", label: "Muted" },
  { key: "ring", label: "Ring" },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type ToastTone = "success" | "error" | "info";

type ToastMessage = {
  id: number;
  tone: ToastTone;
  message: string;
};

type ConfirmDialog =
  | {
      kind: "delete-media";
      title: string;
      message: string;
      confirmLabel: string;
      tone: "danger";
      media: MediaItem;
    }
  | {
      kind: "delete-project";
      title: string;
      message: string;
      confirmLabel: string;
      tone: "danger";
      projectId: string;
    }
  | {
      kind: "logout";
      title: string;
      message: string;
      confirmLabel: string;
      tone: "default";
    }
  | null;

export function AdminClient({ initialContent }: { initialContent: SiteContent }) {
  const router = useRouter();
  const [draft, setDraft] = useState<SiteContent>(initialContent);
  const [rawJson, setRawJson] = useState(JSON.stringify(initialContent, null, 2));
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [mediaStatus, setMediaStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<"image" | "document" | null>(null);
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>(null);
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(null);

  const imageLibrary = useMemo(
    () => mediaLibrary.filter((item) => item.kind === "image"),
    [mediaLibrary]
  );

  const stats = useMemo(
    () => [
      { label: "Proyectos", value: String(draft.projects.length) },
      { label: "Skills", value: String(draft.about.skillset.length) },
      { label: "Tools", value: String(draft.about.toolset.length) },
    ],
    [draft]
  );

  function syncDraft(nextValue: SiteContent) {
    setDraft(nextValue);
    setRawJson(JSON.stringify(nextValue, null, 2));
    setJsonError(null);
    setStatus(null);
  }

  function removeToast(toastId: number) {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== toastId));
  }

  function pushToast(message: string, tone: ToastTone = "info") {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((currentToasts) => [...currentToasts, { id, tone, message }]);

    globalThis.setTimeout(() => {
      removeToast(id);
    }, 3200);
  }

  useEffect(() => {
    async function loadMediaLibrary() {
      try {
        const response = await fetch("/api/admin/media", { cache: "no-store" });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as MediaLibrary;
        setMediaLibrary(data.items);
      } catch {
        setMediaStatus("No se pudo cargar la librería de archivos locales.");
        pushToast("No se pudo cargar la librería de archivos locales.", "error");
      }
    }

    void loadMediaLibrary();
  }, []);

  function handleThemeChange(key: keyof ThemeConfig, value: string) {
    syncDraft({
      ...draft,
      theme: {
        ...draft.theme,
        [key]: value,
      },
    });
  }

  function handleJsonChange(value: string) {
    setRawJson(value);
    setStatus(null);

    try {
      const parsed = JSON.parse(value) as SiteContent;
      setDraft(parsed);
      setJsonError(null);
    } catch {
      setJsonError("JSON inválido. Corrige el formato antes de guardar.");
    }
  }

  function isMediaInUse(url: string) {
    return (
      draft.about.profileImage === url ||
      draft.resume.downloadUrl === url ||
      draft.home.secondaryCta.href === url ||
      draft.projects.some((project) => project.image === url)
    );
  }

  function applyProfileImage(url: string) {
    syncDraft({
      ...draft,
      about: {
        ...draft.about,
        profileImage: url,
      },
    });
    setMediaStatus("Imagen aplicada como foto de perfil. Solo falta guardar los cambios.");
    pushToast("Imagen aplicada como foto de perfil.", "success");
  }

  function applyResumeFile(url: string) {
    syncDraft({
      ...draft,
      home: {
        ...draft.home,
        secondaryCta: {
          ...draft.home.secondaryCta,
          href: url,
        },
      },
      resume: {
        ...draft.resume,
        downloadUrl: url,
      },
    });
    setMediaStatus("PDF aplicado como CV principal. Solo falta guardar los cambios.");
    pushToast("PDF aplicado como CV principal.", "success");
  }

  function updateHomeField<K extends keyof SiteContent["home"]>(
    field: K,
    value: SiteContent["home"][K]
  ) {
    syncDraft({
      ...draft,
      home: {
        ...draft.home,
        [field]: value,
      },
    });
  }

  function updateHomeCta(
    ctaKey: "primaryCta" | "secondaryCta",
    field: "label" | "href",
    value: string
  ) {
    updateHomeField(ctaKey, {
      ...draft.home[ctaKey],
      [field]: value,
    });
  }

  function updateHomeMetric(index: number, field: "label" | "value", value: string) {
    updateHomeField(
      "metrics",
      draft.home.metrics.map((metric, metricIndex) =>
        metricIndex === index ? { ...metric, [field]: value } : metric
      )
    );
  }

  function addHomeMetric() {
    updateHomeField("metrics", [...draft.home.metrics, { label: "Nuevo dato", value: "Valor" }]);
    pushToast("Métrica agregada al home.", "success");
  }

  function removeHomeMetric(index: number) {
    updateHomeField(
      "metrics",
      draft.home.metrics.filter((_, metricIndex) => metricIndex !== index)
    );
    pushToast("Métrica eliminada del home.", "success");
  }

  function updateMultilineList(value: string) {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function updateAboutField<K extends keyof SiteContent["about"]>(
    field: K,
    value: SiteContent["about"][K]
  ) {
    syncDraft({
      ...draft,
      about: {
        ...draft.about,
        [field]: value,
      },
    });
  }

  function reorderProjects(sourceId: string, targetId: string) {
    if (sourceId === targetId) {
      return;
    }

    const nextProjects = [...draft.projects];
    const sourceIndex = nextProjects.findIndex((project) => project.id === sourceId);
    const targetIndex = nextProjects.findIndex((project) => project.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) {
      return;
    }

    const [movedProject] = nextProjects.splice(sourceIndex, 1);
    nextProjects.splice(targetIndex, 0, movedProject);

    syncDraft({
      ...draft,
      projects: nextProjects,
    });
    pushToast("Orden de proyectos actualizado en el borrador.", "info");
  }

  function updateProject(projectId: string, updater: (project: Project) => Project) {
    syncDraft({
      ...draft,
      projects: draft.projects.map((project) =>
        project.id === projectId ? updater(project) : project
      ),
    });
  }

  function updateProjectField<K extends keyof Project>(
    projectId: string,
    field: K,
    value: Project[K]
  ) {
    updateProject(projectId, (project) => ({
      ...project,
      [field]: value,
    }));
  }

  function updateProjectStack(projectId: string, value: string) {
    updateProject(projectId, (project) => ({
      ...project,
      stack: value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    }));
  }

  function applyProjectImage(projectId: string, url: string) {
    updateProjectField(projectId, "image", url);
    setMediaStatus("Imagen de proyecto actualizada. Solo falta guardar los cambios.");
  }

  function addProject() {
    const fallbackImage =
      imageLibrary[0]?.url || draft.projects[0]?.image || draft.about.profileImage;
    const timestamp = Date.now();

    syncDraft({
      ...draft,
      projects: [
        ...draft.projects,
        {
          id: `project-${timestamp}`,
          title: "Nuevo proyecto",
          description: "Describe aquí el proyecto.",
          stack: ["Next.js"],
          image: fallbackImage,
          demoUrl: "",
          githubUrl: "",
          featured: false,
        },
      ],
    });
    setMediaStatus("Proyecto creado. Completa sus campos y luego guarda los cambios.");
    pushToast("Proyecto creado en el editor visual.", "success");
  }

  function removeProject(projectId: string) {
    syncDraft({
      ...draft,
      projects: draft.projects.filter((project) => project.id !== projectId),
    });
    setMediaStatus("Proyecto eliminado del borrador. Solo falta guardar los cambios.");
    pushToast("Proyecto eliminado del borrador.", "success");
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setMediaStatus(`Ruta copiada: ${url}`);
      pushToast("Ruta copiada al portapapeles.", "success");
    } catch {
      setMediaStatus("No se pudo copiar la ruta automáticamente.");
      pushToast("No se pudo copiar la ruta automáticamente.", "error");
    }
  }

  async function uploadFile(file: File, kind: "image" | "document") {
    setUploadingKind(kind);
    setMediaStatus(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", kind);

      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { error?: string; item?: MediaItem };

      if (!response.ok || !data.item) {
        setMediaStatus(data.error ?? "No se pudo subir el archivo.");
        pushToast(data.error ?? "No se pudo subir el archivo.", "error");
        return null;
      }

      setMediaLibrary((currentItems) => [data.item as MediaItem, ...currentItems]);

      if (kind === "document") {
        applyResumeFile(data.item.url);
      }

      setMediaStatus(`Archivo guardado localmente en ${data.item.url}`);
      pushToast(`Archivo guardado localmente en ${data.item.url}`, "success");
      router.refresh();

      return data.item;
    } catch {
      setMediaStatus("Error al subir el archivo al almacenamiento local.");
      pushToast("Error al subir el archivo al almacenamiento local.", "error");
      return null;
    } finally {
      setUploadingKind(null);
    }
  }

  async function uploadProfileImage(file: File) {
    const item = await uploadFile(file, "image");

    if (item) {
      applyProfileImage(item.url);
    }
  }

  async function uploadProjectImage(projectId: string, file: File) {
    const item = await uploadFile(file, "image");

    if (item) {
      applyProjectImage(projectId, item.url);
    }
  }

  function requestDeleteMedia(item: MediaItem) {
    if (isMediaInUse(item.url)) {
      setMediaStatus(
        "Ese archivo está en uso. Reemplázalo primero en perfil, CV o proyectos antes de borrarlo."
      );
      pushToast(
        "Ese archivo está en uso. Reemplázalo primero en perfil, CV o proyectos antes de borrarlo.",
        "error"
      );
      return;
    }

    setConfirmDialog({
      kind: "delete-media",
      title: "Eliminar archivo local",
      message: `Se borrará ${item.name} del almacenamiento local y del índice JSON. Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar archivo",
      tone: "danger",
      media: item,
    });
  }

  async function deleteMedia(item: MediaItem) {
    setDeletingMediaId(item.id);
    setMediaStatus(null);

    try {
      const response = await fetch(`/api/admin/media?id=${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMediaStatus(data.error ?? "No se pudo eliminar el archivo.");
        pushToast(data.error ?? "No se pudo eliminar el archivo.", "error");
        return;
      }

      setMediaLibrary((currentItems) => currentItems.filter((entry) => entry.id !== item.id));
      setMediaStatus("Archivo eliminado del almacenamiento local.");
      pushToast("Archivo eliminado del almacenamiento local.", "success");
      router.refresh();
    } catch {
      setMediaStatus("No se pudo eliminar el archivo seleccionado.");
      pushToast("No se pudo eliminar el archivo seleccionado.", "error");
    } finally {
      setDeletingMediaId(null);
    }
  }

  function requestRemoveProject(project: Project) {
    setConfirmDialog({
      kind: "delete-project",
      title: "Eliminar proyecto",
      message: `Se quitará ${project.title} del borrador actual. Podrás recuperarlo solo si no has guardado aún o lo vuelves a crear manualmente.`,
      confirmLabel: "Eliminar proyecto",
      tone: "danger",
      projectId: project.id,
    });
  }

  function requestLogout() {
    setConfirmDialog({
      kind: "logout",
      title: "Cerrar sesión",
      message: "Se cerrará la sesión del panel de administración en este navegador.",
      confirmLabel: "Cerrar sesión",
      tone: "default",
    });
  }

  async function handleConfirmAction() {
    if (!confirmDialog) {
      return;
    }

    const dialog = confirmDialog;
    setConfirmDialog(null);

    if (dialog.kind === "delete-media") {
      await deleteMedia(dialog.media);
      return;
    }

    if (dialog.kind === "delete-project") {
      removeProject(dialog.projectId);
      return;
    }

    await handleLogout();
  }

  async function handleSave() {
    setSaving(true);
    setStatus(null);

    try {
      const parsed = JSON.parse(rawJson) as SiteContent;
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setStatus(data.error ?? "No fue posible guardar los cambios.");
        pushToast(data.error ?? "No fue posible guardar los cambios.", "error");
        return;
      }

      setDraft(parsed);
      setRawJson(JSON.stringify(parsed, null, 2));
      setJsonError(null);
      setStatus("Cambios guardados correctamente.");
      pushToast("Cambios guardados correctamente.", "success");
      router.refresh();
    } catch {
      setStatus("No fue posible guardar. Revisa el JSON y vuelve a intentar.");
      pushToast("No fue posible guardar. Revisa el JSON y vuelve a intentar.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="glass-panel border border-white/10 p-6 shadow-glow sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="section-label">Control Room</p>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-white">
                Editor visual + contenido en JSON
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                Ahora puedes subir, borrar y reutilizar archivos locales, reemplazar
                imágenes de proyectos y editar los proyectos visualmente sin tocar JSON.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <FiEye />
                Ver sitio
              </Link>
              <button
                type="button"
                onClick={requestLogout}
                disabled={loggingOut}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
              >
                <FiLogOut />
                {loggingOut ? "Saliendo..." : "Cerrar sesión"}
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {stats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="space-y-8">
            <div className="glass-panel border border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-semibold text-white">Tema rápido</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Estos colores actualizan automáticamente el JSON.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {themeFields.map((field) => (
                  <label
                    key={field.key}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <input
                      type="color"
                      value={draft.theme[field.key]}
                      onChange={(event) => handleThemeChange(field.key, event.target.value)}
                      className="h-12 w-12 cursor-pointer rounded-xl border border-white/10 bg-transparent"
                    />
                    <span className="flex-1 text-sm font-medium text-slate-200">
                      {field.label}
                    </span>
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      {draft.theme[field.key]}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="glass-panel border border-white/10 p-6">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">Archivos locales</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Se guardan directamente en la app y se indexan en JSON dentro de
                  <span className="font-semibold text-slate-200"> content/media-library.json</span>.
                </p>
              </div>

              <div className="mt-6 grid gap-4">
                <label className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <span className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                    <FiImage />
                    Subir imagen
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingKind !== null}
                    onChange={(event) => {
                      const nextFile = event.target.files?.[0];

                      if (nextFile) {
                        void uploadFile(nextFile, "image");
                        event.target.value = "";
                      }
                    }}
                    className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-[var(--color-accent)] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:opacity-90"
                  />
                </label>

                <label className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <span className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                    <FiFileText />
                    Subir CV en PDF
                  </span>
                  <input
                    type="file"
                    accept="application/pdf"
                    disabled={uploadingKind !== null}
                    onChange={(event) => {
                      const nextFile = event.target.files?.[0];

                      if (nextFile) {
                        void uploadFile(nextFile, "document");
                        event.target.value = "";
                      }
                    }}
                    className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-[var(--color-accent)] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:opacity-90"
                  />
                </label>
              </div>

              <div className="mt-6 space-y-3">
                {mediaLibrary.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-5 text-sm text-slate-400">
                    Aún no hay archivos subidos al almacenamiento local.
                  </div>
                ) : (
                  mediaLibrary.map((item) => {
                    const locked = isMediaInUse(item.url);

                    return (
                      <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex flex-col gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">{item.name}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                              {item.kind === "image" ? "Imagen" : "Documento"} · {item.url}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => void copyUrl(item.url)}
                              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                            >
                              <FiCopy />
                              Copiar ruta
                            </button>

                            {item.kind === "image" && (
                              <button
                                type="button"
                                onClick={() => applyProfileImage(item.url)}
                                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                              >
                                <FiImage />
                                Usar como perfil
                              </button>
                            )}

                            {item.kind === "document" && (
                              <button
                                type="button"
                                onClick={() => applyResumeFile(item.url)}
                                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                              >
                                <FiUploadCloud />
                                Usar como CV
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => requestDeleteMedia(item)}
                              disabled={locked || deletingMediaId === item.id}
                              className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <FiTrash2 />
                              {deletingMediaId === item.id ? "Borrando..." : "Borrar"}
                            </button>
                          </div>

                          {locked && (
                            <p className="text-xs text-amber-200">
                              Este archivo está enlazado al contenido actual. Reemplázalo antes de borrarlo.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="glass-panel border border-white/10 p-6">
              <div className="grid gap-8 xl:grid-cols-2">
                <section className="space-y-5">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-white">Editor visual de home</h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Ajusta el hero principal, CTAs, highlights y métricas sin editar JSON.
                    </p>
                  </div>

                  <div className="grid gap-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-200">Eyebrow</span>
                      <input
                        type="text"
                        value={draft.home.eyebrow}
                        onChange={(event) => updateHomeField("eyebrow", event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-200">Título</span>
                      <textarea
                        value={draft.home.title}
                        onChange={(event) => updateHomeField("title", event.target.value)}
                        className="min-h-[90px] w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-200">Subtítulo</span>
                      <textarea
                        value={draft.home.subtitle}
                        onChange={(event) => updateHomeField("subtitle", event.target.value)}
                        className="min-h-[90px] w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-200">Descripción</span>
                      <textarea
                        value={draft.home.description}
                        onChange={(event) => updateHomeField("description", event.target.value)}
                        className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                      />
                    </label>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-200">Disponibilidad</span>
                        <input
                          type="text"
                          value={draft.home.availability}
                          onChange={(event) => updateHomeField("availability", event.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-200">Ubicación</span>
                        <input
                          type="text"
                          value={draft.home.location}
                          onChange={(event) => updateHomeField("location", event.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                        />
                      </label>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="mb-3 text-sm font-semibold text-white">CTA principal</p>
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={draft.home.primaryCta.label}
                            onChange={(event) => updateHomeCta("primaryCta", "label", event.target.value)}
                            placeholder="Label"
                            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                          />
                          <input
                            type="text"
                            value={draft.home.primaryCta.href}
                            onChange={(event) => updateHomeCta("primaryCta", "href", event.target.value)}
                            placeholder="Href"
                            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                          />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="mb-3 text-sm font-semibold text-white">CTA secundaria</p>
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={draft.home.secondaryCta.label}
                            onChange={(event) => updateHomeCta("secondaryCta", "label", event.target.value)}
                            placeholder="Label"
                            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                          />
                          <input
                            type="text"
                            value={draft.home.secondaryCta.href}
                            onChange={(event) => updateHomeCta("secondaryCta", "href", event.target.value)}
                            placeholder="Href"
                            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">Métricas</p>
                          <p className="text-xs text-slate-400">Puedes sumar, editar o quitar bloques.</p>
                        </div>
                        <button
                          type="button"
                          onClick={addHomeMetric}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                        >
                          <FiPlus />
                          Añadir
                        </button>
                      </div>

                      <div className="space-y-3">
                        {draft.home.metrics.map((metric, index) => (
                          <div key={`${metric.label}-${index}`} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                            <input
                              type="text"
                              value={metric.label}
                              onChange={(event) => updateHomeMetric(index, "label", event.target.value)}
                              placeholder="Label"
                              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                            />
                            <input
                              type="text"
                              value={metric.value}
                              onChange={(event) => updateHomeMetric(index, "value", event.target.value)}
                              placeholder="Value"
                              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => removeHomeMetric(index)}
                              className="inline-flex items-center justify-center rounded-2xl border border-rose-400/30 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/10"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <label className="block rounded-2xl border border-white/10 bg-white/5 p-4">
                      <span className="mb-2 block text-sm font-semibold text-white">Highlights</span>
                      <span className="mb-3 block text-xs text-slate-400">Uno por línea.</span>
                      <textarea
                        value={draft.home.highlights.join("\n")}
                        onChange={(event) => updateHomeField("highlights", updateMultilineList(event.target.value))}
                        className="min-h-[150px] w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                      />
                    </label>
                  </div>
                </section>

                <section className="space-y-5">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-white">Editor visual de about</h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Controla el perfil, resumen, stack y áreas de enfoque desde el panel.
                    </p>
                  </div>

                  <div className="grid gap-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-200">Headline</span>
                      <textarea
                        value={draft.about.headline}
                        onChange={(event) => updateAboutField("headline", event.target.value)}
                        className="min-h-[100px] w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                      />
                    </label>

                    <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
                      <div className="space-y-3">
                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70">
                          <img
                            src={draft.about.profileImage}
                            alt="Foto de perfil"
                            className="aspect-square h-auto w-full object-cover"
                          />
                        </div>
                        <label className="block rounded-2xl border border-white/10 bg-white/5 p-3">
                          <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                            <FiUploadCloud />
                            Reemplazar perfil
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingKind !== null}
                            onChange={(event) => {
                              const nextFile = event.target.files?.[0];

                              if (nextFile) {
                                void uploadProfileImage(nextFile);
                                event.target.value = "";
                              }
                            }}
                            className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-[var(--color-accent)] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:opacity-90"
                          />
                        </label>
                      </div>

                      <div className="space-y-4">
                        <label className="block rounded-2xl border border-white/10 bg-white/5 p-4">
                          <span className="mb-2 block text-sm font-semibold text-white">Imagen de perfil</span>
                          <select
                            value={draft.about.profileImage}
                            onChange={(event) => applyProfileImage(event.target.value)}
                            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                          >
                            {imageLibrary.map((item) => (
                              <option key={item.id} value={item.url}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="block rounded-2xl border border-white/10 bg-white/5 p-4">
                          <span className="mb-2 block text-sm font-semibold text-white">Resumen</span>
                          <span className="mb-3 block text-xs text-slate-400">Un párrafo por línea.</span>
                          <textarea
                            value={draft.about.summary.join("\n")}
                            onChange={(event) => updateAboutField("summary", updateMultilineList(event.target.value))}
                            className="min-h-[150px] w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block rounded-2xl border border-white/10 bg-white/5 p-4">
                        <span className="mb-2 block text-sm font-semibold text-white">Skillset</span>
                        <span className="mb-3 block text-xs text-slate-400">Una skill por línea.</span>
                        <textarea
                          value={draft.about.skillset.join("\n")}
                          onChange={(event) => updateAboutField("skillset", updateMultilineList(event.target.value))}
                          className="min-h-[180px] w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                        />
                      </label>

                      <label className="block rounded-2xl border border-white/10 bg-white/5 p-4">
                        <span className="mb-2 block text-sm font-semibold text-white">Toolset</span>
                        <span className="mb-3 block text-xs text-slate-400">Una herramienta por línea.</span>
                        <textarea
                          value={draft.about.toolset.join("\n")}
                          onChange={(event) => updateAboutField("toolset", updateMultilineList(event.target.value))}
                          className="min-h-[180px] w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                        />
                      </label>
                    </div>

                    <label className="block rounded-2xl border border-white/10 bg-white/5 p-4">
                      <span className="mb-2 block text-sm font-semibold text-white">Focus areas</span>
                      <span className="mb-3 block text-xs text-slate-400">Una línea por área.</span>
                      <textarea
                        value={draft.about.focusAreas.join("\n")}
                        onChange={(event) => updateAboutField("focusAreas", updateMultilineList(event.target.value))}
                        className="min-h-[150px] w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                      />
                    </label>
                  </div>
                </section>
              </div>
            </div>

            <div className="glass-panel border border-white/10 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="font-display text-xl font-semibold text-white">Editor visual de proyectos</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Edita títulos, descripciones, enlaces, stack e imágenes sin tocar el JSON.
                    También puedes arrastrar para reordenarlos.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addProject}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <FiPlus />
                  Nuevo proyecto
                </button>
              </div>

              <div className="mt-6 space-y-6">
                {draft.projects.map((project) => (
                  <div
                    key={project.id}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragOverProjectId(project.id);
                    }}
                    onDrop={() => {
                      if (draggedProjectId) {
                        reorderProjects(draggedProjectId, project.id);
                      }
                      setDraggedProjectId(null);
                      setDragOverProjectId(null);
                    }}
                    onDragEnd={() => {
                      setDraggedProjectId(null);
                      setDragOverProjectId(null);
                    }}
                    className={`rounded-[28px] border bg-white/5 p-5 transition ${
                      dragOverProjectId === project.id
                        ? "border-[var(--color-accent)] shadow-glow"
                        : "border-white/10"
                    } ${draggedProjectId === project.id ? "opacity-70" : "opacity-100"}`}
                  >
                    <div
                      draggable
                      onDragStart={() => {
                        setDraggedProjectId(project.id);
                        setDragOverProjectId(project.id);
                      }}
                      className="mb-5 flex cursor-grab items-center justify-between rounded-2xl border border-dashed border-white/15 bg-slate-950/40 px-4 py-3 active:cursor-grabbing"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">Arrastra para reordenar</p>
                        <p className="text-xs text-slate-400">La nueva posición quedará lista para guardar.</p>
                      </div>
                      <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Drag & Drop</span>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
                      <div className="space-y-4">
                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70">
                          <img
                            src={project.image}
                            alt={project.title}
                            className="aspect-[16/10] h-auto w-full object-cover"
                          />
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-xs text-slate-400">
                          Ruta actual: <span className="text-slate-200">{project.image}</span>
                        </div>

                        <label className="block rounded-2xl border border-white/10 bg-white/5 p-3">
                          <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                            <FiUploadCloud />
                            Reemplazar imagen
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingKind !== null}
                            onChange={(event) => {
                              const nextFile = event.target.files?.[0];

                              if (nextFile) {
                                void uploadProjectImage(project.id, nextFile);
                                event.target.value = "";
                              }
                            }}
                            className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-[var(--color-accent)] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:opacity-90"
                          />
                        </label>

                        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                            Usar imagen existente
                          </label>
                          <select
                            value={project.image}
                            onChange={(event) => applyProjectImage(project.id, event.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-3 text-sm text-white outline-none"
                          >
                            {imageLibrary.map((item) => (
                              <option key={item.id} value={item.url}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-200">Título</span>
                            <input
                              type="text"
                              value={project.title}
                              onChange={(event) => updateProjectField(project.id, "title", event.target.value)}
                              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                            />
                          </label>

                          <label className="flex items-end gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                            <input
                              type="checkbox"
                              checked={Boolean(project.featured)}
                              onChange={(event) =>
                                updateProjectField(project.id, "featured", event.target.checked)
                              }
                              className="h-4 w-4 rounded border-white/20 bg-transparent"
                            />
                            <span className="text-sm font-medium text-slate-200">Marcar como destacado</span>
                          </label>
                        </div>

                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-200">Descripción</span>
                          <textarea
                            value={project.description}
                            onChange={(event) =>
                              updateProjectField(project.id, "description", event.target.value)
                            }
                            className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-200">Stack</span>
                          <input
                            type="text"
                            value={project.stack.join(", ")}
                            onChange={(event) => updateProjectStack(project.id, event.target.value)}
                            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                          />
                          <span className="mt-2 block text-xs text-slate-500">
                            Separa cada tecnología con coma.
                          </span>
                        </label>

                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-200">Demo URL</span>
                            <input
                              type="text"
                              value={project.demoUrl ?? ""}
                              onChange={(event) =>
                                updateProjectField(project.id, "demoUrl", event.target.value)
                              }
                              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                            />
                          </label>

                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-200">GitHub URL</span>
                            <input
                              type="text"
                              value={project.githubUrl ?? ""}
                              onChange={(event) =>
                                updateProjectField(project.id, "githubUrl", event.target.value)
                              }
                              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                            />
                          </label>
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => requestRemoveProject(project)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/30 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/10"
                          >
                            <FiTrash2 />
                            Eliminar proyecto
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel border border-white/10 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="font-display text-xl font-semibold text-white">Contenido editable</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    El editor visual mantiene sincronizado el JSON. Si quieres, aún puedes
                    ajustar todo manualmente aquí.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || Boolean(jsonError)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiSave />
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/70 p-2">
                <textarea
                  value={rawJson}
                  onChange={(event) => handleJsonChange(event.target.value)}
                  spellCheck={false}
                  className="min-h-[720px] w-full resize-y rounded-xl bg-transparent p-4 font-mono text-sm leading-6 text-slate-200 outline-none"
                />
              </div>

              {jsonError && (
                <div
                  className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
                >
                  {jsonError}
                </div>
              )}
            </div>
          </div>
        </section>

        {confirmDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-6 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[var(--color-surface)] p-6 shadow-2xl">
              <p className="section-label">Confirmación</p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-white">
                {confirmDialog.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{confirmDialog.message}</p>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirmAction()}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 ${
                    confirmDialog.tone === "danger"
                      ? "bg-rose-500"
                      : "bg-[var(--color-accent)]"
                  }`}
                >
                  {confirmDialog.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-lg backdrop-blur ${
                toast.tone === "success"
                  ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
                  : toast.tone === "error"
                    ? "border-rose-400/30 bg-rose-500/15 text-rose-100"
                    : "border-cyan-400/30 bg-cyan-500/15 text-cyan-100"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 text-sm leading-6">{toast.message}</div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70 transition hover:opacity-100"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
