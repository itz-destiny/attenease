import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { effectivePlan, getPlanLimit } from "@/lib/plans";
import bcrypt from "bcryptjs";

function generatePassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let p = "";
  for (let i = 0; i < 10; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return p;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "employee") return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { rows } = await req.json() as { rows: { name: string; email: string; role?: string }[] };

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows provided." }, { status: 400 });
  }
  if (rows.length > 1000) {
    return NextResponse.json({ error: "Maximum 1,000 rows per import." }, { status: 400 });
  }

  // Plan limit check
  const org = await prisma.organization.findUnique({ where: { id: session.orgId } });
  if (org) {
    const activePlan = effectivePlan(org.plan, org.planExpiresAt);
    const limit = getPlanLimit(activePlan, "employees");
    const currentCount = await prisma.user.count({ where: { orgId: session.orgId, role: { not: "owner" } } });
    if (currentCount + rows.length > limit) {
      return NextResponse.json({
        error: `Your plan allows up to ${limit} employees. You have ${currentCount} and are trying to add ${rows.length}. Upgrade at /pricing.`,
      }, { status: 403 });
    }
  }

  // Existing emails in this org
  const existingEmails = new Set(
    (await prisma.user.findMany({ where: { orgId: session.orgId }, select: { email: true } })).map((u) => u.email.toLowerCase())
  );

  // Also fetch globally existing emails (email is @unique across all orgs)
  const allEmails = rows.map((r) => r.email.toLowerCase().trim()).filter(Boolean);
  const globalConflicts = new Set(
    (await prisma.user.findMany({ where: { email: { in: allEmails } }, select: { email: true } })).map((u) => u.email.toLowerCase())
  );

  const results: { name: string; email: string; password: string; status: "created" | "skipped"; reason?: string }[] = [];

  for (const row of rows) {
    const name = (row.name ?? "").trim();
    const email = (row.email ?? "").trim().toLowerCase();
    const role = ["admin", "employee"].includes(row.role ?? "") ? row.role! : "employee";

    if (!name || !email || !email.includes("@")) {
      results.push({ name, email, password: "", status: "skipped", reason: "Invalid name or email" });
      continue;
    }
    if (globalConflicts.has(email)) {
      results.push({ name, email, password: "", status: "skipped", reason: "Email already exists" });
      continue;
    }

    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);

    try {
      await prisma.user.create({
        data: { orgId: session.orgId, name, email, passwordHash, role },
      });
      globalConflicts.add(email); // prevent duplicate within same import
      results.push({ name, email, password, status: "created" });
    } catch {
      results.push({ name, email, password: "", status: "skipped", reason: "Database error" });
    }
  }

  return NextResponse.json({ results });
}
