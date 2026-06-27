import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get("id");
  if (!locationId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const location = await prisma.location.findFirst({ where: { id: locationId, orgId: session.orgId } });
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const origin = req.headers.get("origin") ?? req.nextUrl.origin;
  const url = `${origin}/check-in?location=${locationId}`;

  const dataUrl = await QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  return NextResponse.json({ qr: dataUrl, url, locationName: location.name });
}
