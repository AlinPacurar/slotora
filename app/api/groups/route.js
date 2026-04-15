// app/api/groups/route.js
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { planCanCreateGroup, planGroupLimit } from "@/lib/teamRoles";
import { getActivePlan } from "@/lib/planUtils";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;

    // Groups user owns
    const ownedGroups = await prisma.group.findMany({
        where: { ownerId: userId },
        include: {
            members: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
        orderBy: { createdAt: "desc" },
    });

    // Groups user is a member of (not owner)
    const memberGroups = await prisma.groupMember.findMany({
        where: { userId, group: { ownerId: { not: userId } } },
        include: {
            group: {
                include: {
                    members: { include: { user: { select: { id: true, name: true, email: true } } } },
                },
            },
        },
        orderBy: { joinedAt: "desc" },
    });

    return Response.json({
        owned: ownedGroups,
        member: memberGroups.map((gm) => ({ ...gm.group, myRole: gm.role })),
    });
}

export async function POST(req) {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const plan = getActivePlan(user);

    if (!planCanCreateGroup(plan)) {
        return Response.json(
            { error: "Your plan does not allow creating groups. Upgrade to Snap or Ora." },
            { status: 403 }
        );
    }

    const limit = planGroupLimit(plan);
    const existingCount = await prisma.group.count({ where: { ownerId: userId } });

    if (existingCount >= limit) {
        return Response.json(
            { error: `You've reached your group limit (${limit}). Upgrade to create more.` },
            { status: 403 }
        );
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name?.trim()) return Response.json({ error: "Group name is required." }, { status: 400 });

    const group = await prisma.group.create({
        data: {
            name: name.trim(),
            description: description?.trim() || null,
            ownerId: userId,
            members: {
                create: { userId, role: "owner" },
            },
        },
        include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });

    return Response.json(group, { status: 201 });
}
