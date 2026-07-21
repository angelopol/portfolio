export type ThemeConfig = {
  accent: string;
  accentSoft: string;
  background: string;
  surface: string;
  card: string;
  text: string;
  muted: string;
  ring: string;
};

export type CtaLink = {
  label: string;
  href: string;
};

export type Metric = {
  label: string;
  value: string;
};

export type HomeContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  availability: string;
  location: string;
  primaryCta: CtaLink;
  secondaryCta: CtaLink;
  metrics: Metric[];
  highlights: string[];
};

export type AboutContent = {
  headline: string;
  summary: string[];
  skillset: string[];
  toolset: string[];
  focusAreas: string[];
  profileImage: string;
};

export type Project = {
  id: string;
  title: string;
  description: string;
  stack: string[];
  image: string;
  gallery?: string[];
  demoUrl?: string;
  githubUrl?: string;
  featured?: boolean;
};

export type SocialLink = {
  label: string;
  href: string;
};

export type Certification = {
  id: string;
  title: string;
  issuer: string;
  issuedAt?: string;
  credentialId?: string;
  description: string;
  certificateUrl: string;
  verificationUrl: string;
  organizationUrl: string;
  logoUrl?: string;
};

export type MediaKind = "image" | "document";

export type MediaItem = {
  id: string;
  kind: MediaKind;
  name: string;
  url: string;
  storageKey?: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
};

export type MediaLibrary = {
  items: MediaItem[];
};

export type ResumeContent = {
  fullName: string;
  title: string;
  description: string;
  previewTitle: string;
  previewText: string;
  downloadUrl: string;
  openLabel: string;
  downloadLabel: string;
  softSkills: string[];
  languages: string[];
};

export type SiteIdentity = {
  name: string;
  initials: string;
  role: string;
  email: string;
  location: string;
};

export type ContactInfo = {
  location: string;
  phone: string;
  email: string;
  githubUrl: string;
  linkedinUrl: string;
  portfolioUrl: string;
};

export type ReferenceLink = {
  label: string;
  url: string;
};

export type CareerEntry = {
  id: string;
  title: string;
  organization: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  references: ReferenceLink[];
};

export type SiteContent = {
  site: SiteIdentity;
  contact: ContactInfo;
  theme: ThemeConfig;
  home: HomeContent;
  about: AboutContent;
  workExperience: CareerEntry[];
  education: CareerEntry[];
  certifications: Certification[];
  projects: Project[];
  socials: SocialLink[];
  resume: ResumeContent;
  translations: {
    es: Record<string, string>;
  };
};
