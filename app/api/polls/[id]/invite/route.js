export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPollShareInvite } from "@/lib/email";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { emails } = await request.json();

    if (!emails || emails.length === 0) {
      return NextResponse.json({ error: "No emails provided" }, { status: 400 });
    }

    const poll = await prisma.poll.findUnique({ where: { id } });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    const results = await Promise.allSettled(
      emails.map((email) =>
        sendPollShareInvite({
          pollTitle: poll.title,
          pollId: id,
          recipientEmail: email.trim(),
          creatorName: poll.creatorName,
        })
      )
    );

    const sent = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;

    return NextResponse.json({ sent, failed });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}