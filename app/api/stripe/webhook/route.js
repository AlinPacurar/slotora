export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Map Stripe price IDs back to plan names
const PRICE_TO_PLAN = {
  [process.env.STRIPE_SLOT_MONTHLY]: "slot",
  [process.env.STRIPE_SLOT_YEARLY]: "slot",
  [process.env.STRIPE_SNAP_MONTHLY]: "snap",
  [process.env.STRIPE_SNAP_YEARLY]: "snap",
  [process.env.STRIPE_ORA_MONTHLY]: "ora",
  [process.env.STRIPE_ORA_YEARLY]: "ora",
};

async function getUserIdFromCustomer(customerId) {
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  return user?.id || null;
}

async function getPlanFromSubscription(subscription) {
  // Prefer metadata on the subscription (set at checkout)
  if (subscription.metadata?.plan) return subscription.metadata.plan;
  // Fall back to resolving from price ID (handles portal plan changes)
  const priceId = subscription.items?.data?.[0]?.price?.id;
  return priceId ? (PRICE_TO_PLAN[priceId] || null) : null;
}

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {

      // ── New subscription created via Checkout ──────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object;
        const { userId, plan } = session.metadata;
        if (userId && plan) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan,
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
            },
          });
          console.log(`[webhook] checkout.session.completed: user ${userId} → ${plan}`);
        }
        break;
      }

      // ── Subscription changed (upgrade, downgrade, cancel scheduled, grace period) ──
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId || await getUserIdFromCustomer(subscription.customer);
        if (!userId) break;

        const { status, cancel_at_period_end } = subscription;

        if (status === "active" && !cancel_at_period_end) {
          // Normal active subscription — sync plan (handles portal upgrades/downgrades)
          const plan = await getPlanFromSubscription(subscription);
          if (plan) {
            await prisma.user.update({
              where: { id: userId },
              data: { plan, stripeSubscriptionId: subscription.id },
            });
            console.log(`[webhook] subscription.updated: user ${userId} → ${plan}`);
          }
        } else if (cancel_at_period_end) {
          // User cancelled — keep plan active until period ends (grace period)
          // No DB change; access continues until subscription.deleted fires
          console.log(`[webhook] subscription.updated: user ${userId} cancel scheduled at period end — keeping plan active`);
        } else if (status === "past_due" || status === "unpaid") {
          // Payment failed — downgrade to community immediately
          await prisma.user.update({
            where: { id: userId },
            data: { plan: "community" },
          });
          console.log(`[webhook] subscription.updated: user ${userId} ${status} → community`);
        } else if (status === "canceled") {
          // Handled below in subscription.deleted, but catch here too
          await prisma.user.update({
            where: { id: userId },
            data: { plan: "community", stripeSubscriptionId: null },
          });
          console.log(`[webhook] subscription.updated: user ${userId} canceled → community`);
        }
        break;
      }

      // ── Subscription fully ended (grace period over, or immediate cancel) ──
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId || await getUserIdFromCustomer(subscription.customer);
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { plan: "community", stripeSubscriptionId: null },
          });
          console.log(`[webhook] subscription.deleted: user ${userId} → community`);
        }
        break;
      }

      // ── Payment failed (invoice) — grace period warning ─────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const userId = await getUserIdFromCustomer(invoice.customer);
        // Log for now; the subscription.updated with past_due handles the downgrade.
        // This is a good place to send a "payment failed" email in future.
        console.log(`[webhook] invoice.payment_failed: customer ${invoice.customer} (userId: ${userId})`);
        break;
      }

      // ── Refund issued ────────────────────────────────────────────────────
      case "charge.refunded": {
        const charge = event.data.object;
        // Full refund: downgrade immediately
        if (charge.refunded && charge.amount_refunded === charge.amount) {
          const userId = await getUserIdFromCustomer(charge.customer);
          if (userId) {
            await prisma.user.update({
              where: { id: userId },
              data: { plan: "community", stripeSubscriptionId: null },
            });
            console.log(`[webhook] charge.refunded (full): user ${userId} → community`);
          }
        } else {
          // Partial refund — log only, no plan change
          console.log(`[webhook] charge.refunded (partial): customer ${charge.customer}`);
        }
        break;
      }

    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}