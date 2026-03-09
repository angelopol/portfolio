import { unstable_noStore as noStore } from "next/cache";

import { SiteShell } from "@/components/portfolio/site-shell";
import { getSiteContent } from "@/lib/site-content";

export default async function HomePage() {
  noStore();
  const content = await getSiteContent();

  return <SiteShell content={content} />;
}
