import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const locations = await prisma.location.findMany({
    where: { orgId: session.orgId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(locations);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "owner"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, latitude, longitude, radius } = await req.json();

  if (!name || latitude === undefined || longitude === undefined) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const location = await prisma.location.create({
    data: { orgId: session.orgId, name, latitude, longitude, radius: radius ?? 100 },
  });

  return NextResponse.json(location, { status: 201 });
}
