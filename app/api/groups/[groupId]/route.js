// app/api/groups/[groupId]/route.js
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManage, roleRank } from "@/lib/teamRoles";

async function getActorRole(groupId, userId) {
    const member = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId } },
    });
    return member?.role ?? null;
}

export async function GET(_, { params }) {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId } = params;
    const actorRole = await getActorRole(groupId, session.user.id);
    if (!actorRole) return Response.json({ error: "Not a member" }, { status: 403 });

    const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
            members: {
                include: { user: { select: { id: true, name: true, email: true } } },
                orderBy: { joinedAt: "asc" },
            },
        },
    });

    if (!group) return Response.json({ error: "Group not found" }, { status: 404 });

    return Response.json({ ...group, myRole: actorRole });
}

export async function PATCH(req, { params }) {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId } = params;
    const actorRole = await getActorRole(groupId, session.user.id);
    if (!actorRole || roleRank(actorRole) > roleRank("admin")) {
        return Response.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { name, description } = await req.json();
    const group = await prisma.group.update({
        where: { id: groupId },
        data: { name: name?.trim(), description: description?.trim() ?? null },
    });

    return Response.json(group);
}

export async function DELETE(_, { params }) {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId } = params;
    const actorRole = await getActorRole(groupId, session.user.id);
    if (actorRole !== "owner") return Response.json({ error: "Only the owner can delete a group" }, { status: 403 });

    await prisma.group.delete({ where: { id: groupId } });
    return Response.json({ success: true });
}
