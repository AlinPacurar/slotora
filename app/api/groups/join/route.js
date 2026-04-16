// app/api/groups/join/route.js
// POST { slug } or { inviteCode }
// Handles open join, join request, and private invite link

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function POST(req) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { slug, inviteCode } = await req.json()
    if (!slug && !inviteCode) {
        return NextResponse.json({ error: 'Provide a slug or inviteCode' }, { status: 400 })
    }

    // Find the group
    const group = await prisma.group.findUnique({
        where: slug ? { slug } : { inviteCode },
    })

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    // If joining by slug, group must be public
    if (slug && !group.isPublic) {
        return NextResponse.json({ error: 'This group is private' }, { status: 403 })
    }

    // Check not already a member
    const existing = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: group.id, userId: session.user.id } },
    })

    if (existing) {
        if (existing.status === 'active') {
            return NextResponse.json({ error: 'Already a member' }, { status: 409 })
        }
        if (existing.status === 'pending') {
            return NextResponse.json({ error: 'Join request already pending' }, { status: 409 })
        }
    }

    // Determine join status based on joinPolicy and how they arrived
    // Invite code bypasses joinPolicy — always grants active membership
    const status = inviteCode
        ? 'active'
        : group.joinPolicy === 'open'
            ? 'active'
            : 'pending' // joinPolicy === 'request'

    const member = await prisma.groupMember.create({
        data: {
            groupId: group.id,
            userId: session.user.id,
            role: 'member',
            status,
        },
    })

    return NextResponse.json({
        member,
        message: status === 'active' ? 'Joined successfully' : 'Join request sent — waiting for organiser approval',
    }, { status: 201 })
}