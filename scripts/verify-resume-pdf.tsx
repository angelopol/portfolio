import { renderResumePdf } from "../lib/resume/pdf";
import type { GeneratedResume, ResumeLayout } from "../types/resume";

const resume: GeneratedResume = {
  language: "en",
  fullName: "Resume Parser Fixture",
  professionalTitle: "Backend and Full-Stack Developer",
  summary:
    "Backend and full-stack developer with experience delivering web platforms, cloud services, API integrations, databases, automation, and software for embedded computers. Focused on maintainable architecture, reliable delivery, and collaboration with multidisciplinary teams.",
  contact: {
    location: "Valencia, Venezuela",
    phone: "+58 412 000 0000",
    email: "resume.fixture@example.com",
    portfolioUrl: "https://example.com",
    linkedinUrl: "https://linkedin.com/in/resume-fixture",
    githubUrl: "https://github.com/resume-fixture",
  },
  experience: Array.from({ length: 5 }, (_, index) => ({
    title: index === 0 ? "Senior Full-Stack Developer" : "Software Developer",
    organization: `Verified Company ${index + 1} LLC`,
    location: index === 3 ? "Barcelona, Spain" : "Valencia, Venezuela",
    startDate: `January 202${index}`,
    endDate: index === 0 ? "Present" : `December 202${index}`,
    summary:
      "Built and supported production software using documented portfolio facts, with an emphasis on backend services, integrations, operations, and clear technical ownership.",
    highlights: [
      "Designed maintainable APIs and service boundaries for production workflows.",
      "Integrated cloud infrastructure, databases, and real-time communication services.",
      "Collaborated with product stakeholders to ship reliable, measurable improvements.",
    ],
    links: [{ label: "Project reference", url: `https://example.com/reference-${index + 1}` }],
  })),
  education: [
    {
      title: "Computer Engineering",
      institution: "Verified Technical University",
      location: "Valencia, Venezuela",
      startDate: "October 2022",
      endDate: "June 2026",
      description: "Formal education in software engineering, systems, databases, networks, and computer architecture.",
      links: [],
    },
    {
      title: "Professional Software Program",
      institution: "Verified Learning Institute",
      location: "Online",
      startDate: "January 2021",
      endDate: "December 2021",
      description: "Applied software development program with practical projects.",
      links: [],
    },
  ],
  skills: {
    technical: [
      "TypeScript", "JavaScript", "React", "Next.js", "Node.js", "PHP", "Laravel", "Python",
      "SQL", "PostgreSQL", "MySQL", "AWS", "Docker", "Linux", "Git", "REST APIs",
      "WebSockets", "OpenCV", "Arduino", "ESP32", "Nginx", "Tailwind CSS",
    ],
    certifications: Array.from({ length: 6 }, (_, index) => ({
      title: `Verified Technical Certificate ${index + 1}`,
      issuer: "Verified Certification Provider",
      issuedAt: `202${index}`,
      verificationUrl: `https://example.com/certificate-${index + 1}`,
    })),
    soft: ["Teamwork", "Leadership", "Problem solving", "Effective communication", "Adaptability", "Proactivity"],
    languages: ["Spanish - Native", "English - Professional working proficiency"],
  },
};

async function verify(layout: ResumeLayout) {
  const rendered = await renderResumePdf(resume, "/assets/profile.jpeg", layout);
  return {
    layout,
    pages: rendered.validation.pages,
    bytes: rendered.validation.fileSizeBytes,
    textCharacters: rendered.validation.textCharacters,
    checks: rendered.validation.checks,
    compactionLevel: rendered.compactionLevel,
    imageIncluded: rendered.imageIncluded,
    certificationsIncluded: rendered.certificationsIncluded,
  };
}

async function verifyAdaptiveCertifications() {
  const adaptiveResume: GeneratedResume = {
    ...resume,
    skills: {
      ...resume.skills,
      certifications: Array.from({ length: 80 }, (_, index) => ({
        title: `Adaptive Technical Certificate ${index + 1}`,
        issuer: "Verified Certification Provider",
        issuedAt: `${2001 + index}`,
        verificationUrl: `https://example.com/adaptive-certificate-${index + 1}`,
      })),
    },
  };
  const rendered = await renderResumePdf(adaptiveResume, "/assets/profile.jpeg", "ats");
  return {
    layout: "ats-adaptive-certifications",
    pages: rendered.validation.pages,
    certificationsAvailable: adaptiveResume.skills.certifications.length,
    certificationsIncluded: rendered.certificationsIncluded,
    compactionLevel: rendered.compactionLevel,
  };
}

async function verifySinglePagePreference() {
  const singlePageResume: GeneratedResume = {
    ...resume,
    experience: resume.experience.slice(0, 1),
    education: resume.education.slice(0, 1),
    skills: {
      ...resume.skills,
      technical: resume.skills.technical.slice(0, 10),
      certifications: Array.from({ length: 80 }, (_, index) => ({
        title: `Single Page Certificate ${index + 1}`,
        issuer: "Verified Certification Provider",
        issuedAt: `${2001 + index}`,
        verificationUrl: `https://example.com/single-page-certificate-${index + 1}`,
      })),
    },
  };
  const rendered = await renderResumePdf(singlePageResume, "/assets/profile.jpeg", "ats");
  if (rendered.validation.pages !== 1) {
    throw new Error(`El CV breve ocupó ${rendered.validation.pages} páginas en vez de 1.`);
  }
  return {
    layout: "ats-single-page-preference",
    pages: rendered.validation.pages,
    certificationsAvailable: singlePageResume.skills.certifications.length,
    certificationsIncluded: rendered.certificationsIncluded,
    compactionLevel: rendered.compactionLevel,
  };
}

async function main() {
  const spanishResume: GeneratedResume = {
    ...resume,
    language: "es",
    professionalTitle: "Desarrollador Backend y Full-Stack",
    summary: "Desarrollador backend y full-stack con experiencia en arquitectura, integración, automatización, educación técnica y comunicación con equipos multidisciplinarios.",
  };
  const spanishAts = renderResumePdf(spanishResume, "/assets/profile.jpeg", "ats").then((rendered) => ({
    layout: "ats-es",
    pages: rendered.validation.pages,
    bytes: rendered.validation.fileSizeBytes,
    textCharacters: rendered.validation.textCharacters,
    checks: rendered.validation.checks,
    compactionLevel: rendered.compactionLevel,
    imageIncluded: rendered.imageIncluded,
    certificationsIncluded: rendered.certificationsIncluded,
  }));
  const results = await Promise.all([
    verify("ats"),
    verify("visual"),
    spanishAts,
    verifyAdaptiveCertifications(),
    verifySinglePagePreference(),
  ]);
  console.log(JSON.stringify(results, null, 2));
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
