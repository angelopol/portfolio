import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME, hasAdminSession } from "@/lib/auth";
import { getSiteContent, saveSiteContent } from "@/lib/site-content";
import type { SiteContent } from "@/types/site";

function ensureAdmin() {
  const sessionCookie = cookies().get(ADMIN_COOKIE_NAME)?.value;
  return hasAdminSession(sessionCookie);
}

export async function GET() {
  if (!ensureAdmin()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const content = await getSiteContent();
  return NextResponse.json(content);
}

export async function PUT(request: Request) {
  if (!ensureAdmin()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const nextContent = (await request.json()) as SiteContent;
  await saveSiteContent(nextContent);

  revalidatePath("/");
  revalidatePath("/control-room");

  return NextResponse.json({ ok: true });
}
