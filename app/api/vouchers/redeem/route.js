// app/api/vouchers/redeem/route.js
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req) {
    const session = await auth();

    // Support both id and email lookup — belt and braces
    if (!session?.user?.id && !session?.user?.email) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code?.trim()) {
        return Response.json({ error: "No voucher code provided." }, { status: 400 });
    }

    // Look up user by id first, fall back to email
    const user = await prisma.user.findUnique({
        where: session.user.id
            ? { id: session.user.id }
            : { email: session.user.email },
        select: { id: true, planExpiresAt: true, plan: true },
    });

    if (!user) {
        return Response.json({ error: "User not found." }, { status: 404 });
    }

    const userId = user.id;

    const voucher = await prisma.voucher.findUnique({
        where: { code: code.trim().toUpperCase() },
        include: { redemptions: true },
    });

    if (!voucher) {
        return Response.json({ error: "Invalid voucher code." }, { status: 404 });
    }
    if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) {
        return Response.json({ error: "This voucher has expired." }, { status: 410 });
    }
    if (voucher.usedCount >= voucher.maxUses) {
        return Response.json({ error: "This voucher has already been fully redeemed." }, { status: 409 });
    }

    const alreadyUsed = voucher.redemptions.some(r => r.userId === userId);
    if (alreadyUsed) {
        return Response.json({ error: "You've already redeemed this voucher." }, { status: 409 });
    }

    // Extend from current expiry if user already has time remaining, otherwise from now
    const baseDate =
        user.planExpiresAt && new Date(user.planExpiresAt) > new Date()
            ? new Date(user.planExpiresAt)
            : new Date();

    const newExpiry = new Date(baseDate.getTime() + voucher.durationDays * 86400000);

    await prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: { plan: voucher.plan, planExpiresAt: newExpiry },
        }),
        prisma.voucherRedemption.create({
            data: { voucherId: voucher.id, userId },
        }),
        prisma.voucher.update({
            where: { id: voucher.id },
            data: { usedCount: { increment: 1 } },
        }),
    ]);

    return Response.json({
        success: true,
        plan: voucher.plan,
        expiresAt: newExpiry,
        durationDays: voucher.durationDays,
        message: `${voucher.durationDays} days of ${voucher.plan.charAt(0).toUpperCase() + voucher.plan.slice(1)} activated!`,
    });
}