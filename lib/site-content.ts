import { promises as fs } from "fs";
import path from "path";

import {
  getSupabaseAdminClient,
  getSupabaseContentRowId,
  isMissingSupabaseTableError,
  isSupabaseConfigured,
} from "@/lib/supabase";
import type { ContactInfo, SiteContent } from "@/types/site";

const contentFilePath = path.join(process.cwd(), "content", "site-content.json");

export function normalizeSiteContent(content: SiteContent): SiteContent {
  const legacyContent = content as SiteContent & { contact?: Partial<ContactInfo> };

  return {
    ...content,
    contact: {
      location: legacyContent.contact?.location || content.home.location || content.site.location,
      phone: legacyContent.contact?.phone || "",
      email: legacyContent.contact?.email || content.site.email,
      githubUrl:
        legacyContent.contact?.githubUrl ||
        content.socials.find((social) => social.label.toLowerCase() === "github")?.href ||
        "",
      linkedinUrl:
        legacyContent.contact?.linkedinUrl ||
        content.socials.find((social) => social.label.toLowerCase() === "linkedin")?.href ||
        "",
      portfolioUrl: legacyContent.contact?.portfolioUrl || "",
    },
    certifications: Array.isArray(content.certifications) ? content.certifications : [],
    workExperience: Array.isArray(content.workExperience) ? content.workExperience : [],
    education: Array.isArray(content.education) ? content.education : [],
    resume: {
      ...content.resume,
      fullName: content.resume.fullName || content.site.name,
      softSkills: Array.isArray(content.resume.softSkills) ? content.resume.softSkills : [],
      languages: Array.isArray(content.resume.languages) ? content.resume.languages : [],
    },
    translations: {
      es: content.translations?.es ?? {},
    },
  };
}

async function getLocalSiteContent(): Promise<SiteContent> {
  const rawContent = await fs.readFile(contentFilePath, "utf8");
  return normalizeSiteContent(JSON.parse(rawContent) as SiteContent);
}

export async function getSiteContent(): Promise<SiteContent> {
  if (!isSupabaseConfigured()) {
    return getLocalSiteContent();
  }

  const supabase = getSupabaseAdminClient();
  const rowId = getSupabaseContentRowId();
  const { data, error } = await supabase
    .from("site_content")
    .select("content")
    .eq("id", rowId)
    .maybeSingle();

  if (error) {
    if (isMissingSupabaseTableError(error.message)) {
      return getLocalSiteContent();
    }

    throw new Error(`No se pudo cargar el contenido desde Supabase: ${error.message}`);
  }

  if (data?.content) {
    return normalizeSiteContent(data.content as SiteContent);
  }

  const seededContent = await getLocalSiteContent();
  await saveSiteContent(seededContent);
  return seededContent;
}

export async function saveSiteContent(content: SiteContent): Promise<void> {
  if (!isSupabaseConfigured()) {
    const nextContent = `${JSON.stringify(content, null, 2)}\n`;
    await fs.writeFile(contentFilePath, nextContent, "utf8");
    return;
  }

  const supabase = getSupabaseAdminClient();
  const rowId = getSupabaseContentRowId();
  const { error } = await supabase.from("site_content").upsert(
    {
      id: rowId,
      content,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    if (isMissingSupabaseTableError(error.message)) {
      const nextContent = `${JSON.stringify(content, null, 2)}\n`;
      await fs.writeFile(contentFilePath, nextContent, "utf8");
      return;
    }

    throw new Error(`No se pudo guardar el contenido en Supabase: ${error.message}`);
  }
}
