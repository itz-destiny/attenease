import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role === "employee") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const employees = await prisma.user.findMany({
    where: { orgId: session.orgId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(employees);
}
