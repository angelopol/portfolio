import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminWorkspace, type AdminSection } from "@/components/admin/AdminWorkspace";
import { ADMIN_COOKIE_NAME, hasAdminSession, isAdminConfigured } from "@/lib/auth";
import { getSiteContent } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Control Room | Angelo Polgrossi",
  robots: { index: false, follow: false },
};

const sections: AdminSection[] = [
  "home",
  "about",
  "experience",
  "education",
  "projects",
  "certifications",
  "resume-builder",
  "settings",
];

export default async function ControlRoomSectionPage({ params }: { params: { section: string } }) {
  noStore();

  if (!sections.includes(params.section as AdminSection)) notFound();

  const sessionCookie = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!hasAdminSession(sessionCookie)) {
    return <AdminLogin configured={isAdminConfigured()} />;
  }

  const content = await getSiteContent();
  return <AdminWorkspace initialContent={content} section={params.section as AdminSection} />;
}
