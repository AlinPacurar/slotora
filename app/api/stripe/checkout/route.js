export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  slot_monthly: process.env.STRIPE_SLOT_MONTHLY,
  slot_yearly: process.env.STRIPE_SLOT_YEARLY,
  snap_monthly: process.env.STRIPE_SNAP_MONTHLY,
  snap_yearly: process.env.STRIPE_SNAP_YEARLY,
  ora_monthly: process.env.STRIPE_ORA_MONTHLY,
  ora_yearly: process.env.STRIPE_ORA_YEARLY,
};

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const { plan, billing } = await request.json();

    if (!plan || !billing) {
      return NextResponse.json({ error: "Missing plan or billing" }, { status: 400 });
    }

    const priceKey = `${plan}_${billing}`;
    const priceId = PRICE_IDS[priceKey];

    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
      customer_email: session.user.email,
      metadata: {
        userId: user.id,
        plan,
        billing,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          plan,
        },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}