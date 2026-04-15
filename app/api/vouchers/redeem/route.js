// app/api/vouchers/redeem/route.js
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req) {
    const session = await auth();
    if (!session?.user?.id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code?.trim()) {
        return Response.json({ error: "No voucher code provided." }, { status: 400 });
    }

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

    const alreadyUsed = voucher.redemptions.some(r => r.userId === session.user.id);
    if (alreadyUsed) {
        return Response.json({ error: "You've already redeemed this voucher." }, { status: 409 });
    }

    // Extend from current expiry if user already has time remaining, otherwise from now
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { planExpiresAt: true, plan: true },
    });

    const baseDate =
        user.planExpiresAt && new Date(user.planExpiresAt) > new Date()
            ? new Date(user.planExpiresAt)
            : new Date();

    const newExpiry = new Date(baseDate.getTime() + voucher.durationDays * 86400000);

    await prisma.$transaction([
        prisma.user.update({
            where: { id: session.user.id },
            data: { plan: voucher.plan, planExpiresAt: newExpiry },
        }),
        prisma.voucherRedemption.create({
            data: { voucherId: voucher.id, userId: session.user.id },
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
