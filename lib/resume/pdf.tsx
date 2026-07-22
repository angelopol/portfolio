import "server-only";

import { promises as dns } from "dns";
import { promises as fs } from "fs";
import net from "net";
import path from "path";
import React from "react";
import {
  Document,
  Font,
  Image,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";

import { newestCertificationsFirst } from "@/lib/resume/certification-date";
import { validateResumePdf, type ResumePdfValidation } from "@/lib/resume/validate";
import type {
  GeneratedResume,
  GeneratedResumeCertification,
  GeneratedResumeEducation,
  GeneratedResumeExperience,
  ResumeLayout,
} from "@/types/resume";

Font.registerHyphenationCallback((word) => [word]);

const MAX_PROFILE_IMAGE_BYTES = 1_500_000;
const colors = { text: "#111111", muted: "#333333", link: "#0000bb" };

const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingBottom: 34,
    paddingHorizontal: 38,
    fontFamily: "Times-Roman",
    fontSize: 10.2,
    color: colors.text,
    lineHeight: 1.2,
  },
  pageCompact: {
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 35,
    fontSize: 9.7,
    lineHeight: 1.16,
  },
  headerVisual: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  headerAts: { marginBottom: 13 },
  photo: { width: 72, height: 82, objectFit: "cover", marginRight: 16 },
  headerText: { flexGrow: 1, flexShrink: 1 },
  name: { fontFamily: "Times-Bold", fontSize: 22, lineHeight: 1.12, marginBottom: 6 },
  nameCompact: { fontSize: 20 },
  professionalTitle: { fontFamily: "Times-Bold", fontSize: 10.5, lineHeight: 1.25, marginBottom: 5, color: colors.muted },
  contactLine: { fontSize: 9.8, marginBottom: 2 },
  link: { color: colors.link, textDecoration: "underline" },
  summary: { fontSize: 10.4, lineHeight: 1.3, textAlign: "justify" },
  section: { marginTop: 3, marginBottom: 7 },
  sectionTitle: { fontFamily: "Times-Bold", fontSize: 11.5, textTransform: "uppercase", marginBottom: 7 },
  entry: { marginBottom: 9 },
  entryCompact: { marginBottom: 6 },
  entryHeaderRow: { flexDirection: "row", marginBottom: 2 },
  entryHeaderMain: { width: "74%", paddingRight: 10 },
  entryHeaderAside: { width: "26%", textAlign: "right" },
  entryTitle: { fontFamily: "Times-Bold", fontSize: 10.4, textTransform: "uppercase" },
  organization: { fontFamily: "Times-Bold", marginTop: 1 },
  meta: { marginTop: 1 },
  location: { fontFamily: "Times-Bold" },
  dates: { fontFamily: "Times-Italic", marginTop: 1 },
  entrySummary: { textAlign: "justify", marginTop: 2, marginBottom: 1 },
  bulletRow: { flexDirection: "row", marginLeft: 11, marginTop: 1 },
  bullet: { width: 10 },
  bulletText: { flex: 1 },
  inlineReferenceLink: { color: colors.link, textDecoration: "underline" },
  educationEntry: { marginBottom: 7 },
  certificationEntry: { marginBottom: 3, marginLeft: 11 },
  skillsList: { marginLeft: 11 },
  skillRow: { flexDirection: "row", marginBottom: 3 },
  skillLabel: { width: 92, fontFamily: "Times-Bold" },
  skillValue: { flex: 1 },
});

const labels = {
  en: {
    summary: "Professional Summary",
    experience: "Work Experience",
    education: "Education",
    certifications: "Certifications",
    skills: "Skills",
    technical: "Technical",
    soft: "Soft skills",
    languages: "Languages",
  },
  es: {
    summary: "Resumen profesional",
    experience: "Experiencia profesional",
    education: "Educación",
    certifications: "Certificaciones",
    skills: "Habilidades",
    technical: "Técnicas",
    soft: "Habilidades blandas",
    languages: "Idiomas",
  },
} as const;

function safeHttpUrl(value: string) {
  if (!value.trim()) return "";
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(candidate);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : "";
  } catch {
    return "";
  }
}

