import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === "employee") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const fromDate = from ? new Date(`${from}T00:00:00`) : new Date(new Date().setDate(new Date().getDate() - 30));
  const toDate = to ? new Date(`${to}T23:59:59`) : new Date();

  const records = await prisma.attendance.findMany({
    where: {
      orgId: session.orgId,
      checkIn: { gte: fromDate, lte: toDate },
    },
    include: {
      user: { select: { name: true, email: true } },
      location: { select: { name: true } },
    },
    orderBy: { checkIn: "desc" },
  });

  return NextResponse.json(records);
}
