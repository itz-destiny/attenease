import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-paystack-signature");
  const body = await req.text();

  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest("hex");

  if (hash !== signature) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const event = JSON.parse(body);

  if (event.event === "charge.success") {
    const { orgId, plan, billing } = event.data.metadata as { orgId: string; plan: string; billing: string };
    if (!orgId || !plan) return NextResponse.json({ ok: true });

    const days = billing === "annual" ? 365 : 30;
    const planExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await prisma.organization.update({
      where: { id: orgId },
      data: { plan, planExpiresAt },
    });
  }

  return NextResponse.json({ ok: true });
}
