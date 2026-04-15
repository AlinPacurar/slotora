// lib/planUtils.js
// Central helpers for plan access. Always use getActivePlan() instead of
// reading user.plan directly — this respects planExpiresAt.

const PLAN_HIERARCHY = ["community", "snap", "ora"];

/**
 * Returns the user's currently active plan, respecting expiry.
 * If planExpiresAt is set and in the past, returns "community".
 */
export function getActivePlan(user) {
    if (!user) return "community";

    // Stripe subscribers with no expiry field set (legacy) — trust plan as-is
    if (user.stripeSubscriptionId && !user.planExpiresAt) {
        return user.plan ?? "community";
    }

    // If plan has an expiry and it has passed, downgrade to community
    if (user.planExpiresAt && new Date(user.planExpiresAt) < new Date()) {
        return "community";
    }

    return user.plan ?? "community";
}

/**
 * Returns true if the user's active plan meets or exceeds the required plan.
 * Usage: isPlanActive(user, "snap") → true for snap and ora users
 */
export function isPlanActive(user, requiredPlan) {
    const active = getActivePlan(user);
    return PLAN_HIERARCHY.indexOf(active) >= PLAN_HIERARCHY.indexOf(requiredPlan);
}

/**
 * Returns a human-readable label for the active plan.
 */
export function planLabel(user) {
    const plan = getActivePlan(user);
    if (!plan || plan === "community") return "Community";
    return plan.charAt(0).toUpperCase() + plan.slice(1);
}

/**
 * Returns days remaining on a non-community plan, or null if no expiry.
 * Useful for showing "expires in X days" warnings.
 */
export function daysUntilExpiry(user) {
    if (!user?.planExpiresAt) return null;
    const diff = new Date(user.planExpiresAt) - new Date();
    if (diff <= 0) return 0;
    return Math.ceil(diff / 86400000);
}