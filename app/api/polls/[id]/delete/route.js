export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const poll = await prisma.poll.findUnique({
      where: { id },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    if (poll.userId && poll.userId !== user.id) {
      return NextResponse.json({ error: "You don't own this poll" }, { status: 403 });
    }

    // Soft delete — set deletedAt instead of removing
    const updated = await prisma.poll.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const poll = await prisma.poll.findUnique({
      where: { id },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    if (poll.userId && poll.userId !== user.id) {
      return NextResponse.json({ error: "You don't own this poll" }, { status: 403 });
    }

    if (body.action === "restore") {
      // Restore from bin
      const updated = await prisma.poll.update({
        where: { id },
        data: { deletedAt: null },
      });
      return NextResponse.json(updated);
    }

    if (body.action === "permanent") {
      // Permanent delete
      await prisma.poll.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}