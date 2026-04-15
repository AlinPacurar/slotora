export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendVoteNotification } from "@/lib/email";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const poll = await prisma.poll.findUnique({
      where: { id },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // Check if the requester is the poll owner
    const session = await auth();
    const isOwner = session?.user?.email && poll.userId
      ? (await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } }))?.id === poll.userId
      : false;

    // Strip private comments for non-owners
    if (!isOwner && poll.comments && typeof poll.comments === "object") {
      const filteredComments = Object.fromEntries(
        Object.entries(poll.comments).filter(([, data]) =>
          typeof data === "object" ? !data.private : true
        )
      );
      return NextResponse.json({ ...poll, comments: filteredComments });
    }

    return NextResponse.json(poll);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { voterName, votes, comment, commentPrivate, participantEmail, participantPhone } = body;

    if (!voterName || !votes) {
      return NextResponse.json({ error: "Missing voterName or votes" }, { status: 400 });
    }

    const poll = await prisma.poll.findUnique({
      where: { id },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    if (poll.closed) {
      return NextResponse.json({ error: "Poll is closed" }, { status: 400 });
    }

    // Update votes
    const currentVotes = (poll.votes && typeof poll.votes === "object") ? poll.votes : {};
    const updatedVotes = {
      ...currentVotes,
      [voterName]: {
        ...votes,
        ...(participantEmail && { _email: participantEmail }),
        ...(participantPhone && { _phone: participantPhone }),
      },
    };

    // Update comments — only add if comment is not empty
    const currentComments = (poll.comments && typeof poll.comments === "object") ? poll.comments : {};
    const updatedComments = comment && comment.trim()
      ? {
        ...currentComments,
        [voterName]: {
          text: comment.trim(),
          createdAt: new Date().toISOString(),
          private: commentPrivate === true,
        }
      }
      : currentComments;

    const updatedPoll = await prisma.poll.update({
      where: { id },
      data: {
        votes: updatedVotes,
        comments: updatedComments,
      },
    });

    // Send email notification to poll creator
    if (poll.userId) {
      try {
        const creator = await prisma.user.findUnique({
          where: { id: poll.userId },
        });
        if (creator?.email && creator?.emailNotifications !== false) {
          await sendVoteNotification({
            pollTitle: poll.title,
            pollId: id,
            voterName,
            creatorEmail: creator.email,
            creatorName: creator.name,
          });
        }
      } catch (emailError) {
        console.error("Email notification failed:", emailError);
      }
    }

    return NextResponse.json(updatedPoll);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}