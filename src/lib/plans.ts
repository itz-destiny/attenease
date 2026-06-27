export const PLANS = {
  free:       { label: "Free",     employees: 5,   locations: 1,        monthlyPrice: 0,     annualPrice: 0 },
  growth:     { label: "Growth",   employees: 50,  locations: Infinity, monthlyPrice: 14900, annualPrice: Math.round(14900 * 12 * 0.8) },
  business:   { label: "Business", employees: 200, locations: Infinity, monthlyPrice: 39900, annualPrice: Math.round(39900 * 12 * 0.8) },
  enterprise: { label: "Enterprise", employees: Infinity, locations: Infinity, monthlyPrice: 0, annualPrice: 0 },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanLimit(plan: string, field: "employees" | "locations"): number {
  return (PLANS[plan as PlanKey] ?? PLANS.free)[field] as number;
}

export function isPlanActive(plan: string, planExpiresAt: Date | null): boolean {
  if (plan === "free" || plan === "enterprise") return true;
  if (!planExpiresAt) return false;
  return new Date(planExpiresAt) > new Date();
}

export function effectivePlan(plan: string, planExpiresAt: Date | null): PlanKey {
  if (isPlanActive(plan, planExpiresAt)) return plan as PlanKey;
  return "free";
}
