import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWithinRadius } from "@/lib/geo";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { locationId, latitude, longitude, note, offlineTimestamp } = await req.json();

  // Block double check-in (open session) AND second check-in on same calendar day
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayRecord = await prisma.attendance.findFirst({
    where: { userId: session.userId, checkIn: { gte: todayStart, lte: todayEnd } },
  });
  if (todayRecord) {
    if (!todayRecord.checkOut) {
      return NextResponse.json({ error: "Already checked in. Please check out first." }, { status: 400 });
    }
    return NextResponse.json({ error: "You have already completed your attendance for today." }, { status: 400 });
  }

  const location = await prisma.location.findFirst({ where: { id: locationId, orgId: session.orgId } });
  if (!location) return NextResponse.json({ error: "Location not found" }, { status: 404 });

  const inZone = isWithinRadius(latitude, longitude, location.latitude, location.longitude, location.radius);
  if (!inZone) {
    const dist = Math.round(
      6371000 * 2 * Math.atan2(
        Math.sqrt(
          Math.sin(((location.latitude - latitude) * Math.PI) / 180 / 2) ** 2 +
          Math.cos((latitude * Math.PI) / 180) * Math.cos((location.latitude * Math.PI) / 180) *
          Math.sin(((location.longitude - longitude) * Math.PI) / 180 / 2) ** 2
        ),
        Math.sqrt(
          1 - Math.sin(((location.latitude - latitude) * Math.PI) / 180 / 2) ** 2 -
          Math.cos((latitude * Math.PI) / 180) * Math.cos((location.latitude * Math.PI) / 180) *
          Math.sin(((location.longitude - longitude) * Math.PI) / 180 / 2) ** 2
        )
      )
    );
    return NextResponse.json(
      { error: `You are ${dist}m away. Must be within ${location.radius}m of ${location.name}.` },
      { status: 403 }
    );
  }

  // offlineTimestamp is set when syncing a queued offline check-in
  let checkInTime = new Date();
  if (offlineTimestamp) {
    const ts = new Date(offlineTimestamp);
    const ageMs = Date.now() - ts.getTime();
    // Accept offline timestamps up to 24 hours old
    if (!isNaN(ts.getTime()) && ageMs >= 0 && ageMs < 86400000) {
      checkInTime = ts;
    }
  }
  const status = checkInTime.getHours() >= 9 ? "late" : "present";

  const attendance = await prisma.attendance.create({
    data: {
      orgId: session.orgId,
      userId: session.userId,
      locationId: location.id,
      checkIn: checkInTime,
      inLatitude: latitude,
      inLongitude: longitude,
      status,
      note: note || null,
    },
  });

  return NextResponse.json({ ...attendance, locationName: location.name }, { status: 201 });
}
