import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { attendanceId, latitude, longitude } = await req.json();

  const record = await prisma.attendance.findFirst({
    where: { id: attendanceId, userId: session.userId, checkOut: null },
  });
  if (!record) return NextResponse.json({ error: "No active check-in found." }, { status: 404 });

  const updated = await prisma.attendance.update({
    where: { id: record.id },
    data: { checkOut: new Date(), outLatitude: latitude, outLongitude: longitude },
  });

  return NextResponse.json(updated);
}
