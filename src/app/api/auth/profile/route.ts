import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession, createSession, COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, currentPassword, newPassword } = await req.json();

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const updates: Record<string, string> = {};

  if (name && name.trim() !== user.name) {
    updates.name = name.trim();
  }

  if (newPassword) {
    if (!currentPassword) return NextResponse.json({ error: "Current password is required." }, { status: 400 });
    if (newPassword.length < 8) return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    updates.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data: updates });

  // Reissue token with new name if changed
  const token = await createSession({ userId: updated.id, orgId: updated.orgId, role: updated.role, name: updated.name, email: updated.email });
  const res = NextResponse.json({ ok: true, name: updated.name });
  res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
  return res;
}
