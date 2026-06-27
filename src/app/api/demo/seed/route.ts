import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "employee") return NextResponse.json({ error: "Admins only" }, { status: 403 });

  // Only seed if org is empty
  const [empCount, locCount] = await Promise.all([
    prisma.user.count({ where: { orgId: session.orgId, role: { not: "owner" } } }),
    prisma.location.count({ where: { orgId: session.orgId } }),
  ]);

  if (empCount > 0 || locCount > 0) {
    return NextResponse.json({ error: "Demo data can only be loaded into an empty workspace." }, { status: 409 });
  }

  const hash = await bcrypt.hash("DemoPass123", 10);

  // Create 2 locations
  const [loc1, loc2] = await Promise.all([
    prisma.location.create({ data: { orgId: session.orgId, name: "Head Office", latitude: 6.5244, longitude: 3.3792, radius: 150 } }),
    prisma.location.create({ data: { orgId: session.orgId, name: "Branch Office", latitude: 6.4698, longitude: 3.5852, radius: 100 } }),
  ]);

  // Create 5 demo employees
  const employees = await Promise.all([
    prisma.user.create({ data: { orgId: session.orgId, name: "Chisom Eze", email: `demo.chisom.${session.orgId.slice(-4)}@attendease.demo`, passwordHash: hash, role: "employee" } }),
    prisma.user.create({ data: { orgId: session.orgId, name: "Biodun Adeyemi", email: `demo.biodun.${session.orgId.slice(-4)}@attendease.demo`, passwordHash: hash, role: "employee" } }),
    prisma.user.create({ data: { orgId: session.orgId, name: "Ngozi Obi", email: `demo.ngozi.${session.orgId.slice(-4)}@attendease.demo`, passwordHash: hash, role: "employee" } }),
    prisma.user.create({ data: { orgId: session.orgId, name: "Tunde Salami", email: `demo.tunde.${session.orgId.slice(-4)}@attendease.demo`, passwordHash: hash, role: "employee" } }),
    prisma.user.create({ data: { orgId: session.orgId, name: "Amaka Nwosu", email: `demo.amaka.${session.orgId.slice(-4)}@attendease.demo`, passwordHash: hash, role: "admin" } }),
  ]);

  // Seed 7 days of attendance history
  const now = new Date();
  const records: Parameters<typeof prisma.attendance.create>[0]["data"][] = [];

  for (let dayOffset = 6; dayOffset >= 1; dayOffset--) {
    const day = new Date(now);
    day.setDate(day.getDate() - dayOffset);
    if (day.getDay() === 0 || day.getDay() === 6) continue; // skip weekends

    for (const emp of employees) {
      const isLate = Math.random() < 0.15;
      const inHour = isLate ? 9 + Math.floor(Math.random() * 2) : 7 + Math.floor(Math.random() * 2);
      const inMin = Math.floor(Math.random() * 60);
      const outHour = 17 + Math.floor(Math.random() * 2);
      const outMin = Math.floor(Math.random() * 60);
      const loc = Math.random() > 0.3 ? loc1 : loc2;

      const checkIn = new Date(day);
      checkIn.setHours(inHour, inMin, 0, 0);
      const checkOut = new Date(day);
      checkOut.setHours(outHour, outMin, 0, 0);

      records.push({
        orgId: session.orgId,
        userId: emp.id,
        locationId: loc.id,
        checkIn,
        checkOut,
        status: isLate ? "late" : "present",
        inLatitude: loc.latitude + (Math.random() - 0.5) * 0.001,
        inLongitude: loc.longitude + (Math.random() - 0.5) * 0.001,
        outLatitude: loc.latitude + (Math.random() - 0.5) * 0.001,
        outLongitude: loc.longitude + (Math.random() - 0.5) * 0.001,
      });
    }
  }

  // Today: 3 checked in, 2 not
  const todayCheckins = employees.slice(0, 3);
  for (const emp of todayCheckins) {
    const checkIn = new Date();
    checkIn.setHours(8, Math.floor(Math.random() * 30), 0, 0);
    records.push({
      orgId: session.orgId,
      userId: emp.id,
      locationId: loc1.id,
      checkIn,
      checkOut: null,
      status: "present",
      inLatitude: loc1.latitude,
      inLongitude: loc1.longitude,
    });
  }

  await prisma.attendance.createMany({ data: records as never[] });

  // Seed an announcement
  await prisma.announcement.create({
    data: {
      orgId: session.orgId,
      authorId: session.userId,
      title: "Welcome to AttendEase! 🎉",
      body: "This is demo data to help you explore the platform. You can delete these employees and add your real team when you're ready.",
      priority: "normal",
    },
  });

  return NextResponse.json({ ok: true, employees: employees.length, locations: 2, records: records.length });
}
