// app/api/groups/[groupId]/members/[memberId]/route.js
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManage, roleRank } from "@/lib/teamRoles";

async function getActorRole(groupId, userId) {
    const m = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId } },
    });
    return m?.role ?? null;
}

export async function PATCH(req, { params }) {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId, memberId } = params;
    const actorRole = await getActorRole(groupId, session.user.id);
    if (!actorRole) return Response.json({ error: "Not a member" }, { status: 403 });

    const body = await req.json();
    const member = await prisma.groupMember.findUnique({ where: { id: memberId } });
    if (!member) return Response.json({ error: "Member not found" }, { status: 404 });

    // Approving a pending member (status change)
    if (body.status === "active") {
        if (roleRank(actorRole) > roleRank("admin")) {
            return Response.json({ error: "Insufficient permissions" }, { status: 403 });
        }
        const updated = await prisma.groupMember.update({
            where: { id: memberId },
            data: { status: "active" },
        });
        return Response.json(updated);
    }

    // Role change
    if (body.role) {
        if (!canManage(actorRole, member.role)) {
            return Response.json({ error: "Insufficient permissions" }, { status: 403 });
        }
        const updated = await prisma.groupMember.update({
            where: { id: memberId },
            data: { role: body.role },
        });
        return Response.json(updated);
    }

    return Response.json({ error: "Nothing to update" }, { status: 400 });
}

export async function DELETE(_, { params }) {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId, memberId } = params;
    const actorRole = await getActorRole(groupId, session.user.id);
    if (!actorRole) return Response.json({ error: "Not a member" }, { status: 403 });

    const member = await prisma.groupMember.findUnique({ where: { id: memberId } });
    if (!member) return Response.json({ error: "Member not found" }, { status: 404 });

    // Allow self-removal or admin/owner removing others
    const isSelf = member.userId === session.user.id;
    if (!isSelf && !canManage(actorRole, member.role)) {
        return Response.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    await prisma.groupMember.delete({ where: { id: memberId } });
    return Response.json({ success: true });
}