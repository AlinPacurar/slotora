"use client";
// app/dashboard/teams/page.js
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { planCanCreateGroup, planGroupLimit, ROLE_META } from "@/lib/teamRoles";

function Icon({ name, size = 16, cls = "" }) {
    const paths = {
        users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
        plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
        chevronRight: <polyline points="9 18 15 12 9 6" />,
        lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
        crown: <><path d="M2 20h20" /><path d="M4 20V10l8-8 8 8v10" /></>,
        settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
        x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
    };
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={cls}>
            {paths[name]}
        </svg>
    );
}

function RoleChip({ role }) {
    const meta = ROLE_META[role] ?? ROLE_META.member;
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
        </span>
    );
}

function GroupCard({ group, myRole, onClick }) {
    const memberCount = group.members?.length ?? 0;
    return (
        <button onClick={onClick}
            className="w-full text-left bg-white border border-stone-100 rounded-2xl p-5 hover:border-sky-200 hover:shadow-md transition group">
            <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500">
                    <Icon name="users" size={18} />
                </div>
                <div className="flex items-center gap-2">
                    <RoleChip role={myRole ?? "member"} />
                    <Icon name="chevronRight" size={14} cls="text-stone-300 group-hover:text-sky-400 transition" />
                </div>
            </div>
            <div className="font-bold text-stone-900 text-sm mb-1 truncate">{group.name}</div>
            {group.description && (
                <div className="text-xs text-stone-400 line-clamp-2 mb-3">{group.description}</div>
            )}
            <div className="text-[11px] text-stone-400 font-medium">
                {memberCount} member{memberCount !== 1 ? "s" : ""}
            </div>
        </button>
    );
}

export default function TeamsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [data, setData] = useState({ owned: [], member: [] });
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ name: "", description: "" });
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");
    const [userPlan, setUserPlan] = useState("community");

    useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status]);

    useEffect(() => {
        if (!session) return;
        fetch("/api/groups").then(r => r.json()).then(d => { setData(d); setLoading(false); });
        fetch("/api/user/settings").then(r => r.json()).then(d => setUserPlan(d.plan ?? "community"));
    }, [session]);

    const canCreate = planCanCreateGroup(userPlan);
    const limit = planGroupLimit(userPlan);
    const atLimit = data.owned.length >= limit;

    async function handleCreate() {
        if (!createForm.name.trim()) { setCreateError("Group name is required."); return; }
        setCreating(true); setCreateError("");
        const res = await fetch("/api/groups", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(createForm),
        });
        const json = await res.json();
        if (!res.ok) { setCreateError(json.error ?? "Failed to create group."); setCreating(false); return; }
        setData(d => ({ ...d, owned: [json, ...d.owned] }));
        setShowCreate(false);
        setCreateForm({ name: "", description: "" });
        setCreating(false);
        router.push(`/dashboard/teams/${json.id}`);
    }

    if (loading) return (
        <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
        </div>
    );

    const allGroups = [
        ...data.owned.map(g => ({ ...g, myRole: "owner" })),
        ...data.member.map(g => ({ ...g, myRole: g.myRole })),
    ];

    return (
        <div className="max-w-5xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Groups</h1>
                    <p className="text-sm text-stone-400 mt-1">Manage your teams and collaborate on oras.</p>
                </div>
                {canCreate && !atLimit && (
                    <button onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-sm shadow-sky-200">
                        <Icon name="plus" size={14} /> New group
                    </button>
                )}
            </div>

            {/* Plan gate — community */}
            {!canCreate && (
                <div className="bg-sky-50 border border-sky-100 rounded-2xl px-6 py-5 mb-8 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center text-sky-500 flex-shrink-0">
                            <Icon name="lock" size={16} />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-sky-900">Creating groups requires Snap or Ora</div>
                            <div className="text-xs text-sky-500 mt-0.5">You can join groups you're invited to. Upgrade to create your own.</div>
                        </div>
                    </div>
                    <a href="/pricing"
                        className="flex-shrink-0 text-xs font-bold bg-sky-500 text-white px-4 py-2 rounded-xl hover:bg-sky-600 transition">
                        Upgrade
                    </a>
                </div>
            )}

            {/* At limit banner */}
            {canCreate && atLimit && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl px-6 py-4 mb-8 flex items-center justify-between gap-4">
                    <div className="text-sm font-semibold text-amber-800">
                        You've reached your group limit ({limit}). <a href="/pricing" className="underline text-amber-600">Upgrade to Ora</a> to create up to 3 groups.
                    </div>
                    <button onClick={() => setShowCreate(true)}
                        className="flex-shrink-0 text-xs font-bold bg-amber-500 text-white px-4 py-2 rounded-xl hover:bg-amber-600 transition">
                        Upgrade
                    </button>
                </div>
            )}

            {/* Empty state */}
            {allGroups.length === 0 && (
                <div className="bg-white border-2 border-dashed border-stone-200 rounded-2xl py-16 text-center">
                    <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Icon name="users" size={22} cls="text-stone-400" />
                    </div>
                    <div className="text-base font-semibold text-stone-700 mb-1">No groups yet</div>
                    <div className="text-sm text-stone-400 mb-6">
                        {canCreate ? "Create your first group to start collaborating." : "You haven't joined any groups yet."}
                    </div>
                    {canCreate && (
                        <button onClick={() => setShowCreate(true)}
                            className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition">
                            <Icon name="plus" size={14} /> Create group
                        </button>
                    )}
                </div>
            )}

            {/* Groups grid */}
            {allGroups.length > 0 && (
                <>
                    {data.owned.length > 0 && (
                        <div className="mb-8">
                            <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 px-1">
                                Your groups <span className="text-stone-300 font-medium">({data.owned.length}/{limit})</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {data.owned.map(g => (
                                    <GroupCard key={g.id} group={g} myRole="owner"
                                        onClick={() => router.push(`/dashboard/teams/${g.id}`)} />
                                ))}
                            </div>
                        </div>
                    )}

                    {data.member.length > 0 && (
                        <div>
                            <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 px-1">
                                Groups you're in
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {data.member.map(g => (
                                    <GroupCard key={g.id} group={g} myRole={g.myRole}
                                        onClick={() => router.push(`/dashboard/teams/${g.id}`)} />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Create modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-base font-bold text-stone-900">Create a group</h2>
                            <button onClick={() => { setShowCreate(false); setCreateError(""); }}
                                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition">
                                <Icon name="x" size={14} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-stone-600 mb-1.5 block">Group name <span className="text-red-400">*</span></label>
                                <input value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Marketing Team"
                                    className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 placeholder:text-stone-300" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-stone-600 mb-1.5 block">Description <span className="text-stone-300 font-normal">(optional)</span></label>
                                <textarea value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="What's this group for?"
                                    rows={3}
                                    className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 placeholder:text-stone-300 resize-none" />
                            </div>
                            {createError && <p className="text-xs text-red-500 font-medium">{createError}</p>}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => { setShowCreate(false); setCreateError(""); }}
                                className="flex-1 border border-stone-200 text-stone-600 font-semibold py-2.5 rounded-xl hover:bg-stone-50 transition text-sm">
                                Cancel
                            </button>
                            <button onClick={handleCreate} disabled={creating}
                                className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2.5 rounded-xl transition text-sm disabled:opacity-60">
                                {creating ? "Creating…" : "Create group"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}