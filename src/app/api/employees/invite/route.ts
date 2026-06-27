import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { effectivePlan, getPlanLimit } from "@/lib/plans";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "owner"].includes(session.role)) {
    return NextResponse.json({ error: "Only admins can invite employees." }, { status: 401 });
  }

  const { name, email, password, role } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  // Enforce plan employee limit
  const org = await prisma.organization.findUnique({ where: { id: session.orgId } });
  if (org) {
    const activePlan = effectivePlan(org.plan, org.planExpiresAt);
    const limit = getPlanLimit(activePlan, "employees");
    const currentCount = await prisma.user.count({ where: { orgId: session.orgId, role: { not: "owner" } } });
    if (currentCount >= limit) {
      return NextResponse.json({
        error: `Your ${activePlan} plan supports up to ${limit} employees. Upgrade at /pricing to add more.`,
      }, { status: 403 });
    }
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      orgId: session.orgId,
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role ?? "employee",
    },
  });

  return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt }, { status: 201 });
}
