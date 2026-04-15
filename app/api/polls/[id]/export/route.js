export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getActivePlan } from "@/lib/planUtils";

export async function GET(request, { params }) {
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

    // Check plan — CSV export is Slot+ only
    const allowedPlans = ["slot", "snap", "ora"];
    if (!allowedPlans.includes(getActivePlan(user))) {
      return NextResponse.json(
        { error: "CSV export is available on Slot, Snap and Ora plans" },
        { status: 403 }
      );
    }

    const poll = await prisma.poll.findUnique({ where: { id } });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    if (poll.userId !== user.id) {
      return NextResponse.json({ error: "You don't own this poll" }, { status: 403 });
    }

    // Build CSV
    const dates = poll.dates;
    const votes = poll.votes || {};
    const comments = poll.comments || {};

    // Header row
    const headers = ["Participant", ...dates, "Comment"];
    const rows = [headers];

    // Data rows
    Object.entries(votes).forEach(([name, dateVotes]) => {
      const row = [
        name,
        ...dates.map(d => dateVotes[d] || "no response"),
        typeof comments[name] === "object"
          ? comments[name]?.text || ""
          : comments[name] || "",
      ];
      rows.push(row);
    });

    // Summary row
    const yesCounts = dates.map(d => {
      return Object.values(votes).filter(v => v[d] === "yes").length;
    });
    rows.push([]);
    rows.push(["Yes count", ...yesCounts, ""]);

    const maybeCounts = dates.map(d => {
      return Object.values(votes).filter(v => v[d] === "maybe").length;
    });
    rows.push(["Maybe count", ...maybeCounts, ""]);

    // Convert to CSV string
    const csv = rows
      .map(row =>
        row.map(cell => {
          const str = String(cell ?? "");
          // Escape cells that contain commas, quotes or newlines
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(",")
      )
      .join("\n");

    const filename = `${poll.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-results.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}