function prettyUrl(value: string) {
  return value.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function joinDates(startDate: string, endDate: string) {
  return [startDate, endDate].filter(Boolean).join(" – ");
}

function truncateAtWord(value: string, max: number) {
  if (value.length <= max) return value;
  const candidate = value.slice(0, Math.max(0, max - 1));
  const sentenceBoundary = Math.max(
    candidate.lastIndexOf(". "),
    candidate.lastIndexOf("! "),
    candidate.lastIndexOf("? ")
  );
  if (sentenceBoundary > max * 0.55) return candidate.slice(0, sentenceBoundary + 1).trimEnd();

  const wordBoundary = candidate.lastIndexOf(" ");
  return `${candidate.slice(0, wordBoundary > max * 0.65 ? wordBoundary : candidate.length).trimEnd()}…`;
}

type CompactionLevel = 0 | 1 | 2 | 3 | 4;

function compactResume(
  resume: GeneratedResume,
  level: CompactionLevel,
  certificationLimit = resume.skills.certifications.length
): GeneratedResume {
  const certifications = newestCertificationsFirst(
    resume.skills.certifications.slice(0, Math.max(0, certificationLimit))
  );
  if (level === 0) {
    return {
      ...resume,
      skills: { ...resume.skills, certifications },
    };
  }

  const limits = {
    1: { summary: 720, experiences: 6, experienceSummary: 900, highlights: 4, highlight: 180, education: 4, educationDescription: 180, technical: 28, soft: 10, languages: 8 },
    2: { summary: 600, experiences: 6, experienceSummary: 650, highlights: 3, highlight: 160, education: 4, educationDescription: 150, technical: 25, soft: 8, languages: 6 },
    3: { summary: 480, experiences: 6, experienceSummary: 430, highlights: 3, highlight: 130, education: 3, educationDescription: 110, technical: 21, soft: 7, languages: 5 },
    4: { summary: 360, experiences: 5, experienceSummary: 260, highlights: 2, highlight: 105, education: 3, educationDescription: 80, technical: 17, soft: 5, languages: 4 },
  }[level];

  return {
    ...resume,
    summary: truncateAtWord(resume.summary, limits.summary),
    experience: resume.experience.slice(0, limits.experiences).map((entry) => ({
      ...entry,
      summary: truncateAtWord(entry.summary, limits.experienceSummary),
      highlights: entry.highlights
        .slice(0, limits.highlights)
        .map((item) => truncateAtWord(item, limits.highlight)),
      links: entry.links.slice(0, 2),
    })),
    education: resume.education.slice(0, limits.education).map((entry) => ({
      ...entry,
      description: truncateAtWord(entry.description, limits.educationDescription),
      links: entry.links.slice(0, 2),
    })),
    skills: {
      technical: resume.skills.technical.slice(0, limits.technical),
      certifications,
      soft: resume.skills.soft.slice(0, limits.soft),
      languages: resume.skills.languages.slice(0, limits.languages),
    },
  };
}

function isPrivateIp(address: string) {
  const normalized = address.toLocaleLowerCase();
  if (normalized.startsWith("::ffff:")) return isPrivateIp(normalized.slice(7));

  if (net.isIPv4(normalized)) {
    const [a, b] = normalized.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }

  if (net.isIPv6(normalized)) {
    return (
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      /^fe[89ab]/.test(normalized)
    );
  }

  return true;
}

async function assertSafeRemoteUrl(value: string) {
  const parsed = new URL(value);
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error("URL de imagen no permitida.");
  }

  const hostname = parsed.hostname.toLocaleLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new Error("Host de imagen no permitido.");
  }

  const addresses = net.isIP(hostname)
    ? [{ address: hostname }]
    : await dns.lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) {
    throw new Error("La imagen resuelve a una red no permitida.");
  }

  return parsed;
}

async function readLimitedResponse(response: Response) {
  const declaredSize = Number(response.headers.get("content-length") || 0);
  if (declaredSize > MAX_PROFILE_IMAGE_BYTES) throw new Error("Imagen demasiado grande.");
  if (!response.body) throw new Error("La imagen no contiene datos.");

  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = response.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_PROFILE_IMAGE_BYTES) {
      await reader.cancel();
      throw new Error("Imagen demasiado grande.");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), total);
}

async function fetchRemoteImage(source: string) {
  let current = await assertSafeRemoteUrl(source);

  for (let redirects = 0; redirects <= 3; redirects += 1) {
    const response = await fetch(current, {
      signal: AbortSignal.timeout(2500),
      cache: "no-store",
      redirect: "manual",
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirects === 3) throw new Error("Demasiadas redirecciones de imagen.");
      current = await assertSafeRemoteUrl(new URL(location, current).toString());
      continue;
    }

    if (!response.ok) throw new Error("No se pudo descargar la imagen.");
    const mime = (response.headers.get("content-type") || "").split(";")[0].trim().toLocaleLowerCase();
    if (!["image/jpeg", "image/png"].includes(mime)) throw new Error("Formato de imagen no permitido.");
    const data = await readLimitedResponse(response);
    return `data:${mime};base64,${data.toString("base64")}`;
  }

  return undefined;
}

