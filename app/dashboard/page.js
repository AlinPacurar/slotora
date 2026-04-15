"use client";
// app/dashboard/page.js
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/* ─── tiny icon kit ─────────────────────────────────────────────────────── */
function Icon({ name, size = 16, cls = "", strokeWidth = 1.8 }) {
  const d = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
    trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></>,
    star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />,
    search: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
    share: <><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
    unlock: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></>,
    moreV: <><circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" /></>,
    restore: <><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.16" /></>,
    oras: <><path d="M12 2a9 9 0 1 0 9 9" /><path d="M12 6v6l4 2" /></>,
    votes: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
    active: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={cls}>
      {d[name]}
    </svg>
  );
}

/* ─── helpers ───────────────────────────────────────────────────────────── */
function planColor(plan) {
  if (plan === "ora") return "bg-sky-100 text-sky-600";
  if (plan === "snap") return "bg-blue-100 text-blue-700";
  if (plan === "slot") return "bg-green-100 text-green-700";
  return "bg-stone-100 text-stone-500";
}
function planLabel(plan) {
  if (!plan) return "Community";
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

/* ─── Upcoming Ora Card ─────────────────────────────────────────────────── */
function UpcomingOraCard({ polls }) {
  const [index, setIndex] = useState(0);

  const upcomingPolls = polls.filter(p => {
    const now = new Date();
    return p.dates?.some(d => new Date(d + "T00:00:00") >= now);
  }).sort((a, b) => {
    const aNext = a.dates?.find(d => new Date(d + "T00:00:00") >= new Date());
    const bNext = b.dates?.find(d => new Date(d + "T00:00:00") >= new Date());
    return new Date(aNext + "T00:00:00") - new Date(bNext + "T00:00:00");
  });

  useEffect(() => {
    if (upcomingPolls.length <= 1) return;
    const interval = setInterval(() => setIndex(i => (i + 1) % upcomingPolls.length), 5000);
    return () => clearInterval(interval);
  }, [upcomingPolls.length]);

  if (upcomingPolls.length === 0) {
    return (
      <div className="bg-white border border-dashed border-stone-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 mb-3">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Upcoming</span>
          <span className="text-[10px] font-semibold bg-sky-50 text-sky-400 px-2 py-0.5 rounded-full">Soon</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center px-4">
          <img src="/ora-activities-bg.png" alt="Ora" className="w-12 h-12 object-contain mb-2 opacity-40" />
          <p className="text-xs font-medium text-stone-400">No upcoming oras</p>
          <a href="/create" className="text-[11px] text-sky-500 font-semibold hover:underline mt-1">Create one →</a>
        </div>
      </div>
    );
  }

  const poll = upcomingPolls[index];
  const nextDate = poll.dates?.find(d => new Date(d + "T00:00:00") >= new Date());
  const nextDateFormatted = nextDate
    ? new Date(nextDate + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    : null;
  const timeVal = poll.times?.[nextDate];
  const voteCount = Object.keys(poll.votes || {}).length;
  const yesCount = nextDate ? Object.values(poll.votes || {}).filter(v => v[nextDate] === "yes").length : 0;

  function getBestDates(p) {
    if (!p.votes || Object.keys(p.votes).length === 0) return [null, null];
    const counts = {};
    p.dates.forEach(d => { counts[d] = 0; });
    Object.values(p.votes).forEach(v => Object.entries(v).forEach(([date, val]) => { if (val === "yes") counts[date] = (counts[date] || 0) + 1; }));
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return [sorted[0]?.[1] > 0 ? sorted[0] : null, sorted[1]?.[1] > 0 ? sorted[1] : null];
  }
  const [bestDate] = getBestDates(poll);

  return (
    <div className="bg-white border border-stone-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Upcoming</span>
        {upcomingPolls.length > 1 && (
          <div className="flex gap-1">
            {upcomingPolls.map((_, i) => (
              <button key={i} onClick={() => setIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === index ? "bg-sky-500 w-3" : "bg-stone-200"}`} />
            ))}
          </div>
        )}
      </div>
      <a href={`/poll/${poll.id}`} className="block relative h-28 bg-gradient-to-br from-sky-100 to-sky-50 overflow-hidden mx-3 rounded-xl">
        <img src="/ora-activities-bg.png" alt={poll.title} className="absolute inset-0 w-full h-full object-cover rounded-xl" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-xl" />
        {nextDateFormatted && (
          <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur text-xs font-bold text-stone-800 px-2 py-0.5 rounded-lg">
            {nextDateFormatted}{timeVal ? ` · ${timeVal}` : ""}
          </div>
        )}
      </a>
      <div className="px-4 pt-3 pb-4 flex-1 flex flex-col gap-2">
        <a href={`/poll/${poll.id}`} className="text-sm font-bold text-stone-900 hover:text-sky-500 transition leading-tight line-clamp-1">{poll.title}</a>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <div className="bg-sky-50 rounded-lg px-2.5 py-1.5">
            <div className="text-[10px] font-semibold text-sky-400 uppercase tracking-wide mb-0.5">Best date</div>
            <div className="font-bold text-sky-600 truncate text-[11px]">
              {bestDate ? new Date(bestDate[0] + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + (poll.times?.[bestDate[0]] ? ` · ${poll.times[bestDate[0]]}` : "") : "No votes yet"}
            </div>
          </div>
          <div className="bg-stone-50 rounded-lg px-2.5 py-1.5">
            <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-0.5">Creator</div>
            <div className="font-bold text-stone-700 truncate text-[11px]">{poll.creatorName}</div>
          </div>
          <div className="bg-emerald-50 rounded-lg px-2.5 py-1.5">
            <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide mb-0.5">Attendance</div>
            <div className="font-bold text-emerald-700 text-[11px]">{yesCount} yes · {voteCount} total</div>
          </div>
          <div className="bg-amber-50 rounded-lg px-2.5 py-1.5">
            <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-wide mb-0.5">Reminder</div>
            <div className="font-bold text-amber-600 text-[11px]">Coming soon</div>
          </div>
        </div>
        {poll.description && (
          <div className="bg-stone-50 rounded-lg px-2.5 py-1.5 text-[11px] text-stone-500">
            <span className="font-semibold text-stone-400">Notes: </span>{poll.description}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── main component ────────────────────────────────────────────────────── */
function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const upgraded = searchParams.get("upgraded");
  const tabParam = searchParams.get("tab");

  const [polls, setPolls] = useState([]);
  const [binPolls, setBinPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(tabParam === "bin" ? "bin" : "all");
  const [copiedId, setCopiedId] = useState(null);
  const [editingPoll, setEditingPoll] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [permanentConfirm, setPermanentConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [userPlan, setUserPlan] = useState("community");
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(!!upgraded);
  const [openMenu, setOpenMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sharePollId, setSharePollId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);
  useEffect(() => { if (session) { fetchPolls(); fetchBin(); fetchUserPlan(); } }, [session]);
  useEffect(() => {
    function h(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(null); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  async function fetchPolls() {
    try {
      const res = await fetch("/api/polls/mine");
      const data = await res.json();
      setPolls(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }
  async function fetchBin() {
    try {
      const res = await fetch("/api/polls/mine?bin=true");
      const data = await res.json();
      setBinPolls(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  }
  async function fetchUserPlan() {
    try {
      const res = await fetch("/api/user/settings");
      const data = await res.json();
      setUserPlan(data.plan || "community");
    } catch (e) { console.error(e); }
  }
  async function handleDelete(poll) {
    try {
      await fetch(`/api/polls/${poll.id}/delete`, { method: "DELETE" });
      setPolls(polls.filter(p => p.id !== poll.id));
      setBinPolls([{ ...poll, deletedAt: new Date().toISOString() }, ...binPolls]);
      setDeleteConfirm(null);
    } catch (e) { console.error(e); }
  }
  async function handleRestore(poll) {
    try {
      await fetch(`/api/polls/${poll.id}/delete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "restore" }) });
      setBinPolls(binPolls.filter(p => p.id !== poll.id));
      setPolls([{ ...poll, deletedAt: null }, ...polls]);
    } catch (e) { console.error(e); }
  }
  async function handlePermanentDelete(poll) {
    try {
      await fetch(`/api/polls/${poll.id}/delete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "permanent" }) });
      setBinPolls(binPolls.filter(p => p.id !== poll.id));
      setPermanentConfirm(null);
    } catch (e) { console.error(e); }
  }
  async function handleEdit(e) {
    e.preventDefault(); setSaving(true);
    try {
      const res = await fetch(`/api/polls/${editingPoll.id}/edit`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
      const updated = await res.json();
      setPolls(polls.map(p => p.id === updated.id ? updated : p));
      setEditingPoll(null);
    } catch (e) { console.error(e); } finally { setSaving(false); }
  }
  async function handleToggleClose(poll) {
    try {
      const res = await fetch(`/api/polls/${poll.id}/edit`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: poll.title, description: poll.description, closed: !poll.closed }) });
      const updated = await res.json();
      setPolls(polls.map(p => p.id === updated.id ? updated : p));
      setOpenMenu(null);
    } catch (e) { console.error(e); }
  }
  function openEdit(poll) { setEditingPoll(poll); setEditForm({ title: poll.title, description: poll.description || "" }); setOpenMenu(null); }
  function daysLeftInBin(deletedAt) {
    const expires = new Date(new Date(deletedAt).getTime() + 30 * 864e5);
    return Math.max(0, Math.ceil((expires - new Date()) / 864e5));
  }
  function formatDate(str) { return new Date(str).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  function formatPollDate(str, timesMap) {
    const d = new Date(str + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const t = timesMap && timesMap[str];
    return t ? `${d} · ${t}` : d;
  }
  function getBestDates(poll) {
    if (!poll.votes || Object.keys(poll.votes).length === 0) return [null, null];
    const counts = {};
    poll.dates.forEach(d => { counts[d] = 0; });
    Object.values(poll.votes).forEach(v => Object.entries(v).forEach(([date, val]) => { if (val === "yes") counts[date] = (counts[date] || 0) + 1; }));
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return [sorted[0]?.[1] > 0 ? sorted[0] : null, sorted[1]?.[1] > 0 ? sorted[1] : null];
  }
  function isRecent(poll) { return new Date(poll.createdAt) > new Date(Date.now() - 7 * 864e5); }

  const filteredPolls = activeTab === "bin" ? binPolls : polls.filter(p => {
    const q = searchQuery.toLowerCase();
    if (q && !p.title.toLowerCase().includes(q) && !(p.description || "").toLowerCase().includes(q)) return false;
    if (activeTab === "active") return Object.keys(p.votes || {}).length > 0;
    if (activeTab === "recent") return isRecent(p);
    return true;
  });
  const totalVotes = polls.reduce((acc, p) => acc + Object.keys(p.votes || {}).length, 0);
  const activePolls = polls.filter(p => Object.keys(p.votes || {}).length > 0).length;
  const firstName = session?.user?.name?.split(" ")[0] || "there";
  const greeting =
    userPlan === "ora" ? `Welcome back, Sensei ${firstName} 🌟` :
      userPlan === "snap" ? `Hey ${firstName} — SNAP! ⚡` :
        userPlan === "slot" ? `Hey ${firstName} — you SLOT right in! 🎯` :
          `Welcome back, ${firstName} 👋`;

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
          <div className="text-stone-400 text-sm">Loading your oras…</div>
        </div>
      </div>
    );
  }
  if (!session) return null;

  return (
    <>
      {/* ══ MODALS ════════════════════════════════════════════════════════ */}

      {editingPoll && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl border border-stone-200 w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-bold text-stone-900 mb-4">Edit ora</h2>
            <form onSubmit={handleEdit}>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Title</label>
              <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 mb-4" required />
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Description</label>
              <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                rows={3} className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 mb-6 resize-none" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setEditingPoll(null)}
                  className="flex-1 border border-stone-200 text-stone-600 font-semibold py-2.5 rounded-xl hover:bg-stone-50 transition text-sm">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:bg-stone-200 text-white font-semibold py-2.5 rounded-xl transition text-sm">
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl border border-stone-200 w-full max-w-sm p-6 shadow-xl">
            <h2 className="text-lg font-bold text-stone-900 mb-2">Move to bin?</h2>
            <p className="text-sm text-stone-500 mb-6">"{deleteConfirm.title}" will be moved to the bin. Restore within 30 days.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-stone-200 text-stone-600 font-semibold py-2.5 rounded-xl hover:bg-stone-50 transition text-sm">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition text-sm">Move to bin</button>
            </div>
          </div>
        </div>
      )}

      {permanentConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl border border-stone-200 w-full max-w-sm p-6 shadow-xl">
            <h2 className="text-lg font-bold text-stone-900 mb-2">Delete permanently?</h2>
            <p className="text-sm text-stone-500 mb-6">"{permanentConfirm.title}" will be deleted forever. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setPermanentConfirm(null)} className="flex-1 border border-stone-200 text-stone-600 font-semibold py-2.5 rounded-xl hover:bg-stone-50 transition text-sm">Cancel</button>
              <button onClick={() => handlePermanentDelete(permanentConfirm)} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition text-sm">Delete forever</button>
            </div>
          </div>
        </div>
      )}

      {sharePollId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <div className="text-base font-semibold text-stone-900">Share this ora</div>
              <button onClick={() => setSharePollId(null)} className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 text-sm">✕</button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "WhatsApp", color: "#25D366", action: () => window.open(`https://wa.me/?text=${encodeURIComponent("Vote on this ora! ")}${encodeURIComponent(window.location.origin + "/poll/" + sharePollId)}`, "_blank"), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.852L0 24l6.335-1.507A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.644-.511-5.157-1.402l-.37-.22-3.763.896.952-3.668-.241-.386A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" /></svg> },
                  { label: "Telegram", color: "#26A5E4", action: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.origin + "/poll/" + sharePollId)}`, "_blank"), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg> },
                  { label: "X", color: "#000", action: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.origin + "/poll/" + sharePollId)}`, "_blank"), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.261 5.631 5.903-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg> },
                  { label: "LinkedIn", color: "#0A66C2", action: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin + "/poll/" + sharePollId)}`, "_blank"), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg> },
                  { label: "Messenger", color: "#0099FF", action: () => window.open(`fb-messenger://share?link=${encodeURIComponent(window.location.origin + "/poll/" + sharePollId)}`, "_blank"), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.193 14.963l-3.056-3.259-5.963 3.259L10.986 8.3l3.13 3.259L20.007 8.3l-6.814 6.663z" /></svg> },
                  { label: "Copy link", color: "#0ea5e9", action: () => { navigator.clipboard.writeText(window.location.origin + "/poll/" + sharePollId); setCopiedId(sharePollId); setTimeout(() => setCopiedId(null), 2000); }, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg> },
                ].map(({ label, color, action, icon }) => (
                  <button key={label} onClick={action}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-stone-50 transition border border-stone-100">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: color }}>{icon}</div>
                    <span className="text-xs font-medium text-stone-600">{label === "Copy link" && copiedId === sharePollId ? "Copied! ✓" : label}</span>
                  </button>
                ))}
              </div>
              <div className="border-t border-stone-100 pt-4">
                <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Invite via email</div>
                <div className="flex gap-2">
                  <input type="email" placeholder="friend@email.com" id={`share-email-${sharePollId}`}
                    className="flex-1 border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                  <button onClick={async () => {
                    const input = document.getElementById(`share-email-${sharePollId}`);
                    const email = input?.value?.trim();
                    if (!email || !email.includes("@")) return;
                    try {
                      await fetch(`/api/polls/${sharePollId}/invite`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ emails: [email], message: "" }) });
                      input.value = ""; input.placeholder = "✓ Invite sent!";
                      setTimeout(() => { input.placeholder = "friend@email.com"; }, 2500);
                    } catch (e) { console.error(e); }
                  }} className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold rounded-xl transition flex-shrink-0">Send</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ DESKTOP TOP BAR ═══════════════════════════════════════════════ */}
      <div className="hidden md:flex sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-stone-100 px-8 h-14 items-center justify-between">
        <div className="relative w-72">
          <Icon name="search" size={14} cls="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input type="text" placeholder="Search oras…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300 bg-stone-50 placeholder:text-stone-400" />
        </div>
        <div className="flex items-center gap-3">
          <a href="/create"
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow-sm shadow-sky-200">
            <Icon name="plus" size={14} /> New ora
          </a>
        </div>
      </div>

      {/* ══ PAGE BODY ════════════════════════════════════════════════════ */}
      <main className="flex-1 px-5 md:px-8 py-6 max-w-6xl mx-auto w-full">

        {showUpgradeBanner && (
          <div className="bg-sky-50 border border-sky-200 rounded-2xl px-6 py-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <div className="text-sm font-semibold text-sky-900">Welcome to your new plan!</div>
                <div className="text-xs text-sky-400 mt-0.5">Your account has been upgraded successfully.</div>
              </div>
            </div>
            <button onClick={() => setShowUpgradeBanner(false)} className="text-xs text-sky-300 hover:text-sky-500 transition ml-4">✕</button>
          </div>
        )}

        {/* BIN VIEW */}
        {activeTab === "bin" ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-stone-900">Bin</h1>
                <p className="text-sm text-stone-400 mt-0.5">Polls are permanently deleted after 30 days.</p>
              </div>
              <button onClick={() => setActiveTab("all")}
                className="text-sm border border-stone-200 text-stone-600 px-4 py-2 rounded-xl hover:bg-stone-50 transition">← Back</button>
            </div>
            {binPolls.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-stone-200 rounded-2xl p-12 text-center">
                <div className="text-4xl mb-4">🗑</div>
                <div className="text-lg font-semibold text-stone-700 mb-2">Bin is empty</div>
                <div className="text-sm text-stone-400">Deleted polls appear here for 30 days.</div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                {binPolls.map((poll, i) => {
                  const daysLeft = daysLeftInBin(poll.deletedAt);
                  return (
                    <div key={poll.id} className={`flex items-center gap-4 px-5 py-3.5 ${i < binPolls.length - 1 ? "border-b border-stone-100" : ""}`}>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-stone-700 truncate">{poll.title}</div>
                        <div className="text-xs text-stone-400 mt-0.5">Deleted {formatDate(poll.deletedAt)}</div>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${daysLeft <= 3 ? "bg-red-100 text-red-600" : "bg-stone-100 text-stone-500"}`}>
                        {daysLeft}d left
                      </span>
                      <button onClick={() => handleRestore(poll)} className="text-xs bg-sky-50 text-sky-600 border border-sky-200 px-3 py-1.5 rounded-lg hover:bg-sky-100 transition flex-shrink-0">Restore</button>
                      <button onClick={() => setPermanentConfirm(poll)} className="text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition flex-shrink-0">Delete</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        ) : (
          <div>
            {/* Welcome banner */}
            <div className="relative bg-white rounded-2xl border border-stone-100 px-8 py-6 mb-6 overflow-hidden flex items-center justify-between shadow-sm">
              <div className="absolute -top-16 -right-16 w-64 h-64 bg-sky-100 rounded-full opacity-50 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-8 w-48 h-48 bg-teal-50 rounded-full opacity-60 blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">{greeting}</h1>
                <p className="text-sm text-stone-400 mt-1">
                  {userPlan === "ora" ? "The master has arrived. Your oras await. 🐿️" :
                    userPlan === "snap" ? "Everything is snapping into place." :
                      userPlan === "slot" ? "Your slot is ready and waiting." :
                        "Here's an overview of your oras."}
                </p>
              </div>
              <img src="/superhero-ora.png" alt="Ora mascot"
                className="relative z-10 h-28 w-auto object-contain drop-shadow-md select-none hidden sm:block" />
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { icon: "oras", label: "Total oras", value: polls.length, color: "text-sky-500", bg: "bg-sky-50" },
                { icon: "votes", label: "Total votes", value: totalVotes, color: "text-teal-600", bg: "bg-teal-50" },
                { icon: "active", label: "Active oras", value: activePolls, color: "text-emerald-600", bg: "bg-emerald-50" },
              ].map(({ icon, label, value, color, bg }) => (
                <div key={label} className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                  <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                    <Icon name={icon} size={16} cls={color} />
                  </div>
                  <div className="text-3xl font-extrabold text-stone-900 tracking-tight">{value}</div>
                  <div className="text-xs font-medium text-stone-400 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Widget row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* This Week */}
              <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">This Week</span>
                  <a href="/calendar" className="text-[10px] font-semibold text-sky-500 hover:underline">View all →</a>
                </div>
                {polls.filter(p => {
                  const now = new Date(); const weekEnd = new Date(now.getTime() + 7 * 864e5);
                  return p.dates?.some(d => { const dt = new Date(d + "T00:00:00"); return dt >= now && dt <= weekEnd; });
                }).slice(0, 3).length > 0 ? (
                  <div className="space-y-2">
                    {polls.filter(p => {
                      const now = new Date(); const weekEnd = new Date(now.getTime() + 7 * 864e5);
                      return p.dates?.some(d => { const dt = new Date(d + "T00:00:00"); return dt >= now && dt <= weekEnd; });
                    }).slice(0, 3).map(p => {
                      const nextDate = p.dates?.find(d => new Date(d + "T00:00:00") >= new Date());
                      return (
                        <a key={p.id} href={`/poll/${p.id}`} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-stone-50 transition group">
                          <div className="w-9 h-9 rounded-xl bg-sky-50 flex flex-col items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-sky-400 leading-none">{nextDate ? new Date(nextDate + "T00:00:00").toLocaleDateString("en-GB", { month: "short" }).toUpperCase() : "—"}</span>
                            <span className="text-sm font-extrabold text-sky-600 leading-none">{nextDate ? new Date(nextDate + "T00:00:00").getDate() : ""}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-stone-800 truncate group-hover:text-sky-500 transition">{p.title}</div>
                            <div className="text-[10px] text-stone-400">{Object.keys(p.votes || {}).length} votes</div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center mb-2"><Icon name="oras" size={16} cls="text-stone-300" /></div>
                    <p className="text-xs text-stone-400">No oras this week</p>
                    <a href="/create" className="text-[11px] text-sky-500 font-semibold hover:underline mt-1">Create one →</a>
                  </div>
                )}
              </div>

              <UpcomingOraCard polls={polls} />

              {/* Quick actions */}
              <div className="bg-white border border-dashed border-stone-200 rounded-2xl p-5 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Quick actions</span>
                  <span className="text-[10px] font-semibold bg-stone-50 text-stone-400 px-2 py-0.5 rounded-full">Modular</span>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <a href="/create" className="flex items-center gap-3 p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-100 transition">
                    <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center flex-shrink-0"><Icon name="plus" size={13} cls="text-white" /></div>
                    <span className="text-xs font-semibold text-sky-700">New ora</span>
                  </a>
                  <a href="/settings" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-stone-50 border border-stone-100 transition">
                    <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0"><Icon name="settings" size={13} cls="text-stone-500" /></div>
                    <span className="text-xs font-semibold text-stone-600">Settings</span>
                  </a>
                  <a href="/pricing" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-amber-50 border border-stone-100 hover:border-amber-100 transition">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0"><Icon name="star" size={13} cls="text-amber-400" /></div>
                    <span className="text-xs font-semibold text-stone-600">Upgrade plan</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Tabs + search */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4 items-start sm:items-center">
              <div className="relative flex-1 md:hidden">
                <Icon name="search" size={13} cls="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input type="text" placeholder="Search oras…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white" />
              </div>
              <div className="flex gap-1 bg-stone-100 p-1 rounded-xl">
                {[
                  { key: "all", label: `All (${polls.length})` },
                  { key: "active", label: `Active (${activePolls})` },
                  { key: "recent", label: "Recent" },
                ].map(t => (
                  <button key={t.key} onClick={() => setActiveTab(t.key)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition whitespace-nowrap ${activeTab === t.key ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Polls table */}
            {filteredPolls.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-stone-200 rounded-2xl p-12 text-center">
                <img src="/superhero-ora.png" alt="" className="w-24 h-auto mx-auto mb-4 opacity-60" />
                <div className="text-lg font-bold text-stone-700 mb-2">
                  {searchQuery ? "No oras match your search" : activeTab === "all" ? "No oras yet" : "No oras in this category"}
                </div>
                <div className="text-sm text-stone-400 mb-6">
                  {searchQuery ? "Try a different search term." : activeTab === "all" ? "Create your first ora and start collecting votes." : "Try a different filter above."}
                </div>
                {activeTab === "all" && !searchQuery && (
                  <a href="/create" className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-6 py-3 rounded-xl transition">
                    <Icon name="plus" size={14} /> Create your first ora
                  </a>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm">
                <div className="grid grid-cols-12 gap-1 px-5 py-3 bg-stone-50 border-b border-stone-100 rounded-t-2xl text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-4">Name</div>
                  <div className="col-span-2 text-center">Best date</div>
                  <div className="col-span-2 text-center">2nd date</div>
                  <div className="col-span-1 text-center">Votes</div>
                  <div className="col-span-1 text-center">Status</div>
                  <div className="col-span-1 text-center">•••</div>
                </div>
                {filteredPolls.map((poll, i) => {
                  const voteCount = Object.keys(poll.votes || {}).length;
                  const [bestDate, secondDate] = getBestDates(poll);
                  const isMenuOpen = openMenu === poll.id;
                  const isNearBottom = i >= filteredPolls.length - 2;
                  return (
                    <div key={poll.id}
                      className={`grid grid-cols-12 gap-2 px-5 py-3.5 items-center hover:bg-stone-50 transition group ${i < filteredPolls.length - 1 ? "border-b border-stone-100" : ""} ${i === filteredPolls.length - 1 ? "rounded-b-2xl" : ""}`}>
                      <div className="col-span-1 text-center text-xs font-semibold text-stone-300">{i + 1}</div>
                      <div className="col-span-4 min-w-0">
                        <a href={`/poll/${poll.id}`} className="text-sm font-semibold text-stone-800 hover:text-sky-500 transition truncate block">{poll.title}</a>
                        {poll.description && <div className="text-xs text-stone-400 truncate mt-0.5">{poll.description}</div>}
                      </div>
                      <div className="col-span-2 text-center">
                        {bestDate ? (<div><div className="text-xs font-bold text-sky-500">{formatPollDate(bestDate[0], poll.times)}</div><div className="text-[10px] text-stone-400">{bestDate[1]} yes</div></div>) : <span className="text-xs text-stone-200">—</span>}
                      </div>
                      <div className="col-span-2 text-center">
                        {secondDate ? (<div><div className="text-xs font-medium text-stone-500">{formatPollDate(secondDate[0], poll.times)}</div><div className="text-[10px] text-stone-400">{secondDate[1]} yes</div></div>) : <span className="text-xs text-stone-200">—</span>}
                      </div>
                      <div className="col-span-1 text-center">
                        <span className={`text-sm font-extrabold ${voteCount > 0 ? "text-sky-500" : "text-stone-200"}`}>{voteCount}</span>
                      </div>
                      <div className="col-span-1 text-center">
                        {poll.closed
                          ? <span className="inline-block text-[10px] font-semibold bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">Closed</span>
                          : <span className="inline-block text-[10px] font-semibold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">Open</span>}
                      </div>
                      <div className="col-span-1 text-center relative" ref={isMenuOpen ? menuRef : null}>
                        <button onClick={() => setOpenMenu(isMenuOpen ? null : poll.id)}
                          className="w-7 h-7 rounded-lg border border-stone-200 hover:bg-stone-100 hover:border-stone-300 transition flex items-center justify-center mx-auto text-stone-400 hover:text-stone-600">
                          <Icon name="moreV" size={13} />
                        </button>
                        {isMenuOpen && (
                          <div className={`absolute right-0 ${isNearBottom ? "bottom-full mb-1" : "top-9"} bg-white border border-stone-200 rounded-xl shadow-xl z-50 w-44 py-1 text-left`}>
                            <a href={`/poll/${poll.id}`} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition"><Icon name="eye" size={13} /> View</a>
                            <button onClick={() => { setSharePollId(poll.id); setOpenMenu(null); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition"><Icon name="share" size={13} /> Share via</button>
                            <button onClick={() => openEdit(poll)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition"><Icon name="edit" size={13} /> Edit</button>
                            {["slot", "snap", "ora"].includes(userPlan) ? (
                              <a href={`/api/polls/${poll.id}/export`} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition"><Icon name="download" size={13} /> Export CSV</a>
                            ) : (
                              <a href="/pricing" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-400 hover:bg-stone-50 transition"><Icon name="download" size={13} /> Export CSV ↑</a>
                            )}
                            <button onClick={() => handleToggleClose(poll)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition">
                              <Icon name={poll.closed ? "unlock" : "lock"} size={13} />{poll.closed ? "Reopen" : "Close"}
                            </button>
                            <div className="border-t border-stone-100 my-1" />
                            <button onClick={() => { setDeleteConfirm(poll); setOpenMenu(null); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition"><Icon name="trash" size={13} /> Delete</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
          <div className="text-stone-400 text-sm">Loading…</div>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}