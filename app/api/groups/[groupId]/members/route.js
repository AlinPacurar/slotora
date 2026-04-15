// app/api/groups/[groupId]/members/route.js
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManage, assignableRoles, roleRank } from "@/lib/teamRoles";

async function getActorRole(groupId, userId) {
    const member = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId } },
    });
    return member?.role ?? null;
}

// PATCH /api/groups/[groupId]/members  — change a member's role
export async function PATCH(req, { params }) {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId } = params;
    const actorId = session.user.id;
    const actorRole = await getActorRole(groupId, actorId);
    if (!actorRole) return Response.json({ error: "Not a member" }, { status: 403 });

    const { userId: targetId, role: newRole } = await req.json();
    if (!targetId || !newRole) return Response.json({ error: "Missing userId or role" }, { status: 400 });

    // Actor cannot change their own role
    if (targetId === actorId) return Response.json({ error: "Cannot change your own role" }, { status: 403 });

    const targetMember = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: targetId } },
    });
    if (!targetMember) return Response.json({ error: "Member not found" }, { status: 404 });

    const currentTargetRole = targetMember.role;

    // Protect owner: no one can change the owner's role
    if (!canManage(actorRole, currentTargetRole)) {
        return Response.json({ error: "You cannot change this member's role" }, { status: 403 });
    }

    // Actor can only assign roles strictly below their own
    if (!assignableRoles(actorRole).includes(newRole)) {
        return Response.json({ error: "You cannot assign this role" }, { status: 403 });
    }

    const updated = await prisma.groupMember.update({
        where: { groupId_userId: { groupId, userId: targetId } },
        data: { role: newRole },
        include: { user: { select: { id: true, name: true, email: true } } },
    });

    return Response.json(updated);
}

// DELETE /api/groups/[groupId]/members  — remove a member
export async function DELETE(req, { params }) {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId } = params;
    const actorId = session.user.id;
    const actorRole = await getActorRole(groupId, actorId);
    if (!actorRole) return Response.json({ error: "Not a member" }, { status: 403 });

    const { userId: targetId } = await req.json();

    // Allow self-removal (leave group) — but not if owner
    if (targetId === actorId) {
        if (actorRole === "owner") {
            // Check if there's another owner
            const otherOwners = await prisma.groupMember.count({
                where: { groupId, role: "owner", userId: { not: actorId } },
            });
            if (otherOwners === 0) {
                return Response.json({ error: "You are the last owner. Transfer ownership before leaving." }, { status: 403 });
            }
        }
        await prisma.groupMember.delete({ where: { groupId_userId: { groupId, userId: targetId } } });
        return Response.json({ success: true });
    }

    const targetMember = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: targetId } },
    });
    if (!targetMember) return Response.json({ error: "Member not found" }, { status: 404 });

    if (!canManage(actorRole, targetMember.role)) {
        return Response.json({ error: "You cannot remove this member" }, { status: 403 });
    }

    await prisma.groupMember.delete({ where: { groupId_userId: { groupId, userId: targetId } } });
    return Response.json({ success: true });
}
