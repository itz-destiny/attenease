import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "employee") return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { employeeId, locationId, date, checkInTime, checkOutTime, status, note } = await req.json();

  if (!employeeId || !date || !checkInTime) {
    return NextResponse.json({ error: "employeeId, date, and checkInTime are required." }, { status: 400 });
  }

  const employee = await prisma.user.findFirst({ where: { id: employeeId, orgId: session.orgId } });
  if (!employee) return NextResponse.json({ error: "Employee not found." }, { status: 404 });

  const checkIn = new Date(`${date}T${checkInTime}:00`);
  const checkOut = checkOutTime ? new Date(`${date}T${checkOutTime}:00`) : null;

  if (checkOut && checkOut <= checkIn) {
    return NextResponse.json({ error: "Check-out must be after check-in." }, { status: 400 });
  }

  const existing = await prisma.attendance.findFirst({
    where: { userId: employeeId, checkIn: { gte: new Date(`${date}T00:00:00`), lte: new Date(`${date}T23:59:59`) } },
  });
  if (existing) {
    return NextResponse.json({ error: "This employee already has an attendance record for that day." }, { status: 409 });
  }

  const record = await prisma.attendance.create({
    data: {
      orgId: session.orgId,
      userId: employeeId,
      locationId: locationId || null,
      checkIn,
      checkOut,
      status: status || (checkIn.getHours() >= 9 ? "late" : "present"),
      note: note || null,
    },
    include: { user: { select: { name: true, email: true } }, location: { select: { name: true } } },
  });

  return NextResponse.json(record, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "employee") return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { id, checkInTime, checkOutTime, status, note } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const record = await prisma.attendance.findFirst({ where: { id, orgId: session.orgId } });
  if (!record) return NextResponse.json({ error: "Record not found." }, { status: 404 });

  const dateStr = record.checkIn.toISOString().split("T")[0];
  const newCheckIn = checkInTime ? new Date(`${dateStr}T${checkInTime}:00`) : record.checkIn;
  const newCheckOut = checkOutTime ? new Date(`${dateStr}T${checkOutTime}:00`) : (checkOutTime === "" ? null : record.checkOut);

  if (newCheckOut && newCheckOut <= newCheckIn) {
    return NextResponse.json({ error: "Check-out must be after check-in." }, { status: 400 });
  }

  const updated = await prisma.attendance.update({
    where: { id },
    data: { checkIn: newCheckIn, checkOut: newCheckOut ?? undefined, status: status || record.status, note: note ?? record.note },
    include: { user: { select: { name: true, email: true } }, location: { select: { name: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "employee") return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const record = await prisma.attendance.findFirst({ where: { id, orgId: session.orgId } });
  if (!record) return NextResponse.json({ error: "Record not found." }, { status: 404 });

  await prisma.attendance.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
