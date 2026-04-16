"use client";
// app/dashboard/teams/[groupId]/page.js
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ROLE_META, canManage, assignableRoles, roleRank } from "@/lib/teamRoles";

/* ─── Icon kit ──────────────────────────────────────────────────────────── */
function Icon({ name, size = 16, cls = "" }) {
    const paths = {
        users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
        plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
        chevronLeft: <polyline points="15 18 9 12 15 6" />,
        settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
        x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
        copy: <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
        share: <><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></>,
        moreV: <><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></>,
        trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></>,
        globe: <><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>,
        lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
        search: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
        check: <polyline points="20 6 9 12 4 10" />,
        edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
    };
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={cls}>
            {paths[name]}
        </svg>
    );
}

/* ─── Role chip ─────────────────────────────────────────────────────────── */
function RoleChip({ role }) {
    const meta = ROLE_META[role] ?? ROLE_META.member;
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
        </span>
    );
}

/* ─── Avatar initials ───────────────────────────────────────────────────── */
function Avatar({ name, size = 8 }) {
    const initials = name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
    const colors = ["bg-sky-100 text-sky-600", "bg-violet-100 text-violet-600", "bg-emerald-100 text-emerald-600", "bg-amber-100 text-amber-600", "bg-rose-100 text-rose-600"];
    const color = colors[initials.charCodeAt(0) % colors.length];
    return (
        <div className={`w-${size} h-${size} rounded-full ${color} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
            {initials}
        </div>
    );
}

/* ─── Tab button ────────────────────────────────────────────────────────── */
function Tab({ label, active, onClick }) {
    return (
        <button onClick={onClick}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${active ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}>
            {label}
        </button>
    );
}

/* ─── Main page ─────────────────────────────────────────────────────────── */
export default function GroupDetailPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { groupId } = useParams();

    const [group, setGroup] = useState(null);
    const [myRole, setMyRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    // Invite state
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("member");
    const [inviting, setInviting] = useState(false);
    const [inviteMsg, setInviteMsg] = useState("");
    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    // Member actions
    const [openMenu, setOpenMenu] = useState(null);
    const menuRef = useRef(null);

    // Search
    const [searchQuery, setSearchQuery] = useState("");

    // Settings
    const [showSettings, setShowSettings] = useState(false);
    const [settingsForm, setSettingsForm] = useState({ name: "", description: "", isPublic: false, joinPolicy: "request" });
    const [saving, setSaving] = useState(false);

    useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status]);

    useEffect(() => {
        if (!session || !groupId) return;
        fetch(`/api/groups/${groupId}`)
            .then(r => r.json())
            .then(d => {
                if (d.error) { router.push("/dashboard/teams"); return; }
                setGroup(d);
                setMyRole(d.myRole);
                setSettingsForm({
                    name: d.name,
                    description: d.description ?? "",
                    isPublic: d.isPublic ?? false,
                    joinPolicy: d.joinPolicy ?? "request",
                });
                setLoading(false);
            });
    }, [session, groupId]);

    useEffect(() => {
        function h(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(null); }
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const isOwnerOrAdmin = myRole && roleRank(myRole) <= roleRank("admin");
    const isOwner = myRole === "owner";

    const activeMembers = group?.members?.filter(m => m.status === "active") ?? [];
    const pendingMembers = group?.members?.filter(m => m.status === "pending") ?? [];

    const filteredMembers = activeMembers.filter(m => {
        const q = searchQuery.toLowerCase();
        return !q || m.user?.name?.toLowerCase().includes(q) || m.user?.email?.toLowerCase().includes(q);
    });

    function copyInviteCode() {
        navigator.clipboard.writeText(group.inviteCode);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    }

    function copyInviteLink() {
        const link = `${window.location.origin}/join/${group.inviteCode}`;
        navigator.clipboard.writeText(link);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    }

    async function handleInviteByEmail() {
        if (!inviteEmail.trim() || !inviteEmail.includes("@")) { setInviteMsg("Please enter a valid email."); return; }
        setInviting(true); setInviteMsg("");
        try {
            const res = await fetch(`/api/groups/${groupId}/invite`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
            });
            const json = await res.json();
            if (!res.ok) { setInviteMsg(json.error ?? "Failed to send invite."); }
            else { setInviteMsg("Invite sent!"); setInviteEmail(""); }
        } catch { setInviteMsg("Something went wrong."); }
        finally { setInviting(false); }
    }

    async function handleSaveSettings() {
        setSaving(true);
        try {
            const res = await fetch(`/api/groups/${groupId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settingsForm),
            });
            const updated = await res.json();
            if (res.ok) { setGroup(g => ({ ...g, ...updated })); setShowSettings(false); }
        } catch { } finally { setSaving(false); }
    }

    async function handleDeleteGroup() {
        if (!confirm(`Delete "${group.name}"? This cannot be undone.`)) return;
        await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
        router.push("/dashboard/teams");
    }

    async function handleApproveMember(memberId) {
        await fetch(`/api/groups/${groupId}/members/${memberId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "active" }),
        });
        setGroup(g => ({
            ...g,
            members: g.members.map(m => m.id === memberId ? { ...m, status: "active" } : m),
        }));
    }

    async function handleRemoveMember(memberId) {
        if (!confirm("Remove this member from the group?")) return;
        await fetch(`/api/groups/${groupId}/members/${memberId}`, { method: "DELETE" });
        setGroup(g => ({ ...g, members: g.members.filter(m => m.id !== memberId) }));
        setOpenMenu(null);
    }

    async function handleChangeRole(memberId, newRole) {
        await fetch(`/api/groups/${groupId}/members/${memberId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: newRole }),
        });
        setGroup(g => ({
            ...g,
            members: g.members.map(m => m.id === memberId ? { ...m, role: newRole } : m),
        }));
        setOpenMenu(null);
    }

    if (loading) return (
        <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
        </div>
    );

    if (!group) return null;

    return (
        <div className="max-w-5xl mx-auto">

            {/* ── Back + header ── */}
            <div className="mb-6">
                <button onClick={() => router.push("/dashboard/teams")}
                    className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition mb-4 font-medium">
                    <Icon name="chevronLeft" size={13} /> All groups
                </button>

                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500 flex-shrink-0">
                            <Icon name="users" size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl font-bold text-stone-900">{group.name}</h1>
                                <RoleChip role={myRole} />
                                {group.isPublic
                                    ? <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600"><Icon name="globe" size={9} /> Public</span>
                                    : <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-500"><Icon name="lock" size={9} /> Private</span>
                                }
                            </div>
                            {group.description && <p className="text-sm text-stone-400 mt-0.5">{group.description}</p>}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        {isOwnerOrAdmin && (
                            <button onClick={() => setShowInvite(true)}
                                className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow-sm shadow-sky-200">
                                <Icon name="plus" size={14} /> Invite
                            </button>
                        )}
                        {isOwner && (
                            <button onClick={() => setShowSettings(true)}
                                className="w-9 h-9 rounded-xl border border-stone-200 hover:bg-stone-50 flex items-center justify-center text-stone-500 transition">
                                <Icon name="settings" size={15} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Stat row ── */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                    { label: "Members", value: activeMembers.length },
                    { label: "Pending", value: pendingMembers.length },
                    { label: "Invite code", value: group.inviteCode, mono: true },
                ].map(({ label, value, mono }) => (
                    <div key={label} className="bg-white border border-stone-100 rounded-2xl px-5 py-4">
                        <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{label}</div>
                        <div className={`font-bold text-stone-900 ${mono ? "text-sm font-mono tracking-widest" : "text-2xl"}`}>{value}</div>
                    </div>
                ))}
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 bg-stone-100 p-1 rounded-xl mb-6 w-fit">
                {["overview", "members", ...(isOwnerOrAdmin ? ["pending"] : [])].map(tab => (
                    <Tab key={tab} label={tab === "pending" ? `Pending (${pendingMembers.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
                        active={activeTab === tab} onClick={() => setActiveTab(tab)} />
                ))}
            </div>

            {/* ══ OVERVIEW TAB ══ */}
            {activeTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Invite via link */}
                    <div className="bg-white border border-stone-100 rounded-2xl p-5">
                        <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Share this group</div>
                        <div className="space-y-3">
                            <div>
                                <div className="text-xs font-semibold text-stone-500 mb-1.5">Invite code</div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-mono text-sm font-bold text-stone-700 tracking-widest">
                                        {group.inviteCode}
                                    </div>
                                    <button onClick={copyInviteCode}
                                        className="flex items-center gap-1.5 px-3 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-50 transition">
                                        <Icon name="copy" size={12} />
                                        {copiedCode ? "Copied!" : "Copy"}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-semibold text-stone-500 mb-1.5">Invite link</div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-400 truncate">
                                        {typeof window !== "undefined" ? `${window.location.origin}/join/${group.inviteCode}` : `/join/${group.inviteCode}`}
                                    </div>
                                    <button onClick={copyInviteLink}
                                        className="flex items-center gap-1.5 px-3 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-50 transition flex-shrink-0">
                                        <Icon name="share" size={12} />
                                        {copiedLink ? "Copied!" : "Share"}
                                    </button>
                                </div>
                            </div>
                            <div className="pt-1">
                                <div className="flex items-center gap-2 text-xs text-stone-400">
                                    {group.isPublic
                                        ? <><Icon name="globe" size={11} cls="text-emerald-500" /> Anyone can find this group by searching</>
                                        : <><Icon name="lock" size={11} cls="text-stone-400" /> Private — only accessible via invite code or link</>
                                    }
                                </div>
                                <div className="text-xs text-stone-400 mt-1">
                                    Join policy: <span className="font-semibold text-stone-600 capitalize">
                                        {group.joinPolicy === "request" ? "Request to join" : group.joinPolicy === "open" ? "Open (instant join)" : "Invite only"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent members */}
                    <div className="bg-white border border-stone-100 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-xs font-bold text-stone-400 uppercase tracking-widest">Members</div>
                            <button onClick={() => setActiveTab("members")}
                                className="text-[11px] text-sky-500 font-semibold hover:underline">
                                View all →
                            </button>
                        </div>
                        <div className="space-y-2.5">
                            {activeMembers.slice(0, 5).map(m => (
                                <div key={m.id} className="flex items-center gap-3">
                                    <Avatar name={m.user?.name} size={7} />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-semibold text-stone-800 truncate">{m.user?.name}</div>
                                        <div className="text-[10px] text-stone-400 truncate">{m.user?.email}</div>
                                    </div>
                                    <RoleChip role={m.role} />
                                </div>
                            ))}
                            {activeMembers.length === 0 && (
                                <div className="text-xs text-stone-400 text-center py-4">No members yet</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ══ MEMBERS TAB ══ */}
            {activeTab === "members" && (
                <div className="bg-white border border-stone-100 rounded-2xl overflow-hidden">
                    {/* Search bar */}
                    <div className="px-5 py-4 border-b border-stone-100">
                        <div className="relative">
                            <Icon name="search" size={13} cls="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                            <input type="text" placeholder="Search members…" value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-4 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300 bg-stone-50 placeholder:text-stone-400" />
                        </div>
                    </div>

                    {/* Header row */}
                    <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-stone-50 border-b border-stone-100 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        <div className="col-span-5">Member</div>
                        <div className="col-span-3">Role</div>
                        <div className="col-span-3">Joined</div>
                        <div className="col-span-1" />
                    </div>

                    {filteredMembers.length === 0 && (
                        <div className="text-center py-12 text-sm text-stone-400">
                            {searchQuery ? "No members match your search." : "No members yet."}
                        </div>
                    )}

                    {filteredMembers.map((m, i) => {
                        const isSelf = m.user?.id === session?.user?.id;
                        const canAct = isOwnerOrAdmin && canManage(myRole, m.role) && !isSelf;
                        const isMenuOpen = openMenu === m.id;
                        return (
                            <div key={m.id}
                                className={`grid grid-cols-12 gap-2 px-5 py-3.5 items-center hover:bg-stone-50 transition ${i < filteredMembers.length - 1 ? "border-b border-stone-100" : ""}`}>
                                <div className="col-span-5 flex items-center gap-3 min-w-0">
                                    <Avatar name={m.user?.name} size={8} />
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-stone-800 truncate">
                                            {m.user?.name} {isSelf && <span className="text-stone-300 font-normal">(you)</span>}
                                        </div>
                                        <div className="text-xs text-stone-400 truncate">{m.user?.email}</div>
                                    </div>
                                </div>
                                <div className="col-span-3">
                                    <RoleChip role={m.role} />
                                </div>
                                <div className="col-span-3 text-xs text-stone-400">
                                    {new Date(m.joinedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                </div>
                                <div className="col-span-1 flex justify-end relative" ref={isMenuOpen ? menuRef : null}>
                                    {canAct && (
                                        <button onClick={() => setOpenMenu(isMenuOpen ? null : m.id)}
                                            className="w-7 h-7 rounded-lg border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-stone-400 transition">
                                            <Icon name="moreV" size={13} />
                                        </button>
                                    )}
                                    {isMenuOpen && (
                                        <div className="absolute right-0 top-8 bg-white border border-stone-200 rounded-xl shadow-xl z-50 w-44 py-1 text-left">
                                            {assignableRoles(myRole).map(role => (
                                                <button key={role} onClick={() => handleChangeRole(m.id, role)}
                                                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 transition capitalize">
                                                    {m.role === role && <Icon name="check" size={11} cls="text-sky-500" />}
                                                    <span className={m.role === role ? "font-semibold text-sky-600" : ""}>
                                                        {role.charAt(0).toUpperCase() + role.slice(1)}
                                                    </span>
                                                </button>
                                            ))}
                                            <div className="border-t border-stone-100 my-1" />
                                            <button onClick={() => handleRemoveMember(m.id)}
                                                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition">
                                                <Icon name="trash" size={12} /> Remove
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ══ PENDING TAB ══ */}
            {activeTab === "pending" && isOwnerOrAdmin && (
                <div className="bg-white border border-stone-100 rounded-2xl overflow-hidden">
                    {pendingMembers.length === 0 ? (
                        <div className="text-center py-12 text-sm text-stone-400">No pending requests.</div>
                    ) : (
                        pendingMembers.map((m, i) => (
                            <div key={m.id}
                                className={`flex items-center gap-4 px-5 py-4 ${i < pendingMembers.length - 1 ? "border-b border-stone-100" : ""}`}>
                                <Avatar name={m.user?.name} size={9} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-stone-800">{m.user?.name}</div>
                                    <div className="text-xs text-stone-400">{m.user?.email}</div>
                                </div>
                                <div className="text-xs text-stone-400">
                                    {new Date(m.joinedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                </div>
                                <button onClick={() => handleApproveMember(m.id)}
                                    className="text-xs bg-sky-500 hover:bg-sky-600 text-white font-semibold px-3 py-1.5 rounded-lg transition">
                                    Approve
                                </button>
                                <button onClick={() => handleRemoveMember(m.id)}
                                    className="text-xs border border-red-200 text-red-500 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
                                    Decline
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ══ INVITE MODAL ══ */}
            {showInvite && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-base font-bold text-stone-900">Invite to {group.name}</h2>
                            <button onClick={() => { setShowInvite(false); setInviteMsg(""); setInviteEmail(""); }}
                                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition">
                                <Icon name="x" size={14} />
                            </button>
                        </div>

                        {/* Invite code */}
                        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 mb-5">
                            <div className="text-xs font-semibold text-stone-500 mb-2">Share invite code</div>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 font-mono text-lg font-bold text-stone-800 tracking-widest">{group.inviteCode}</div>
                                <button onClick={copyInviteCode}
                                    className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg hover:bg-white transition font-semibold text-stone-600">
                                    {copiedCode ? "Copied!" : "Copy code"}
                                </button>
                            </div>
                            <button onClick={copyInviteLink}
                                className="mt-2 w-full text-xs text-sky-500 font-semibold hover:underline text-left">
                                {copiedLink ? "Link copied!" : "Copy invite link →"}
                            </button>
                        </div>

                        {/* Email invite */}
                        <div className="text-xs font-semibold text-stone-500 mb-2">Or invite by email</div>
                        <div className="flex gap-2 mb-3">
                            <input type="email" placeholder="friend@email.com" value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                className="flex-1 border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 placeholder:text-stone-300" />
                            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                                className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white">
                                {assignableRoles(myRole).map(r => (
                                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                        {inviteMsg && (
                            <p className={`text-xs font-medium mb-3 ${inviteMsg === "Invite sent!" ? "text-emerald-500" : "text-red-500"}`}>
                                {inviteMsg}
                            </p>
                        )}
                        <button onClick={handleInviteByEmail} disabled={inviting}
                            className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition text-sm">
                            {inviting ? "Sending…" : "Send invite"}
                        </button>
                    </div>
                </div>
            )}

            {/* ══ SETTINGS MODAL ══ */}
            {showSettings && isOwner && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-base font-bold text-stone-900">Group settings</h2>
                            <button onClick={() => setShowSettings(false)}
                                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition">
                                <Icon name="x" size={14} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-stone-600 mb-1.5 block">Group name</label>
                                <input value={settingsForm.name} onChange={e => setSettingsForm(f => ({ ...f, name: e.target.value }))}
                                    className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-stone-600 mb-1.5 block">Description</label>
                                <textarea value={settingsForm.description} onChange={e => setSettingsForm(f => ({ ...f, description: e.target.value }))}
                                    rows={2} className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-stone-600 mb-2 block">Visibility</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { val: false, label: "Private", desc: "Invite only", icon: "lock" },
                                        { val: true, label: "Public", desc: "Searchable by anyone", icon: "globe" },
                                    ].map(({ val, label, desc, icon }) => (
                                        <button key={String(val)} onClick={() => setSettingsForm(f => ({ ...f, isPublic: val }))}
                                            className={`p-3 rounded-xl border text-left transition ${settingsForm.isPublic === val ? "border-sky-300 bg-sky-50" : "border-stone-200 hover:border-stone-300"}`}>
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <Icon name={icon} size={11} cls={settingsForm.isPublic === val ? "text-sky-500" : "text-stone-400"} />
                                                <span className={`text-xs font-bold ${settingsForm.isPublic === val ? "text-sky-700" : "text-stone-600"}`}>{label}</span>
                                            </div>
                                            <div className="text-[10px] text-stone-400">{desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {settingsForm.isPublic && (
                                <div>
                                    <label className="text-xs font-semibold text-stone-600 mb-2 block">Join policy</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { val: "request", label: "Request to join", desc: "You approve each request" },
                                            { val: "open", label: "Open", desc: "Anyone can join instantly" },
                                        ].map(({ val, label, desc }) => (
                                            <button key={val} onClick={() => setSettingsForm(f => ({ ...f, joinPolicy: val }))}
                                                className={`p-3 rounded-xl border text-left transition ${settingsForm.joinPolicy === val ? "border-sky-300 bg-sky-50" : "border-stone-200 hover:border-stone-300"}`}>
                                                <div className={`text-xs font-bold mb-0.5 ${settingsForm.joinPolicy === val ? "text-sky-700" : "text-stone-600"}`}>{label}</div>
                                                <div className="text-[10px] text-stone-400">{desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowSettings(false)}
                                className="flex-1 border border-stone-200 text-stone-600 font-semibold py-2.5 rounded-xl hover:bg-stone-50 transition text-sm">
                                Cancel
                            </button>
                            <button onClick={handleSaveSettings} disabled={saving}
                                className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition text-sm">
                                {saving ? "Saving…" : "Save changes"}
                            </button>
                        </div>

                        {isOwner && (
                            <div className="mt-4 pt-4 border-t border-stone-100">
                                <button onClick={handleDeleteGroup}
                                    className="w-full flex items-center justify-center gap-2 text-xs text-red-500 hover:text-red-600 font-semibold py-2 rounded-xl hover:bg-red-50 transition">
                                    <Icon name="trash" size={12} /> Delete group
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}