import type { SiteContent } from "@/types/site";

export const LANGUAGE_COOKIE_NAME = "portfolio_language";
export type SiteLanguage = "en" | "es";

export function parseLanguage(value?: string | null): SiteLanguage {
  return value === "es" ? "es" : "en";
}

export function localizeSiteContent(content: SiteContent, language: SiteLanguage): SiteContent {
  if (language === "en") return content;

  const translations = content.translations?.es ?? {};
  const translated = (key: string, fallback: string) => translations[key]?.trim() || fallback;

  return {
    ...content,
    site: {
      ...content.site,
      name: translated("site.name", content.site.name),
      role: translated("site.role", content.site.role),
      location: translated("site.location", content.site.location),
    },
    contact: {
      ...content.contact,
      location: translated("contact.location", content.contact.location),
    },
    home: {
      ...content.home,
      eyebrow: translated("home.eyebrow", content.home.eyebrow),
      title: translated("home.title", content.home.title),
      subtitle: translated("home.subtitle", content.home.subtitle),
      description: translated("home.description", content.home.description),
      availability: translated("home.availability", content.home.availability),
      location: translated("home.location", content.home.location),
      primaryCta: {
        ...content.home.primaryCta,
        label: translated("home.primaryCta.label", content.home.primaryCta.label),
      },
      secondaryCta: {
        ...content.home.secondaryCta,
        label: translated("home.secondaryCta.label", content.home.secondaryCta.label),
      },
      metrics: content.home.metrics.map((metric, index) => ({
        label: translated(`home.metrics.${index}.label`, metric.label),
        value: translated(`home.metrics.${index}.value`, metric.value),
      })),
      highlights: content.home.highlights.map((item, index) =>
        translated(`home.highlights.${index}`, item)
      ),
    },
    about: {
      ...content.about,
      headline: translated("about.headline", content.about.headline),
      summary: content.about.summary.map((item, index) => translated(`about.summary.${index}`, item)),
      skillset: content.about.skillset.map((item, index) => translated(`about.skillset.${index}`, item)),
      toolset: content.about.toolset.map((item, index) => translated(`about.toolset.${index}`, item)),
      focusAreas: content.about.focusAreas.map((item, index) => translated(`about.focusAreas.${index}`, item)),
    },
    workExperience: content.workExperience.map((entry) => ({
      ...entry,
      title: translated(`workExperience.${entry.id}.title`, entry.title),
      organization: translated(`workExperience.${entry.id}.organization`, entry.organization),
      location: translated(`workExperience.${entry.id}.location`, entry.location),
      startDate: translated(`workExperience.${entry.id}.startDate`, entry.startDate),
      endDate: translated(`workExperience.${entry.id}.endDate`, entry.endDate),
      description: translated(`workExperience.${entry.id}.description`, entry.description),
      references: entry.references.map((reference, index) => ({
        ...reference,
        label: translated(`workExperience.${entry.id}.references.${index}.label`, reference.label),
      })),
    })),
    education: content.education.map((entry) => ({
      ...entry,
      title: translated(`education.${entry.id}.title`, entry.title),
      organization: translated(`education.${entry.id}.organization`, entry.organization),
      location: translated(`education.${entry.id}.location`, entry.location),
      startDate: translated(`education.${entry.id}.startDate`, entry.startDate),
      endDate: translated(`education.${entry.id}.endDate`, entry.endDate),
      description: translated(`education.${entry.id}.description`, entry.description),
      references: entry.references.map((reference, index) => ({
        ...reference,
        label: translated(`education.${entry.id}.references.${index}.label`, reference.label),
      })),
    })),
    projects: content.projects.map((project) => ({
      ...project,
      title: translated(`projects.${project.id}.title`, project.title),
      description: translated(`projects.${project.id}.description`, project.description),
      stack: project.stack.map((item, index) => translated(`projects.${project.id}.stack.${index}`, item)),
    })),
    certifications: content.certifications.map((certification) => ({
      ...certification,
      title: translated(`certifications.${certification.id}.title`, certification.title),
      issuer: translated(`certifications.${certification.id}.issuer`, certification.issuer),
      issuedAt: translated(
        `certifications.${certification.id}.issuedAt`,
        certification.issuedAt ?? ""
      ),
      description: translated(
        `certifications.${certification.id}.description`,
        certification.description
      ),
    })),
    socials: content.socials.map((social, index) => ({
      ...social,
      label: translated(`socials.${index}.label`, social.label),
    })),
    resume: {
      ...content.resume,
      title: translated("resume.title", content.resume.title),
      description: translated("resume.description", content.resume.description),
      previewTitle: translated("resume.previewTitle", content.resume.previewTitle),
      previewText: translated("resume.previewText", content.resume.previewText),
      openLabel: translated("resume.openLabel", content.resume.openLabel),
      downloadLabel: translated("resume.downloadLabel", content.resume.downloadLabel),
    },
  };
}

