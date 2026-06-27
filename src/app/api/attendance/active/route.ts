import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json(null);

  const active = await prisma.attendance.findFirst({
    where: { userId: session.userId, checkOut: null },
    include: { location: true },
    orderBy: { checkIn: "desc" },
  });

  if (!active) return NextResponse.json(null);

  return NextResponse.json({
    id: active.id,
    checkIn: active.checkIn,
    locationName: active.location?.name ?? null,
  });
}
