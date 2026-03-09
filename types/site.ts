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
  demoUrl?: string;
  githubUrl?: string;
  featured?: boolean;
};

export type SocialLink = {
  label: string;
  href: string;
};

export type MediaKind = "image" | "document";

export type MediaItem = {
  id: string;
  kind: MediaKind;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
};

export type MediaLibrary = {
  items: MediaItem[];
};

export type ResumeContent = {
  title: string;
  description: string;
  previewTitle: string;
  previewText: string;
  downloadUrl: string;
  openLabel: string;
  downloadLabel: string;
};

export type SiteIdentity = {
  name: string;
  initials: string;
  role: string;
  email: string;
  location: string;
};

export type SiteContent = {
  site: SiteIdentity;
  theme: ThemeConfig;
  home: HomeContent;
  about: AboutContent;
  projects: Project[];
  socials: SocialLink[];
  resume: ResumeContent;
};
