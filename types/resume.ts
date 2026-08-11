export type ResumeLanguage = "en" | "es";

export type ResumeLayout = "ats" | "visual";

export type ResumeExperienceDetail = "concise" | "explanatory" | "detailed";

export type ResumeSections = {
  summary: boolean;
  experience: boolean;
  education: boolean;
  certifications: boolean;
  skills: boolean;
};

export const DEFAULT_RESUME_SECTIONS: ResumeSections = {
  summary: true,
  experience: true,
  education: true,
  certifications: true,
  skills: true,
};

export type GeneratedResumeLink = {
  label: string;
  url: string;
};

export type GeneratedResumeExperience = {
  title: string;
  organization: string;
  location: string;
  startDate: string;
  endDate: string;
  summary: string;
  highlights: string[];
  links: GeneratedResumeLink[];
};

export type GeneratedResumeEducation = {
  title: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  links: GeneratedResumeLink[];
};

export type GeneratedResumeCertification = {
  title: string;
  issuer: string;
  issuedAt: string;
  verificationUrl: string;
};

export type GeneratedResume = {
  language: ResumeLanguage;
  fullName: string;
  professionalTitle: string;
  summary: string;
  contact: {
    location: string;
    phone: string;
    email: string;
    portfolioUrl: string;
    linkedinUrl: string;
    githubUrl: string;
  };
  experience: GeneratedResumeExperience[];
  education: GeneratedResumeEducation[];
  skills: {
    technical: string[];
    certifications: GeneratedResumeCertification[];
    soft: string[];
    languages: string[];
  };
};

export type ResumeGenerationRequest = {
  language: ResumeLanguage;
  layout?: ResumeLayout;
  experienceDetail?: ResumeExperienceDetail;
  experienceIds?: string[];
  certificationLimit?: number;
  sections?: Partial<ResumeSections>;
  compactSpacing?: boolean;
  profileImageUrl?: string;
  targetRole?: string;
  jobDescription?: string;
  additionalInstructions?: string;
};
