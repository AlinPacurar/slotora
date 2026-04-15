// app/api/invite/[token]/route.js
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GROUP_LIMITS } from "@/lib/teamRoles";
import { getActivePlan } from "@/lib/planUtils";

export async function POST(_, { params }) {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { token } = params;
    const userId = session.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const plan = getActivePlan(user);

    const invite = await prisma.groupInvite.findUnique({ where: { token } });
    if (!invite) return Response.json({ error: "Invalid invite link" }, { status: 404 });
    if (invite.usedAt) return Response.json({ error: "This invite has already been used" }, { status: 409 });
    if (new Date() > invite.expiresAt) return Response.json({ error: "This invite has expired" }, { status: 410 });

    // Check if already a member
    const existing = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: invite.groupId, userId } },
    });
    if (existing) return Response.json({ error: "You are already a member of this group" }, { status: 409 });

    // Community plan: can only be in 1 group
    if (plan === "community") {
        const currentMemberships = await prisma.groupMember.count({ where: { userId } });
        if (currentMemberships >= 1) {
            return Response.json(
                { error: "Community plan members can only join 1 group. Upgrade to join more." },
                { status: 403 }
            );
        }
    }

    // Add member
    await prisma.$transaction([
        prisma.groupMember.create({
            data: { groupId: invite.groupId, userId, role: invite.role },
        }),
        prisma.groupInvite.update({
            where: { token },
            data: { usedAt: new Date() },
        }),
    ]);

    return Response.json({ success: true, groupId: invite.groupId });
}
