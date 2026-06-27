import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const announcements = await prisma.announcement.findMany({
    where: {
      orgId: session.orgId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    include: { author: { select: { name: true } } },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 20,
  });

  return NextResponse.json(announcements);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "employee") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, body, priority, expiresAt } = await req.json();
  if (!title?.trim() || !body?.trim()) return NextResponse.json({ error: "Title and body are required." }, { status: 400 });

  const announcement = await prisma.announcement.create({
    data: {
      orgId: session.orgId,
      authorId: session.userId,
      title: title.trim(),
      body: body.trim(),
      priority: priority || "normal",
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
    include: { author: { select: { name: true } } },
  });

  return NextResponse.json(announcement, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === "employee") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  await prisma.announcement.deleteMany({ where: { id, orgId: session.orgId } });
  return NextResponse.json({ ok: true });
}