export const interfaceCopy = {
  en: {
    about: "About",
    focusAreas: "Focus areas",
    techStack: "Tech stack",
    tools: "Tools",
    experience: "Work experience",
    experienceTitle: "Experience building and supporting real products.",
    education: "Professional education",
    educationTitle: "Continuous learning and formal preparation.",
    references: "References",
    present: "Present",
    projects: "Projects",
    projectsTitle: "Real products, useful systems, and end-to-end execution.",
    featuredProject: "Featured project",
    openProject: "Open project preview",
    share: "Share",
    shareProject: "Share project",
    linkCopied: "Link copied to clipboard.",
    copyProjectLink: "Copy this project link",
    copyFromDialog: "Copy the link from the dialog.",
    copyFailed: "Could not copy the project link.",
    close: "Close",
    projectDetails: "Project details",
    stackUsed: "Stack used",
    liveDemo: "Live demo",
    sourceCode: "Source code",
    previousImage: "Previous image",
    nextImage: "Next image",
    image: "Image",
    of: "of",
    projectPreview: "Project preview",
    openImage: "Open image",
    resume: "Resume",
    resumeRenderError: "The PDF could not be rendered here. You can open or download it using the buttons.",
    certifications: "Certifications",
    skillsCertifications: "Skills & Certifications",
    emptyCertifications: "Verifiable certifications will appear here.",
    previousCertification: "Previous certification",
    nextCertification: "Next certification",
    show: "Show",
    certificate: "Certificate",
    issued: "Issued",
    credentialId: "Credential ID",
    verifyCredential: "Verify credential",
    organizationLinkedIn: "Organization on LinkedIn",
    missingCertificate: "No PDF or reference image has been added.",
    builtWith: "Built with Next.js, TypeScript and Tailwind CSS.",
  },
  es: {
    about: "Sobre mí",
    focusAreas: "Áreas de enfoque",
    techStack: "Stack tecnológico",
    tools: "Herramientas",
    experience: "Experiencia laboral",
    experienceTitle: "Experiencia creando y manteniendo productos reales.",
    education: "Educación profesional",
    educationTitle: "Aprendizaje continuo y preparación formal.",
    references: "Referencias",
    present: "Actualidad",
    projects: "Proyectos",
    projectsTitle: "Productos reales, sistemas útiles y ejecución de principio a fin.",
    featuredProject: "Proyecto destacado",
    openProject: "Abrir vista del proyecto",
    share: "Compartir",
    shareProject: "Compartir proyecto",
    linkCopied: "Enlace copiado al portapapeles.",
    copyProjectLink: "Copia este enlace del proyecto",
    copyFromDialog: "Copia el enlace desde el diálogo.",
    copyFailed: "No se pudo copiar el enlace del proyecto.",
    close: "Cerrar",
    projectDetails: "Detalles del proyecto",
    stackUsed: "Stack utilizado",
    liveDemo: "Demo en vivo",
    sourceCode: "Código fuente",
    previousImage: "Imagen anterior",
    nextImage: "Imagen siguiente",
    image: "Imagen",
    of: "de",
    projectPreview: "Vista del proyecto",
    openImage: "Abrir imagen",
    resume: "Currículum",
    resumeRenderError: "No se pudo mostrar el PDF aquí. Puedes abrirlo o descargarlo desde los botones.",
    certifications: "Certificaciones",
    skillsCertifications: "Habilidades y certificaciones",
    emptyCertifications: "Las certificaciones verificables aparecerán aquí.",
    previousCertification: "Certificación anterior",
    nextCertification: "Certificación siguiente",
    show: "Mostrar",
    certificate: "Certificado",
    issued: "Emitido",
    credentialId: "ID de credencial",
    verifyCredential: "Verificar credencial",
    organizationLinkedIn: "Organización en LinkedIn",
    missingCertificate: "No se ha añadido un PDF o imagen de referencia.",
    builtWith: "Creado con Next.js, TypeScript y Tailwind CSS.",
  },
} as const;
