"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  FiCopy,
  FiClock,
  FiEye,
  FiFileText,
  FiImage,
  FiLogOut,
  FiPlus,
  FiRotateCcw,
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

type ChangeHistoryEntry = {
  json: string;
  label: string;
  timestamp: string;
};

type ReorderableListKey = "home.highlights" | "about.skillset" | "about.focusAreas";

type DraggedListItem = {
  listKey: ReorderableListKey;
  index: number;
} | null;

type DraggedProjectGalleryItem = {
  projectId: string;
  index: number;
} | null;

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
  const [autoSaving, setAutoSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<"image" | "document" | null>(null);
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>(null);
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(null);
  const [draggedListItem, setDraggedListItem] = useState<DraggedListItem>(null);
  const [dragOverListItem, setDragOverListItem] = useState<DraggedListItem>(null);
  const [draggedProjectGalleryItem, setDraggedProjectGalleryItem] =
    useState<DraggedProjectGalleryItem>(null);
  const [dragOverProjectGalleryItem, setDragOverProjectGalleryItem] =
    useState<DraggedProjectGalleryItem>(null);
  const [projectGallerySelections, setProjectGallerySelections] = useState<Record<string, string>>(
    {}
  );
  const [lastSavedJson, setLastSavedJson] = useState(JSON.stringify(initialContent, null, 2));
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [autoSaveIntervalMs, setAutoSaveIntervalMs] = useState(1800);
  const [changeHistory, setChangeHistory] = useState<ChangeHistoryEntry[]>([]);
  const [redoHistory, setRedoHistory] = useState<ChangeHistoryEntry[]>([]);

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

  const hasPendingChanges = rawJson !== lastSavedJson;

  const historyPreview = useMemo(() => changeHistory.slice(-5).reverse(), [changeHistory]);

  function formatTimeStamp() {
    return new Date().toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function syncDraft(
    nextValue: SiteContent,
    options?: { recordHistory?: boolean; historyLabel?: string; clearRedo?: boolean }
  ) {
    const nextRawJson = JSON.stringify(nextValue, null, 2);

    if (options?.recordHistory && nextRawJson !== rawJson) {
      setChangeHistory((currentHistory) => [
        ...currentHistory.slice(-19),
        {
          json: rawJson,
          label: options.historyLabel ?? "Cambio visual",
          timestamp: formatTimeStamp(),
        },
      ]);

      if (options.clearRedo !== false) {
        setRedoHistory([]);
      }
    }

    setDraft(nextValue);
    setRawJson(nextRawJson);
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
    const storedInterval = globalThis.localStorage.getItem("portfolio-autosave-interval");

    if (!storedInterval) {
      return;
    }

    const parsedInterval = Number(storedInterval);

    if (!Number.isNaN(parsedInterval)) {
      setAutoSaveIntervalMs(parsedInterval);
    }
  }, []);

  useEffect(() => {
    globalThis.localStorage.setItem("portfolio-autosave-interval", String(autoSaveIntervalMs));
  }, [autoSaveIntervalMs]);

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
    syncDraft(
      {
        ...draft,
        theme: {
          ...draft.theme,
          [key]: value,
        },
      },
      { recordHistory: true, historyLabel: `Tema: ${key}` }
    );
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
      draft.projects.some(
        (project) => project.image === url || Boolean(project.gallery?.includes(url))
      )
    );
  }

  function applyProfileImage(url: string) {
    syncDraft(
      {
        ...draft,
        about: {
          ...draft.about,
          profileImage: url,
        },
      },
      { recordHistory: true, historyLabel: "About: imagen de perfil" }
    );
    setMediaStatus("Imagen aplicada como foto de perfil. Solo falta guardar los cambios.");
    pushToast("Imagen aplicada como foto de perfil.", "success");
  }

  function applyResumeFile(url: string) {
    syncDraft(
      {
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
      },
      { recordHistory: true, historyLabel: "Resume: archivo principal" }
    );
    setMediaStatus("PDF aplicado como CV principal. Solo falta guardar los cambios.");
    pushToast("PDF aplicado como CV principal.", "success");
  }

  function updateHomeField<K extends keyof SiteContent["home"]>(
    field: K,
    value: SiteContent["home"][K]
  ) {
    syncDraft(
      {
        ...draft,
        home: {
          ...draft.home,
          [field]: value,
        },
      },
      { recordHistory: true, historyLabel: `Home: ${String(field)}` }
    );
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

  function getReorderableList(listKey: ReorderableListKey) {
    if (listKey === "home.highlights") {
      return draft.home.highlights;
    }

    if (listKey === "about.skillset") {
      return draft.about.skillset;
    }

    return draft.about.focusAreas;
  }

  function setReorderableList(listKey: ReorderableListKey, nextValues: string[]) {
    if (listKey === "home.highlights") {
      updateHomeField("highlights", nextValues);
      return;
    }

    if (listKey === "about.skillset") {
      updateAboutField("skillset", nextValues);
      return;
    }

    updateAboutField("focusAreas", nextValues);
  }

  function updateReorderableItem(listKey: ReorderableListKey, index: number, value: string) {
    const nextValues = getReorderableList(listKey).map((item, itemIndex) =>
      itemIndex === index ? value : item
    );
    setReorderableList(listKey, nextValues);
  }

  function addReorderableItem(listKey: ReorderableListKey, placeholder: string) {
    setReorderableList(listKey, [...getReorderableList(listKey), placeholder]);
    pushToast("Elemento añadido al borrador.", "success");
  }

  function removeReorderableItem(listKey: ReorderableListKey, index: number) {
    setReorderableList(
      listKey,
      getReorderableList(listKey).filter((_, itemIndex) => itemIndex !== index)
    );
    pushToast("Elemento eliminado del borrador.", "success");
  }

  function reorderListItems(
    listKey: ReorderableListKey,
    sourceIndex: number,
    targetIndex: number
  ) {
    if (sourceIndex === targetIndex) {
      return;
    }

    const nextValues = [...getReorderableList(listKey)];
    const [movedItem] = nextValues.splice(sourceIndex, 1);
    nextValues.splice(targetIndex, 0, movedItem);
    setReorderableList(listKey, nextValues);
    pushToast("Orden actualizado en el borrador.", "info");
  }

  function updateAboutField<K extends keyof SiteContent["about"]>(
    field: K,
    value: SiteContent["about"][K]
  ) {
    syncDraft(
      {
        ...draft,
        about: {
          ...draft.about,
          [field]: value,
        },
      },
      { recordHistory: true, historyLabel: `About: ${String(field)}` }
    );
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

    syncDraft(
      {
        ...draft,
        projects: nextProjects,
      },
      { recordHistory: true, historyLabel: "Projects: reordenar" }
    );
    pushToast("Orden de proyectos actualizado en el borrador.", "info");
  }

  function updateProject(projectId: string, updater: (project: Project) => Project) {
    syncDraft(
      {
        ...draft,
        projects: draft.projects.map((project) =>
          project.id === projectId ? updater(project) : project
        ),
      },
      { recordHistory: true, historyLabel: `Project: ${projectId}` }
    );
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

  function appendProjectGalleryImages(projectId: string, urls: string[]) {
    const nextUrls = urls.map((item) => item.trim()).filter(Boolean);

    if (nextUrls.length === 0) {
      return;
    }

    updateProject(projectId, (project) => ({
      ...project,
      gallery: Array.from(
        new Set(
          [...(project.gallery ?? []), ...nextUrls].filter((url) => url && url !== project.image)
        )
      ),
    }));
    setMediaStatus("Imágenes añadidas a la galería del modal. Solo falta guardar los cambios.");
    pushToast("Imágenes añadidas a la galería del proyecto.", "success");
  }

  function removeProjectGalleryImage(projectId: string, imageUrl: string) {
    updateProject(projectId, (project) => ({
      ...project,
      gallery: (project.gallery ?? []).filter((item) => item !== imageUrl),
    }));
    setMediaStatus("Imagen eliminada de la galería del modal.");
    pushToast("Imagen eliminada de la galería del proyecto.", "info");
  }

  function promoteProjectGalleryImage(projectId: string, imageUrl: string) {
    updateProject(projectId, (project) => {
      const gallery = project.gallery ?? [];
      const imageIndex = gallery.indexOf(imageUrl);

      if (imageIndex === -1 || project.image === imageUrl) {
        return project;
      }

      const nextGallery = [...gallery];
      nextGallery.splice(imageIndex, 1, project.image);

      return {
        ...project,
        image: imageUrl,
        gallery: nextGallery,
      };
    });

    setMediaStatus("La portada principal del proyecto fue actualizada.");
    pushToast("La imagen seleccionada ahora es la portada del proyecto.", "success");
  }

  function reorderProjectGalleryImages(projectId: string, sourceIndex: number, targetIndex: number) {
    if (sourceIndex === targetIndex) {
      return;
    }

    updateProject(projectId, (project) => {
      const nextGallery = [...(project.gallery ?? [])];

      if (
        sourceIndex < 0 ||
        sourceIndex >= nextGallery.length ||
        targetIndex < 0 ||
        targetIndex >= nextGallery.length
      ) {
        return project;
      }

      const [movedImage] = nextGallery.splice(sourceIndex, 1);
      nextGallery.splice(targetIndex, 0, movedImage);

      return {
        ...project,
        gallery: nextGallery,
      };
    });

    setMediaStatus("Orden de la galería actualizado en el borrador.");
    pushToast("Orden de la galería actualizado.", "info");
  }

  function setProjectGallerySelection(projectId: string, value: string) {
    setProjectGallerySelections((currentSelections) => ({
      ...currentSelections,
      [projectId]: value,
    }));
  }

  function addProject() {
    const fallbackImage =
      imageLibrary[0]?.url || draft.projects[0]?.image || draft.about.profileImage;
    const timestamp = Date.now();

    syncDraft(
      {
        ...draft,
        projects: [
          ...draft.projects,
          {
            id: `project-${timestamp}`,
            title: "Nuevo proyecto",
            description: "Describe aquí el proyecto.",
            stack: ["Next.js"],
            image: fallbackImage,
            gallery: [],
            demoUrl: "",
            githubUrl: "",
            featured: false,
          },
        ],
      },
      { recordHistory: true, historyLabel: "Projects: nuevo proyecto" }
    );
    setMediaStatus("Proyecto creado. Completa sus campos y luego guarda los cambios.");
    pushToast("Proyecto creado en el editor visual.", "success");
  }

  function removeProject(projectId: string) {
    syncDraft(
      {
        ...draft,
        projects: draft.projects.filter((project) => project.id !== projectId),
      },
      { recordHistory: true, historyLabel: "Projects: eliminar proyecto" }
    );
    setMediaStatus("Proyecto eliminado del borrador. Solo falta guardar los cambios.");
    pushToast("Proyecto eliminado del borrador.", "success");
  }

  function undoLastChange() {
    const previousEntry = changeHistory[changeHistory.length - 1];

    if (!previousEntry) {
      pushToast("No hay cambios para deshacer.", "info");
      return;
    }

    try {
      const parsed = JSON.parse(previousEntry.json) as SiteContent;

      setRedoHistory((currentRedo) => [
        ...currentRedo.slice(-19),
        {
          json: rawJson,
          label: previousEntry.label,
          timestamp: formatTimeStamp(),
        },
      ]);
      setChangeHistory((currentHistory) => currentHistory.slice(0, -1));
      syncDraft(parsed, { recordHistory: false, clearRedo: false });
      pushToast(`Se deshizo: ${previousEntry.label}.`, "success");
    } catch {
      pushToast("No se pudo deshacer el último cambio.", "error");
    }
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

  async function uploadProjectGalleryImages(projectId: string, files: FileList | File[]) {
    const uploadedUrls: string[] = [];

    for (const file of Array.from(files)) {
      const item = await uploadFile(file, "image");

      if (item) {
        uploadedUrls.push(item.url);
      }
    }

    if (uploadedUrls.length > 0) {
      appendProjectGalleryImages(projectId, uploadedUrls);
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

  async function saveContent(parsed: SiteContent, mode: "manual" | "auto") {
    if (mode === "manual") {
      setSaving(true);
    } else {
      setAutoSaving(true);
    }

    setStatus(null);

    try {
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
      const nextJson = JSON.stringify(parsed, null, 2);
      setRawJson(nextJson);
      setLastSavedJson(nextJson);
      setLastSavedAt(new Date().toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }));
      setJsonError(null);
      setStatus(
        mode === "manual"
          ? "Cambios guardados correctamente."
          : "Guardado automático completado."
      );

      if (mode === "manual") {
        pushToast("Cambios guardados correctamente.", "success");
      }

      router.refresh();
    } catch {
      const errorMessage = "No fue posible guardar. Revisa el JSON y vuelve a intentar.";
      setStatus(errorMessage);
      pushToast(
        mode === "manual" ? errorMessage : "Falló el guardado automático. Revisa el contenido.",
        "error"
      );
    } finally {
      if (mode === "manual") {
        setSaving(false);
      } else {
        setAutoSaving(false);
      }
    }
  }

  async function handleSave() {
    try {
      const parsed = JSON.parse(rawJson) as SiteContent;
      await saveContent(parsed, "manual");
    } catch {
      setStatus("No fue posible guardar. Revisa el JSON y vuelve a intentar.");
      pushToast("No fue posible guardar. Revisa el JSON y vuelve a intentar.", "error");
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

  useEffect(() => {
    if (autoSaveIntervalMs === 0 || !hasPendingChanges || jsonError || saving || autoSaving) {
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      try {
        const parsed = JSON.parse(rawJson) as SiteContent;
        void saveContent(parsed, "auto");
      } catch {
        setStatus("El guardado automático se pausó hasta que el JSON vuelva a ser válido.");
      }
    }, autoSaveIntervalMs);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [autoSaveIntervalMs, autoSaving, hasPendingChanges, jsonError, rawJson, saving]);

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

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Autosave activo</p>
                <p className="text-xs text-slate-400">
                  {jsonError
                    ? "Pausado por JSON inválido."
                    : autoSaveIntervalMs === 0
                      ? "Desactivado manualmente."
                    : hasPendingChanges
                      ? autoSaving
                        ? "Guardando cambios automáticamente..."
                        : `Cambios pendientes. Se guardarán automáticamente en ${(
                            autoSaveIntervalMs / 1000
                          ).toFixed(autoSaveIntervalMs % 1000 === 0 ? 0 : 1)}s.`
                      : lastSavedAt
                        ? `Todo sincronizado. Último guardado a las ${lastSavedAt}.`
                        : "Sin cambios pendientes."}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-xs text-slate-300">
                  <FiClock />
                  <span>Intervalo</span>
                  <select
                    value={String(autoSaveIntervalMs)}
                    onChange={(event) => setAutoSaveIntervalMs(Number(event.target.value))}
                    className="rounded-xl border border-white/10 bg-slate-950/80 px-2 py-1 text-xs text-white outline-none"
                  >
                    <option value="0">Off</option>
                    <option value="1500">1.5s</option>
                    <option value="3000">3s</option>
                    <option value="5000">5s</option>
                    <option value="10000">10s</option>
                  </select>
                </label>

                <button
                  type="button"
                  onClick={undoLastChange}
                  disabled={changeHistory.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiRotateCcw />
                  Undo
                </button>

                <div
                  className={`inline-flex items-center rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                    jsonError
                      ? "bg-rose-500/15 text-rose-100"
                      : autoSaveIntervalMs === 0
                        ? "bg-slate-500/20 text-slate-200"
                        : hasPendingChanges
                          ? "bg-amber-500/15 text-amber-100"
                          : "bg-emerald-500/15 text-emerald-100"
                  }`}
                >
                  {jsonError
                    ? "Pausado"
                    : autoSaveIntervalMs === 0
                      ? "Manual"
                      : hasPendingChanges
                        ? autoSaving
                          ? "Guardando"
                          : "Pendiente"
                        : "Sincronizado"}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Historial simple</p>
                  <p className="text-xs text-slate-400">
                    Últimos cambios visuales. Pendientes por deshacer: {changeHistory.length}. Rehacer guardado: {redoHistory.length}.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {historyPreview.length === 0 ? (
                  <p className="text-xs text-slate-500">Aún no hay cambios en el historial visual.</p>
                ) : (
                  historyPreview.map((entry, index) => (
                    <div
                      key={`${entry.timestamp}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
                    >
                      <span className="text-sm text-slate-200">{entry.label}</span>
                      <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        {entry.timestamp}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="grid gap-8 xl:grid-cols-2">
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

          <div className="glass-panel border border-white/10 p-6">
            <section className="space-y-5">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-white">Editor visual de home</h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Ajusta el hero principal, CTAs, highlights y métricas sin editar JSON.
                    </p>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[var(--color-surface)] to-slate-950/80 p-5 shadow-glow">
                    <div className="flex items-center justify-between gap-3">
                      <p className="section-label">Preview en vivo</p>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-400">
                        Home
                      </span>
                    </div>
                    <p className="mt-4 text-sm uppercase tracking-[0.28em] text-[var(--color-accentSoft)]">
                      {draft.home.eyebrow}
                    </p>
                    <h3 className="mt-4 font-display text-3xl font-semibold leading-tight text-white">
                      {draft.home.title}
                    </h3>
                    <p className="mt-4 text-base leading-7 text-slate-300">{draft.home.subtitle}</p>
                    <p className="mt-4 text-sm leading-7 text-slate-400">{draft.home.description}</p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <span className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white">
                        {draft.home.primaryCta.label}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">
                        {draft.home.secondaryCta.label}
                      </span>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      {draft.home.metrics.map((metric, index) => (
                        <div key={`${metric.label}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{metric.label}</p>
                          <p className="mt-2 text-sm font-semibold text-white">{metric.value}</p>
                        </div>
                      ))}
                    </div>
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

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">Highlights</p>
                          <p className="text-xs text-slate-400">Arrastra para reordenar.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => addReorderableItem("home.highlights", "Nuevo highlight")}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                        >
                          <FiPlus />
                          Añadir
                        </button>
                      </div>

                      <div className="space-y-3">
                        {draft.home.highlights.map((highlight, index) => (
                          <div
                            key={`${highlight}-${index}`}
                            onDragOver={(event) => {
                              event.preventDefault();
                              setDragOverListItem({ listKey: "home.highlights", index });
                            }}
                            onDrop={() => {
                              if (draggedListItem?.listKey === "home.highlights") {
                                reorderListItems("home.highlights", draggedListItem.index, index);
                              }
                              setDraggedListItem(null);
                              setDragOverListItem(null);
                            }}
                            className={`rounded-2xl border p-3 ${
                              dragOverListItem?.listKey === "home.highlights" && dragOverListItem.index === index
                                ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
                                : "border-white/10 bg-slate-950/40"
                            }`}
                          >
                            <div
                              draggable
                              onDragStart={() => setDraggedListItem({ listKey: "home.highlights", index })}
                              onDragEnd={() => {
                                setDraggedListItem(null);
                                setDragOverListItem(null);
                              }}
                              className="grid cursor-grab gap-3 md:grid-cols-[auto_1fr_auto]"
                            >
                              <div className="flex items-center rounded-xl border border-dashed border-white/10 px-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                                drag
                              </div>
                              <input
                                type="text"
                                value={highlight}
                                onChange={(event) =>
                                  updateReorderableItem("home.highlights", index, event.target.value)
                                }
                                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => removeReorderableItem("home.highlights", index)}
                                className="inline-flex items-center justify-center rounded-2xl border border-rose-400/30 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/10"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
          </div>

          <div className="glass-panel border border-white/10 p-6">
            <section className="space-y-5">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-white">Editor visual de about</h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Controla el perfil, resumen, stack y áreas de enfoque desde el panel.
                    </p>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[var(--color-surface)] to-slate-950/80 p-5 shadow-glow">
                    <div className="flex items-center justify-between gap-3">
                      <p className="section-label">Preview en vivo</p>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-400">
                        About
                      </span>
                    </div>
                    <div className="mt-5 flex gap-4">
                      <img
                        src={draft.about.profileImage}
                        alt="Preview perfil"
                        className="h-20 w-20 rounded-2xl border border-white/10 object-cover"
                      />
                      <div>
                        <h3 className="font-display text-2xl font-semibold leading-tight text-white">
                          {draft.about.headline}
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-slate-300">
                          {draft.about.summary[0] ?? "Añade un resumen para verlo aquí."}
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {draft.about.skillset.slice(0, 8).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
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
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">Skillset</p>
                            <p className="text-xs text-slate-400">Arrastra para reordenar.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => addReorderableItem("about.skillset", "Nueva skill")}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                          >
                            <FiPlus />
                            Añadir
                          </button>
                        </div>

                        <div className="space-y-3">
                          {draft.about.skillset.map((skill, index) => (
                            <div
                              key={`${skill}-${index}`}
                              onDragOver={(event) => {
                                event.preventDefault();
                                setDragOverListItem({ listKey: "about.skillset", index });
                              }}
                              onDrop={() => {
                                if (draggedListItem?.listKey === "about.skillset") {
                                  reorderListItems("about.skillset", draggedListItem.index, index);
                                }
                                setDraggedListItem(null);
                                setDragOverListItem(null);
                              }}
                              className={`rounded-2xl border p-3 ${
                                dragOverListItem?.listKey === "about.skillset" && dragOverListItem.index === index
                                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
                                  : "border-white/10 bg-slate-950/40"
                              }`}
                            >
                              <div
                                draggable
                                onDragStart={() => setDraggedListItem({ listKey: "about.skillset", index })}
                                onDragEnd={() => {
                                  setDraggedListItem(null);
                                  setDragOverListItem(null);
                                }}
                                className="grid cursor-grab gap-3 md:grid-cols-[auto_1fr_auto]"
                              >
                                <div className="flex items-center rounded-xl border border-dashed border-white/10 px-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                                  drag
                                </div>
                                <input
                                  type="text"
                                  value={skill}
                                  onChange={(event) =>
                                    updateReorderableItem("about.skillset", index, event.target.value)
                                  }
                                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeReorderableItem("about.skillset", index)}
                                  className="inline-flex items-center justify-center rounded-2xl border border-rose-400/30 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/10"
                                >
                                  <FiTrash2 />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

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

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">Focus areas</p>
                          <p className="text-xs text-slate-400">Arrastra para reordenar.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => addReorderableItem("about.focusAreas", "Nueva área de enfoque")}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                        >
                          <FiPlus />
                          Añadir
                        </button>
                      </div>

                      <div className="space-y-3">
                        {draft.about.focusAreas.map((focusArea, index) => (
                          <div
                            key={`${focusArea}-${index}`}
                            onDragOver={(event) => {
                              event.preventDefault();
                              setDragOverListItem({ listKey: "about.focusAreas", index });
                            }}
                            onDrop={() => {
                              if (draggedListItem?.listKey === "about.focusAreas") {
                                reorderListItems("about.focusAreas", draggedListItem.index, index);
                              }
                              setDraggedListItem(null);
                              setDragOverListItem(null);
                            }}
                            className={`rounded-2xl border p-3 ${
                              dragOverListItem?.listKey === "about.focusAreas" && dragOverListItem.index === index
                                ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
                                : "border-white/10 bg-slate-950/40"
                            }`}
                          >
                            <div
                              draggable
                              onDragStart={() => setDraggedListItem({ listKey: "about.focusAreas", index })}
                              onDragEnd={() => {
                                setDraggedListItem(null);
                                setDragOverListItem(null);
                              }}
                              className="grid cursor-grab gap-3 md:grid-cols-[auto_1fr_auto]"
                            >
                              <div className="flex items-center rounded-xl border border-dashed border-white/10 px-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                                drag
                              </div>
                              <input
                                type="text"
                                value={focusArea}
                                onChange={(event) =>
                                  updateReorderableItem("about.focusAreas", index, event.target.value)
                                }
                                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => removeReorderableItem("about.focusAreas", index)}
                                className="inline-flex items-center justify-center rounded-2xl border border-rose-400/30 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/10"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
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

              <div className="mt-6 rounded-[28px] border border-white/10 bg-gradient-to-br from-[var(--color-surface)] to-slate-950/80 p-5 shadow-glow">
                <div className="flex items-center justify-between gap-3">
                  <p className="section-label">Preview en vivo</p>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-400">
                    Projects
                  </span>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {draft.projects.map((project) => (
                    <article
                      key={`preview-${project.id}`}
                      className="overflow-hidden rounded-[24px] border border-white/10 bg-white/5"
                    >
                      <img
                        src={project.image}
                        alt={project.title}
                        className="aspect-[16/10] h-auto w-full object-cover"
                      />
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-base font-semibold text-white">{project.title}</h3>
                          {project.featured && (
                            <span className="rounded-full bg-[var(--color-accent)]/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accentSoft)]">
                              Featured
                            </span>
                          )}
                        </div>
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">
                          {project.description}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {project.stack.slice(0, 4).map((item) => (
                            <span
                              key={`${project.id}-${item}`}
                              className="rounded-full border border-white/10 bg-slate-950/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="mt-6 space-y-6">
                {draft.projects.map((project) => {
                  const galleryImages = project.gallery ?? [];
                  const gallerySelection = projectGallerySelections[project.id] ?? "";
                  const availableGalleryImages = imageLibrary.filter(
                    (item) => item.url !== project.image && !galleryImages.includes(item.url)
                  );

                  return (
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

                      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
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

                        <div className="xl:col-span-2 rounded-[28px] border border-white/10 bg-slate-950/35 p-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                                Galería del modal
                              </p>
                              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                                Añade imágenes extra para el slider. La portada actual se mantiene como la primera imagen y puedes reordenar el resto visualmente.
                              </p>
                            </div>
                            <span className="inline-flex w-fit rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                              {galleryImages.length} extra
                            </span>
                          </div>

                          <div className="mt-5 grid gap-4 lg:grid-cols-2">
                            <label className="block rounded-2xl border border-white/10 bg-white/5 p-4">
                              <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                                <FiUploadCloud />
                                Subir varias imágenes
                              </span>
                              <p className="mb-4 text-xs leading-6 text-slate-400">
                                Puedes subir varias capturas al mismo tiempo para este proyecto.
                              </p>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                disabled={uploadingKind !== null}
                                onChange={(event) => {
                                  const nextFiles = event.target.files;

                                  if (nextFiles && nextFiles.length > 0) {
                                    void uploadProjectGalleryImages(project.id, nextFiles);
                                    event.target.value = "";
                                  }
                                }}
                                className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-[var(--color-accent)] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:opacity-90"
                              />
                            </label>

                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                                Añadir imagen existente
                              </label>
                              <p className="mb-4 text-xs leading-6 text-slate-400">
                                Reutiliza imágenes de la librería local sin volver a subirlas.
                              </p>
                              <div className="flex flex-col gap-3 sm:flex-row">
                                <select
                                  value={gallerySelection}
                                  onChange={(event) =>
                                    setProjectGallerySelection(project.id, event.target.value)
                                  }
                                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-3 text-sm text-white outline-none"
                                >
                                  <option value="">Selecciona una imagen</option>
                                  {availableGalleryImages.map((item) => (
                                    <option key={item.id} value={item.url}>
                                      {item.name}
                                    </option>
                                  ))}
                                </select>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!gallerySelection) {
                                      return;
                                    }

                                    appendProjectGalleryImages(project.id, [gallerySelection]);
                                    setProjectGallerySelection(project.id, "");
                                  }}
                                  disabled={!gallerySelection}
                                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <FiPlus />
                                  Añadir
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="mt-5 space-y-3">
                            {galleryImages.length === 0 ? (
                              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 px-4 py-5 text-sm leading-7 text-slate-400">
                                Este proyecto aún no tiene imágenes adicionales para el modal.
                              </div>
                            ) : (
                              <div className="grid gap-3 xl:grid-cols-2">
                                {galleryImages.map((imageUrl, index) => (
                                  <div
                                    key={`${project.id}-gallery-${imageUrl}-${index}`}
                                    onDragOver={(event) => {
                                      event.preventDefault();
                                      setDragOverProjectGalleryItem({ projectId: project.id, index });
                                    }}
                                    onDrop={() => {
                                      if (draggedProjectGalleryItem?.projectId === project.id) {
                                        reorderProjectGalleryImages(
                                          project.id,
                                          draggedProjectGalleryItem.index,
                                          index
                                        );
                                      }
                                      setDraggedProjectGalleryItem(null);
                                      setDragOverProjectGalleryItem(null);
                                    }}
                                    className={`rounded-2xl border p-3 transition ${
                                      dragOverProjectGalleryItem?.projectId === project.id &&
                                      dragOverProjectGalleryItem.index === index
                                        ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
                                        : "border-white/10 bg-slate-950/30"
                                    }`}
                                  >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                      <div
                                        draggable
                                        onDragStart={() =>
                                          setDraggedProjectGalleryItem({ projectId: project.id, index })
                                        }
                                        onDragEnd={() => {
                                          setDraggedProjectGalleryItem(null);
                                          setDragOverProjectGalleryItem(null);
                                        }}
                                        className="flex cursor-grab items-center justify-center rounded-xl border border-dashed border-white/10 px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 active:cursor-grabbing sm:min-w-[64px]"
                                      >
                                        drag
                                      </div>

                                      <img
                                        src={imageUrl}
                                        alt={`${project.title} gallery ${index + 1}`}
                                        className="h-20 w-full rounded-xl border border-white/10 object-cover sm:w-28"
                                      />

                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                          Imagen {index + 2} del modal
                                        </p>
                                        <p className="mt-1 truncate text-sm text-slate-200">{imageUrl}</p>
                                      </div>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        onClick={() => promoteProjectGalleryImage(project.id, imageUrl)}
                                        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                                      >
                                        Usar portada
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => removeProjectGalleryImage(project.id, imageUrl)}
                                        className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/10"
                                      >
                                        <FiTrash2 />
                                        Quitar
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                  disabled={saving || autoSaving || Boolean(jsonError)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiSave />
                  {saving ? "Guardando..." : autoSaving ? "Autosaving..." : "Guardar cambios"}
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
