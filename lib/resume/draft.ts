import "server-only";

import type {
  GeneratedResume,
  GeneratedResumeEducation,
  GeneratedResumeExperience,
  GeneratedResumeLink,
  ResumeLanguage,
} from "@/types/resume";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function texts(value: unknown, limit: number, maxLength: number) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => text(item, maxLength)).filter(Boolean).slice(0, limit);
}

function url(value: unknown) {
  const candidate = text(value, 2048);
  if (!candidate) return "";
  try {
    const parsed = new URL(/^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : "";
  } catch {
    return "";
  }
}

function links(value: unknown): GeneratedResumeLink[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 4).map((item) => {
    const source = record(item);
    return { label: text(source.label, 120), url: url(source.url) };
  }).filter((item) => item.url);
}

function experiences(value: unknown): GeneratedResumeExperience[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 8).map((item) => {
    const source = record(item);
    return {
      title: text(source.title, 180),
      organization: text(source.organization, 180),
      location: text(source.location, 180),
      startDate: text(source.startDate, 100),
      endDate: text(source.endDate, 100),
      summary: text(source.summary, 1800),
      highlights: texts(source.highlights, 8, 300),
      links: links(source.links),
    };
  }).filter((item) => item.title || item.organization);
}

function education(value: unknown): GeneratedResumeEducation[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 6).map((item) => {
    const source = record(item);
    return {
      title: text(source.title, 180),
      institution: text(source.institution, 180),
      location: text(source.location, 180),
      startDate: text(source.startDate, 100),
      endDate: text(source.endDate, 100),
      description: text(source.description, 800),
      links: links(source.links),
    };
  }).filter((item) => item.title || item.institution);
}

export function sanitizeGeneratedResumeDraft(
  value: unknown,
  fallbackLanguage: ResumeLanguage,
): GeneratedResume {
  const source = record(value);
  const contact = record(source.contact);
  const skills = record(source.skills);
  const certifications = Array.isArray(skills.certifications)
    ? skills.certifications.slice(0, 50).map((item) => {
        const certification = record(item);
        return {
          title: text(certification.title, 220),
          issuer: text(certification.issuer, 180),
          issuedAt: text(certification.issuedAt, 100),
          verificationUrl: url(certification.verificationUrl),
        };
      }).filter((item) => item.title)
    : [];

  return {
    language: source.language === "es" ? "es" : fallbackLanguage,
    fullName: text(source.fullName, 140),
    professionalTitle: text(source.professionalTitle, 180),
    summary: text(source.summary, 1400),
    contact: {
      location: text(contact.location, 180),
      phone: text(contact.phone, 80),
      email: text(contact.email, 240),
      portfolioUrl: url(contact.portfolioUrl),
      linkedinUrl: url(contact.linkedinUrl),
      githubUrl: url(contact.githubUrl),
    },
    experience: experiences(source.experience),
    education: education(source.education),
    skills: {
      technical: texts(skills.technical, 60, 100),
      certifications,
      soft: texts(skills.soft, 30, 100),
      languages: texts(skills.languages, 20, 100),
    },
  };
}
