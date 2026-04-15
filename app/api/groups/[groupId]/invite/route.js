// app/api/groups/[groupId]/invite/route.js
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assignableRoles, roleRank } from "@/lib/teamRoles";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function getActorRole(groupId, userId) {
    const member = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId } },
    });
    return member?.role ?? null;
}

export async function POST(req, { params }) {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId } = params;
    const actorId = session.user.id;
    const actorRole = await getActorRole(groupId, actorId);

    if (!actorRole || roleRank(actorRole) > roleRank("manager")) {
        return Response.json({ error: "Only managers, admins, or owners can invite members" }, { status: 403 });
    }

    const { email, role = "member" } = await req.json();
    if (!email?.includes("@")) return Response.json({ error: "Invalid email" }, { status: 400 });

    // Check actor can assign this role
    if (!assignableRoles(actorRole).includes(role)) {
        return Response.json({ error: "You cannot invite someone with this role" }, { status: 403 });
    }

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return Response.json({ error: "Group not found" }, { status: 404 });

    // Check if already a member
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        const existing = await prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId: existingUser.id } },
        });
        if (existing) return Response.json({ error: "This person is already a member" }, { status: 409 });
    }

    // Create/refresh invite token (24h expiry)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const invite = await prisma.groupInvite.upsert({
        where: { token: (await prisma.groupInvite.findFirst({ where: { groupId, email } }))?.token ?? "__none__" },
        create: { groupId, email, role, invitedBy: actorId, expiresAt },
        update: { role, invitedBy: actorId, expiresAt, usedAt: null, token: undefined },
    });

    const inviteUrl = `${process.env.NEXTAUTH_URL}/invite/${invite.token}`;
    const inviterName = session.user.name ?? "Someone";

    try {
        await resend.emails.send({
            from: "hello@slotora.app",
            to: email,
            subject: `You've been invited to join "${group.name}" on Slotora`,
            html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
          <img src="https://slotora.app/logo.svg" width="36" style="border-radius:10px;margin-bottom:24px;" />
          <h2 style="font-size:20px;font-weight:700;color:#0c4a6e;margin:0 0 8px;">You're invited!</h2>
          <p style="color:#57534e;font-size:15px;line-height:1.6;margin:0 0 24px;">
            <strong>${inviterName}</strong> has invited you to join <strong>${group.name}</strong> on Slotora as a <strong>${role}</strong>.
          </p>
          <a href="${inviteUrl}" style="display:inline-block;background:#0ea5e9;color:#fff;font-weight:700;font-size:15px;padding:12px 28px;border-radius:12px;text-decoration:none;">
            Accept Invitation
          </a>
          <p style="color:#a8a29e;font-size:12px;margin-top:28px;">
            This invite expires in 24 hours. If you weren't expecting this, you can ignore it.
          </p>
        </div>
      `,
        });
    } catch (e) {
        console.error("Invite email failed:", e);
        // Don't block — invite token still created
    }

    return Response.json({ success: true, inviteUrl });
}
