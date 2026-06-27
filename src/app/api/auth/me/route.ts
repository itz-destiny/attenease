import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json(null);

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { organization: { select: { id: true, name: true, slug: true, plan: true } } },
  });
  if (!user) return NextResponse.json(null);

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organization: user.organization,
  });
}
