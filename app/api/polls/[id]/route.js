export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendVoteNotification } from "@/lib/email";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const poll = await prisma.poll.findUnique({ where: { id } });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // Check if the requester is the poll owner
    const session = await auth();
    const isOwner = session?.user?.email && poll.userId
      ? (await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } }))?.id === poll.userId
      : false;

    // Check hasVoted via cookie
    const cookieHeader = request.headers.get("cookie") || "";
    const hasVoted = cookieHeader.split(";").map(c => c.trim()).some(c => c.startsWith(`voted_${id}=`));

    // Strip private comments for non-owners
    if (!isOwner && poll.comments && typeof poll.comments === "object") {
      const filteredComments = Object.fromEntries(
        Object.entries(poll.comments).filter(([, data]) =>
          typeof data === "object" ? !data.private : true
        )
      );
      return NextResponse.json({ ...poll, comments: filteredComments, hasVoted });
    }

    return NextResponse.json({ ...poll, hasVoted });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      voterName, votes, comment, commentPrivate,
      participantEmail, participantPhone, deviceId,
      allowOverwrite, // true when user clicked "Changed your mind?"
    } = body;

    if (!voterName || !votes) {
      return NextResponse.json({ error: "Missing voterName or votes" }, { status: 400 });
    }

    const poll = await prisma.poll.findUnique({ where: { id } });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    if (poll.closed) {
      return NextResponse.json({ error: "Poll is closed" }, { status: 400 });
    }

    // ── Resolve existing stored data ───────────────────────────────────────
    const currentVotes = (poll.votes && typeof poll.votes === "object") ? poll.votes : {};
    const currentIpVotes = (poll.ipVotes && typeof poll.ipVotes === "object") ? poll.ipVotes : {};
    const currentDeviceVotes = (poll.deviceVotes && typeof poll.deviceVotes === "object") ? poll.deviceVotes : {};

    // ── Duplicate checks — skipped if allowOverwrite ───────────────────────
    if (!allowOverwrite) {

      // 1. Cookie check
      const cookieHeader = request.headers.get("cookie") || "";
      const hasCookie = cookieHeader.split(";").map(c => c.trim()).some(c => c.startsWith(`voted_${id}=`));
      if (hasCookie) {
        return NextResponse.json(
          { error: "duplicate_cookie", message: "You have already voted on this poll." },
          { status: 409 }
        );
      }

      // 2. Name check (case-insensitive, trimmed)
      const normalisedName = voterName.trim().toLowerCase();
      const nameExists = Object.keys(currentVotes).some(
        existing => existing.trim().toLowerCase() === normalisedName
      );
      if (nameExists) {
        return NextResponse.json(
          { error: "duplicate_name", message: `"${voterName}" has already voted on this poll.` },
          { status: 409 }
        );
      }

      // 3. IP check
      const forwarded = request.headers.get("x-forwarded-for");
      const ip = forwarded
        ? forwarded.split(",")[0].trim()
        : (request.headers.get("x-real-ip") || "unknown").trim();

      if (ip !== "unknown" && currentIpVotes[ip] !== undefined) {
        return NextResponse.json(
          { error: "duplicate_ip", message: "A vote has already been submitted from your network." },
          { status: 409 }
        );
      }

      // 4. Device fingerprint check
      if (deviceId && currentDeviceVotes[deviceId] !== undefined) {
        return NextResponse.json(
          { error: "duplicate_device", message: "A vote has already been submitted from your device." },
          { status: 409 }
        );
      }
    }

    // ── IP for storage (resolved regardless of overwrite) ─────────────────
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded
      ? forwarded.split(",")[0].trim()
      : (request.headers.get("x-real-ip") || "unknown").trim();

    // ── Build updated data ─────────────────────────────────────────────────
    const updatedVotes = {
      ...currentVotes,
      [voterName]: {
        ...votes,
        ...(participantEmail && { _email: participantEmail }),
        ...(participantPhone && { _phone: participantPhone }),
      },
    };

    const updatedIpVotes = { ...currentIpVotes, [ip]: voterName };
    const updatedDeviceVotes = deviceId
      ? { ...currentDeviceVotes, [deviceId]: voterName }
      : currentDeviceVotes;

    const currentComments = (poll.comments && typeof poll.comments === "object") ? poll.comments : {};
    const updatedComments = comment && comment.trim()
      ? {
        ...currentComments,
        [voterName]: {
          text: comment.trim(),
          createdAt: new Date().toISOString(),
          private: commentPrivate === true,
        },
      }
      : currentComments;

    // ── Persist ────────────────────────────────────────────────────────────
    const updatedPoll = await prisma.poll.update({
      where: { id },
      data: {
        votes: updatedVotes,
        ipVotes: updatedIpVotes,
        deviceVotes: updatedDeviceVotes,
        comments: updatedComments,
      },
    });

    // ── Email notification ─────────────────────────────────────────────────
    if (poll.userId && !allowOverwrite) {
      try {
        const creator = await prisma.user.findUnique({ where: { id: poll.userId } });
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

    // ── Set voted cookie ───────────────────────────────────────────────────
    const isProduction = process.env.NODE_ENV === "production";
    const response = NextResponse.json(updatedPoll);
    response.headers.set(
      "Set-Cookie",
      `voted_${id}=1; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${isProduction ? "; Secure" : ""}`
    );

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}