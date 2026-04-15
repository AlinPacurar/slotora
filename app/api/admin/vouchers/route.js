// app/api/admin/vouchers/route.js
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ADMIN_EMAILS = ["alinpacurar@slotora.app"];

function generateCode(length = 10) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from(
        { length },
        () => chars[Math.floor(Math.random() * chars.length)]
    ).join("");
}

// POST — create a new voucher
export async function POST(req) {
    const session = await auth();
    if (!ADMIN_EMAILS.includes(session?.user?.email)) {
        return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { plan, durationDays, maxUses = 1, expiresInDays } = await req.json();

    if (!["slot", "snap", "ora"].includes(plan)) {
        return Response.json({ error: "Invalid plan." }, { status: 400 });
    }
    if (!durationDays || durationDays < 1) {
        return Response.json({ error: "durationDays must be at least 1." }, { status: 400 });
    }

    const code = generateCode();
    const expiresAt = expiresInDays
        ? new Date(Date.now() + Number(expiresInDays) * 86400000)
        : null;

    const voucher = await prisma.voucher.create({
        data: { code, plan, durationDays: Number(durationDays), maxUses: Number(maxUses), createdBy: session.user.email, expiresAt },
    });

    return Response.json(voucher, { status: 201 });
}

// GET — list all vouchers
export async function GET() {
    const session = await auth();
    if (!ADMIN_EMAILS.includes(session?.user?.email)) {
        return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const vouchers = await prisma.voucher.findMany({
        include: {
            _count: { select: { redemptions: true } },
            redemptions: {
                include: { user: { select: { email: true, name: true } } },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return Response.json(vouchers);
}

// DELETE — delete a voucher by id (?id=xxx)
export async function DELETE(req) {
    const session = await auth();
    if (!ADMIN_EMAILS.includes(session?.user?.email)) {
        return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

    await prisma.voucher.delete({ where: { id } });
    return Response.json({ success: true });
}