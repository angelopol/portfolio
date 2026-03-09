import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";

import { AdminClient } from "@/components/admin/AdminClient";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { ADMIN_COOKIE_NAME, hasAdminSession, isAdminConfigured } from "@/lib/auth";
import { getSiteContent } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Control Room | Angelo Polgrossi",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ControlRoomPage() {
  noStore();

  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const configured = isAdminConfigured();

  if (!hasAdminSession(sessionCookie)) {
    return <AdminLogin configured={configured} />;
  }

  const content = await getSiteContent();

  return <AdminClient initialContent={content} />;
}
