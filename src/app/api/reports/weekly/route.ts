import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays, format } from "date-fns";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "employee") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const days: { date: string; label: string; present: number; late: number; total: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const day = startOfDay(subDays(new Date(), i));
    const next = startOfDay(subDays(new Date(), i - 1));
    const records = await prisma.attendance.findMany({
      where: { orgId: session.orgId, checkIn: { gte: day, lt: next } },
      select: { status: true },
    });
    days.push({
      date: day.toISOString(),
      label: format(day, "EEE"),
      present: records.filter((r) => r.status === "present").length,
      late: records.filter((r) => r.status === "late").length,
      total: records.length,
    });
  }

  return NextResponse.json(days);
}
