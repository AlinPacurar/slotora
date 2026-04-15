export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      name: user.name,
      email: user.email,
      emailNotifications: user.emailNotifications,
      plan: user.plan,
    });

    return NextResponse.json({
      name: user.name,
      email: user.email,
      emailNotifications: user.emailNotifications,
      plan: user.plan,
    });

    return NextResponse.json({
      name: user.name,
      email: user.email,
      emailNotifications: user.emailNotifications,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const { name, emailNotifications } = await request.json();

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        ...(name && { name }),
        ...(typeof emailNotifications === "boolean" && { emailNotifications }),
      },
    });

    return NextResponse.json({
      name: user.name,
      emailNotifications: user.emailNotifications,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}