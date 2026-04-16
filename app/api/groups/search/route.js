// app/api/groups/search/route.js
// GET ?q=football  — search public groups by name or slug

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function GET(req) {
    const session = await getServerSession(authOptions)
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