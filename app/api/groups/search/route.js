// app/api/groups/search/route.js
// GET ?q=football  — search public groups by name or slug

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim()
    if (!q || q.length < 2) return NextResponse.json([])

    const groups = await prisma.group.findMany({
        where: {
            isPublic: true,
            OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { slug: { contains: q, mode: 'insensitive' } },
            ],
            // Exclude groups the user already belongs to
            NOT: {
                members: { some: { userId: session.user.id, status: 'active' } },
            },
        },
        select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            avatarUrl: true,
            isPublic: true,
            joinPolicy: true,
            _count: { select: { members: { where: { status: 'active' } } } },
        },
        take: 10,
    })

    return NextResponse.json(groups)
}