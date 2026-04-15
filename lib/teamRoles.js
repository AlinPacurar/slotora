// lib/teamRoles.js
// Central source of truth for role hierarchy, labels, and permissions.

export const ROLE_HIERARCHY = ["owner", "admin", "manager", "member", "viewer"];

export const ROLE_META = {
    owner: {
        label: "Owner",
        color: "bg-amber-100 text-amber-700",
        dot: "bg-amber-500",
        description: "Full control. Cannot be removed or demoted.",
    },
    admin: {
        label: "Admin",
        color: "bg-sky-100 text-sky-700",
        dot: "bg-sky-500",
        description: "Manage members, roles, and group settings.",
    },
    manager: {
        label: "Manager",
        color: "bg-violet-100 text-violet-700",
        dot: "bg-violet-500",
        description: "Invite members and manage polls in the group.",
    },
    member: {
        label: "Member",
        color: "bg-emerald-100 text-emerald-700",
        dot: "bg-emerald-500",
        description: "Participate in polls and view group activity.",
    },
    viewer: {
        label: "Viewer",
        color: "bg-stone-100 text-stone-500",
        dot: "bg-stone-400",
        description: "Read-only access to the group.",
    },
};

/**
 * Returns the numeric rank of a role (lower = more powerful).
 * owner = 0, viewer = 4
 */
export function roleRank(role) {
    const idx = ROLE_HIERARCHY.indexOf(role);
    return idx === -1 ? 99 : idx;
}

/**
 * Can `actorRole` manage (change/remove) `targetRole`?
 * Rule: actor must be strictly higher rank (lower index) than target,
 * and actors cannot touch owner.
 */
export function canManage(actorRole, targetRole) {
    if (targetRole === "owner") return false;
    return roleRank(actorRole) < roleRank(targetRole);
}

/**
 * Which roles can `actorRole` assign?
 * Returns all roles strictly below the actor.
 */
export function assignableRoles(actorRole) {
    const rank = roleRank(actorRole);
    return ROLE_HIERARCHY.filter((_, i) => i > rank);
}

// Plan-based group limits
export const GROUP_LIMITS = {
    community: { canCreate: false, canJoin: true, maxJoined: 1 },
    snap: { canCreate: true, maxOwned: 1, canJoin: true },
    ora: { canCreate: true, maxOwned: 3, canJoin: true },
    slot: { canCreate: true, maxOwned: 3, canJoin: true }, // slot = legacy, treat like ora
};

export function planCanCreateGroup(plan) {
    return GROUP_LIMITS[plan]?.canCreate ?? false;
}

export function planGroupLimit(plan) {
    return GROUP_LIMITS[plan]?.maxOwned ?? 0;
}