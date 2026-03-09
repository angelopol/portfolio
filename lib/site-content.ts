import { promises as fs } from "fs";
import path from "path";

import type { SiteContent } from "@/types/site";

const contentFilePath = path.join(process.cwd(), "content", "site-content.json");

export async function getSiteContent(): Promise<SiteContent> {
  const rawContent = await fs.readFile(contentFilePath, "utf8");
  return JSON.parse(rawContent) as SiteContent;
}

export async function saveSiteContent(content: SiteContent): Promise<void> {
  const nextContent = `${JSON.stringify(content, null, 2)}\n`;
  await fs.writeFile(contentFilePath, nextContent, "utf8");
}