async function resolveProfileImage(source: string): Promise<string | undefined> {
  try {
    if (source.startsWith("/")) {
      const publicRoot = path.resolve(process.cwd(), "public");
      const filePath = path.resolve(publicRoot, `.${decodeURIComponent(source)}`);
      if (filePath !== publicRoot && !filePath.startsWith(`${publicRoot}${path.sep}`)) return undefined;
      const extension = path.extname(filePath).toLocaleLowerCase();
      const mime = extension === ".png" ? "image/png" : [".jpg", ".jpeg"].includes(extension) ? "image/jpeg" : "";
      if (!mime) return undefined;
      const stat = await fs.stat(filePath);
      if (stat.size > MAX_PROFILE_IMAGE_BYTES) return undefined;
      const data = await fs.readFile(filePath);
      return `data:${mime};base64,${data.toString("base64")}`;
    }

    if (/^https?:\/\//i.test(source)) return await fetchRemoteImage(source);
  } catch {
    return undefined;
  }

  return undefined;
}

function ContactLines({ resume }: { resume: GeneratedResume }) {
  const contact = resume.contact;
  const firstLine = [contact.location, contact.phone, contact.email].filter(Boolean);
  const links = [contact.portfolioUrl, contact.linkedinUrl, contact.githubUrl].filter(Boolean);

  return (
    <>
      {firstLine.length ? (
        <Text style={styles.contactLine}>
          {firstLine.map((item, index) => (
            <Text key={`${item}-${index}`}>
              {index ? " · " : ""}
              {item === contact.email ? <Link src={`mailto:${item}`} style={styles.link}>{item}</Link> : item === contact.phone ? <Link src={`tel:${item.replace(/\s+/g, "")}`} style={styles.link}>{item}</Link> : item}
            </Text>
          ))}
        </Text>
      ) : null}
      {links.length ? (
        <Text style={styles.contactLine}>
          {links.map((item, index) => {
            const href = safeHttpUrl(item);
            return <Text key={`${item}-${index}`}>{index ? " · " : ""}{href ? <Link src={href} style={styles.link}>{prettyUrl(item)}</Link> : prettyUrl(item)}</Text>;
          })}
        </Text>
      ) : null}
    </>
  );
}

function ContactHeader({ resume, image, compact, layout }: { resume: GeneratedResume; image?: string; compact: boolean; layout: ResumeLayout }) {
  const content = (
    <View style={styles.headerText}>
      <Text style={[styles.name, compact ? styles.nameCompact : {}]}>{resume.fullName}</Text>
      {resume.professionalTitle ? <Text style={styles.professionalTitle}>{resume.professionalTitle}</Text> : null}
      <ContactLines resume={resume} />
    </View>
  );

  if (layout === "visual") {
    return <View style={styles.headerVisual}>{image ? <Image src={image} style={styles.photo} /> : null}{content}</View>;
  }

  return <View style={styles.headerAts}>{content}</View>;
}

function InlineReferenceLinks({ links }: { links: Array<{ label: string; url: string }> }) {
  const validLinks = links.flatMap((link) => {
    const href = safeHttpUrl(link.url);
    return href ? [{ ...link, href }] : [];
  });
  if (!validLinks.length) return null;

  return (
    <Text>
      {" ("}
      {validLinks.map((link, index) => (
        <Text key={`${link.url}-${index}`}>
          {index ? ", " : ""}
          <Link src={link.href} style={styles.inlineReferenceLink}>
            {link.label || prettyUrl(link.url)}
          </Link>
        </Text>
      ))}
      {")"}
    </Text>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <>
      {items.map((highlight, index) => (
        <View key={index} style={styles.bulletRow} wrap={false}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>{highlight}</Text>
        </View>
      ))}
    </>
  );
}

function ExperienceEntry({ entry, layout, compact }: { entry: GeneratedResumeExperience; layout: ResumeLayout; compact: boolean }) {
  const dates = joinDates(entry.startDate, entry.endDate);
  const heading = (
    <>
      <Text style={styles.entryTitle}>{entry.organization || entry.title}</Text>
      {entry.organization && entry.title ? <Text style={styles.organization}>{entry.title}</Text> : null}
    </>
  );

  return (
    <View style={[styles.entry, compact ? styles.entryCompact : {}]}>
      {layout === "visual" ? (
        <View style={styles.entryHeaderRow} wrap={false}>
          <View style={styles.entryHeaderMain}>{heading}</View>
          <View style={styles.entryHeaderAside}>
            {entry.location ? <Text style={styles.location}>{entry.location}</Text> : null}
            {dates ? <Text style={styles.dates}>{dates}</Text> : null}
          </View>
        </View>
      ) : (
        <View wrap={false}>
          {heading}
          {(entry.location || dates) ? <Text style={styles.meta}>{[entry.location, dates].filter(Boolean).join(" | ")}</Text> : null}
        </View>
      )}
      {entry.summary || entry.links.length ? (
        <Text style={styles.entrySummary}>
          {entry.summary}
          <InlineReferenceLinks links={entry.links} />
        </Text>
      ) : null}
      <Bullets items={entry.highlights} />
    </View>
  );
}

function EducationEntry({ entry, layout }: { entry: GeneratedResumeEducation; layout: ResumeLayout }) {
  const dates = joinDates(entry.startDate, entry.endDate);
  return (
    <View style={styles.educationEntry}>
      {layout === "visual" ? (
        <View style={styles.entryHeaderRow} wrap={false}>
          <View style={styles.entryHeaderMain}>
            <Text style={styles.entryTitle}>{entry.institution}</Text>
            <Text>{entry.title}</Text>
          </View>
          <View style={styles.entryHeaderAside}>
            {entry.location ? <Text style={styles.location}>{entry.location}</Text> : null}
            {dates ? <Text style={styles.dates}>{dates}</Text> : null}
          </View>
        </View>
      ) : (
        <View wrap={false}>
          <Text style={styles.entryTitle}>{entry.institution}</Text>
          <Text>{entry.title}</Text>
          {(entry.location || dates) ? <Text style={styles.meta}>{[entry.location, dates].filter(Boolean).join(" | ")}</Text> : null}
        </View>
      )}
      {entry.description || entry.links.length ? (
        <Text style={styles.entrySummary}>
          {entry.description}
          <InlineReferenceLinks links={entry.links} />
        </Text>
      ) : null}
    </View>
  );
}

function SectionHeading({ children }: { children: string }) {
  return <Text style={styles.sectionTitle} minPresenceAhead={70}>{children}</Text>;
}

function EducationSection({ resume, layout }: { resume: GeneratedResume; layout: ResumeLayout }) {
  if (!resume.education.length) return null;
  const [firstEntry, ...remainingEntries] = resume.education;
  return (
    <View style={styles.section}>
      <View wrap={false}>
        <SectionHeading>{labels[resume.language].education}</SectionHeading>
        <EducationEntry entry={firstEntry} layout={layout} />
      </View>
      {remainingEntries.map((entry, index) => <EducationEntry key={index} entry={entry} layout={layout} />)}
    </View>
  );
}

function CertificationEntry({ certification }: { certification: GeneratedResumeCertification }) {
  const details = [certification.issuer, certification.issuedAt].filter(Boolean).join(" · ");
  const href = safeHttpUrl(certification.verificationUrl);
  return (
    <View style={styles.certificationEntry} wrap={false}>
      <Text>
        • {href ? <Link src={href} style={styles.link}>{certification.title}</Link> : certification.title}
        {details ? ` — ${details}` : ""}
      </Text>
    </View>
  );
}

function CertificationsSection({ resume }: { resume: GeneratedResume }) {
  if (!resume.skills.certifications.length) return null;
  return (
    <View style={styles.section}>
      <SectionHeading>{labels[resume.language].certifications}</SectionHeading>
      {resume.skills.certifications.map((certification, index) => <CertificationEntry key={`${certification.title}-${index}`} certification={certification} />)}
    </View>
  );
}

function SkillsSection({ resume }: { resume: GeneratedResume }) {
  const copy = labels[resume.language];
  const rows = [
    [copy.technical, resume.skills.technical],
    [copy.soft, resume.skills.soft],
    [copy.languages, resume.skills.languages],
  ] as const;

  return (
    <View style={styles.section}>
      <SectionHeading>{copy.skills}</SectionHeading>
      <View style={styles.skillsList}>
        {rows.filter(([, values]) => values.length).map(([label, values]) => (
          <View key={label} style={styles.skillRow} wrap={false}>
            <Text style={styles.skillLabel}>• {label}:</Text>
            <Text style={styles.skillValue}>{values.join(" · ")}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ExperienceSection({ resume, entries, layout, heading, compact }: { resume: GeneratedResume; entries: GeneratedResumeExperience[]; layout: ResumeLayout; heading: boolean; compact: boolean }) {
  if (!entries.length) return null;
  return (
    <View style={styles.section}>
      {heading ? <SectionHeading>{labels[resume.language].experience}</SectionHeading> : null}
      {entries.map((entry, index) => <ExperienceEntry key={index} entry={entry} layout={layout} compact={compact} />)}
    </View>
  );
}

function ResumeDocument({ resume, image, compact, layout }: { resume: GeneratedResume; image?: string; compact: boolean; layout: ResumeLayout }) {
  const copy = labels[resume.language];
  const pageStyle = [styles.page, compact ? styles.pageCompact : {}];
  const metadataKeywords = Array.from(new Set([
    ...resume.skills.technical.slice(0, 12),
    ...resume.skills.certifications.map((item) => item.title).slice(0, 5),
  ])).join(", ");

  return (
    <Document
      title={`${resume.fullName} - Resume`}
      author={resume.fullName}
      subject={resume.professionalTitle || "Curriculum Vitae"}
      creator="Portfolio Resume Builder"
      producer="Portfolio Resume Builder"
      keywords={metadataKeywords}
      language={resume.language === "es" ? "es-ES" : "en-US"}
      pageLayout="singlePage"
    >
      <Page size="LETTER" style={pageStyle}>
        <ContactHeader resume={resume} image={image} compact={compact} layout={layout} />
        {resume.summary ? <View style={styles.section}><SectionHeading>{copy.summary}</SectionHeading><Text style={styles.summary}>{resume.summary}</Text></View> : null}
        <ExperienceSection resume={resume} entries={resume.experience} layout={layout} heading compact={compact} />
        <EducationSection resume={resume} layout={layout} />
        <CertificationsSection resume={resume} />
        <SkillsSection resume={resume} />
      </Page>
    </Document>
  );
}

async function pageCount(buffer: Uint8Array) {
  return (await PDFDocument.load(buffer)).getPageCount();
}

export type RenderedResumePdf = {
  buffer: Buffer;
  validation: ResumePdfValidation;
  compactionLevel: CompactionLevel;
  imageIncluded: boolean;
  certificationsIncluded: number;
};

export async function renderResumePdf(
  resume: GeneratedResume,
  profileImage: string,
  layout: ResumeLayout = "ats",
  profileImageOverride?: string
): Promise<RenderedResumePdf> {
  let image: string | undefined;
  if (layout === "visual") {
    image = profileImageOverride
      ? await resolveProfileImage(profileImageOverride)
      : undefined;
    if (!image) image = await resolveProfileImage(profileImage);
  }

  for (const level of [0, 1, 2, 3, 4] as const) {
    const certificationCount = resume.skills.certifications.length;
    const renderCandidate = async (count: number) => {
      const candidate = compactResume(resume, level, count);
      const buffer = Buffer.from(
        await renderToBuffer(
          <ResumeDocument
            resume={candidate}
            image={image}
            compact={level >= 2}
            layout={layout}
          />
        )
      );
      return { candidate, buffer, pages: await pageCount(buffer) };
    };

    const core = await renderCandidate(0);
    if (core.pages > 2) continue;

    // Preserve the smallest page count required by the essential resume content.
    // Certifications fill remaining room but never force a one-page CV onto page two.
    const targetPages = core.pages === 1 ? 1 : 2;
    const complete = await renderCandidate(certificationCount);
    if (complete.pages <= targetPages) {
      const validation = await validateResumePdf(complete.buffer, complete.candidate, layout);
      return {
        buffer: complete.buffer,
        validation,
        compactionLevel: level,
        imageIncluded: Boolean(image),
        certificationsIncluded: complete.candidate.skills.certifications.length,
      };
    }

    let best = core;
    let lower = 1;
    let upper = Math.max(0, certificationCount - 1);
    while (lower <= upper) {
      const midpoint = Math.floor((lower + upper) / 2);
      const attempt = await renderCandidate(midpoint);
      if (attempt.pages <= targetPages) {
        best = attempt;
        lower = midpoint + 1;
      } else {
        upper = midpoint - 1;
      }
    }

    const validation = await validateResumePdf(best.buffer, best.candidate, layout);
    return {
      buffer: best.buffer,
      validation,
      compactionLevel: level,
      imageIncluded: Boolean(image),
      certificationsIncluded: best.candidate.skills.certifications.length,
    };
  }

  throw new Error(
    "El contenido seleccionado no cabe en dos paginas sin perder legibilidad. Reduce las instrucciones o el contenido base e intenta de nuevo."
  );
}
