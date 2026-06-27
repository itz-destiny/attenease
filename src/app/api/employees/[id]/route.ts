import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role === "employee") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { role } = await req.json();

  const user = await prisma.user.findFirst({ where: { id, orgId: session.orgId } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.user.update({ where: { id }, data: { role } });
  return NextResponse.json({ id: updated.id, role: updated.role });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["admin", "owner"].includes(session.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (id === session.userId) return NextResponse.json({ error: "Cannot delete yourself." }, { status: 400 });

  await prisma.user.deleteMany({ where: { id, orgId: session.orgId } });
  return NextResponse.json({ ok: true });
}
