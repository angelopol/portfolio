import { NextResponse } from "next/server";

import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  isAdminConfigured,
  verifyAdminSecret,
} from "@/lib/auth";

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Define PORTFOLIO_ADMIN_SECRET en tu entorno." },
      { status: 500 }
    );
  }

  const { secret } = (await request.json()) as { secret?: string };
  const normalizedSecret = secret?.trim();

  if (!normalizedSecret || !verifyAdminSecret(normalizedSecret)) {
    return NextResponse.json({ error: "Clave inválida." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: createAdminSessionToken(normalizedSecret),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
