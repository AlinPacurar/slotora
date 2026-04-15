export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, description, creatorName, dates, deadline, voteOptions, times } = body;

    if (!title || !creatorName || !dates || dates.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const session = await auth();

    const poll = await prisma.poll.create({
      data: {
        title,
        description: description || "",
        creatorName,
        dates,
        votes: {},
        comments: {},
        voteOptions: voteOptions || [],
        times: times || {},
        collectParticipantData: body.collectParticipantData || false,
        deadline: deadline ? new Date(deadline) : null,
        ...(session?.user?.email && {
          user: {
            connect: { email: session.user.email },
          },
        }),
      },
    });

    return NextResponse.json({ id: poll.id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const polls = await prisma.poll.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(polls);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}