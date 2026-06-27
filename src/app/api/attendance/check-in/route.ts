import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWithinRadius } from "@/lib/geo";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { locationId, latitude, longitude } = await req.json();

  const existing = await prisma.attendance.findFirst({
    where: { userId: session.userId, checkOut: null },
  });
  if (existing) {
    return NextResponse.json({ error: "Already checked in. Please check out first." }, { status: 400 });
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

  const now = new Date();
  const status = now.getHours() >= 9 ? "late" : "present";

  const attendance = await prisma.attendance.create({
    data: {
      orgId: session.orgId,
      userId: session.userId,
      locationId: location.id,
      checkIn: now,
      inLatitude: latitude,
      inLongitude: longitude,
      status,
    },
  });

  return NextResponse.json({ ...attendance, locationName: location.name }, { status: 201 });
}
