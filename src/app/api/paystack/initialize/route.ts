import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS, effectivePlan } from "@/lib/plans";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "employee") return NextResponse.json({ error: "Only admins can upgrade." }, { status: 403 });

  const { plan, billing } = await req.json() as { plan: "growth" | "business"; billing: "monthly" | "annual" };

  if (!["growth", "business"].includes(plan)) return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  if (!["monthly", "annual"].includes(billing)) return NextResponse.json({ error: "Invalid billing." }, { status: 400 });

  const org = await prisma.organization.findUnique({ where: { id: session.orgId } });
  if (!org) return NextResponse.json({ error: "Organization not found." }, { status: 404 });

  const current = effectivePlan(org.plan, org.planExpiresAt);
  if (current === plan) return NextResponse.json({ error: `You're already on the ${plan} plan.` }, { status: 400 });

  const planData = PLANS[plan];
  const amountNGN = billing === "annual" ? planData.annualPrice : planData.monthlyPrice;
  const amountKobo = amountNGN * 100;

  const origin = new URL(req.url).origin;
  const callbackUrl = `${origin}/api/paystack/verify`;

  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: session.email,
      amount: amountKobo,
      currency: "NGN",
      callback_url: callbackUrl,
      metadata: {
        orgId: session.orgId,
        userId: session.userId,
        plan,
        billing,
        custom_fields: [
          { display_name: "Organization", variable_name: "org_name", value: org.name },
          { display_name: "Plan", variable_name: "plan", value: `${planData.label} (${billing})` },
        ],
      },
    }),
  });

  const result = await paystackRes.json();
  if (!result.status) return NextResponse.json({ error: result.message || "Payment init failed." }, { status: 502 });

  return NextResponse.json({ authorizationUrl: result.data.authorization_url, reference: result.data.reference });
}
