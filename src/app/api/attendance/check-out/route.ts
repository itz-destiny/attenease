import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { attendanceId, latitude, longitude, offlineTimestamp } = await req.json();

  // attendanceId may be absent when replaying an offline check-out whose check-in was also offline
  const record = attendanceId
    ? await prisma.attendance.findFirst({ where: { id: attendanceId, userId: session.userId, checkOut: null } })
    : await prisma.attendance.findFirst({ where: { userId: session.userId, checkOut: null }, orderBy: { checkIn: "desc" } });

  if (!record) return NextResponse.json({ error: "No active check-in found." }, { status: 404 });

  let checkOutTime = new Date();
  if (offlineTimestamp) {
    const ts = new Date(offlineTimestamp);
    const ageMs = Date.now() - ts.getTime();
    if (!isNaN(ts.getTime()) && ageMs >= 0 && ageMs < 86400000) {
      checkOutTime = ts;
    }
  }

  const updated = await prisma.attendance.update({
    where: { id: record.id },
    data: { checkOut: checkOutTime, outLatitude: latitude, outLongitude: longitude },
  });

  return NextResponse.json(updated);
}
