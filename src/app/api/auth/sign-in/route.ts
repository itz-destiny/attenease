import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const token = await createSession({ userId: user.id, orgId: user.orgId, role: user.role, name: user.name, email: user.email });

  const redirect = user.role === "employee" ? "/employee" : "/dashboard";
  const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role }, redirect });
  res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
  return res;
}
