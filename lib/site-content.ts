import { promises as fs } from "fs";
import path from "path";

import { getSupabaseAdminClient, getSupabaseContentRowId, isSupabaseConfigured } from "@/lib/supabase";
import type { SiteContent } from "@/types/site";

const contentFilePath = path.join(process.cwd(), "content", "site-content.json");

async function getLocalSiteContent(): Promise<SiteContent> {
  const rawContent = await fs.readFile(contentFilePath, "utf8");
  return JSON.parse(rawContent) as SiteContent;
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
    throw new Error(`No se pudo cargar el contenido desde Supabase: ${error.message}`);
  }

  if (data?.content) {
    return data.content as SiteContent;
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
    throw new Error(`No se pudo guardar el contenido en Supabase: ${error.message}`);
  }
}
