import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";

import { SiteShell } from "@/components/portfolio/site-shell";
import { getSiteContent } from "@/lib/site-content";
import { LANGUAGE_COOKIE_NAME, localizeSiteContent, parseLanguage } from "@/lib/i18n";

export default async function HomePage() {
  noStore();
  const language = parseLanguage(cookies().get(LANGUAGE_COOKIE_NAME)?.value);
  const content = localizeSiteContent(await getSiteContent(), language);

  return <SiteShell content={content} language={language} />;
}
