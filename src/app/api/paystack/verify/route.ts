import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference");
  if (!reference) return NextResponse.redirect(new URL("/pricing?error=missing_ref", req.url));

  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  });

  const result = await verifyRes.json();
  if (!result.status || result.data.status !== "success") {
    return NextResponse.redirect(new URL("/pricing?error=payment_failed", req.url));
  }

  const { orgId, plan, billing } = result.data.metadata as { orgId: string; plan: string; billing: string };
  const days = billing === "annual" ? 365 : 30;
  const planExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await prisma.organization.update({
    where: { id: orgId },
    data: { plan, planExpiresAt },
  });

  return NextResponse.redirect(new URL("/dashboard?upgraded=1", req.url));
}
