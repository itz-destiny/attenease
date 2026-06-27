import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/auth";

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function POST(req: NextRequest) {
  const { name, email, password, orgName } = await req.json();

  if (!name || !email || !password || !orgName) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const baseSlug = slugify(orgName);
  let slug = baseSlug;
  let i = 1;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${i++}`;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const org = await prisma.organization.create({ data: { name: orgName, slug } });
  const user = await prisma.user.create({
    data: { orgId: org.id, name, email: email.toLowerCase(), passwordHash, role: "owner" },
  });

  const token = await createSession({ userId: user.id, orgId: org.id, role: user.role, name: user.name, email: user.email });

  const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role }, redirect: "/dashboard" });
  res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
  return res;
}
