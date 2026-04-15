"use client";
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

// ── Device fingerprint helpers ─────────────────────────────────────────────

function getOrCreateDeviceId() {
  if (typeof window === "undefined") return null;
  const key = "slotora_device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(key, id);
  }
  return id;
}

function hasVotedCookie(pollId) {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .map(c => c.trim())
    .some(c => c.startsWith(`voted_${pollId}=`));
}

// ──────────────────────────────────────────────────────────────────────────

export default function PollPage() {
  const { id } = useParams();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [voterName, setVoterName] = useState("");
  const [votes, setVotes] = useState({});
  const [comment, setComment] = useState("");
  const [commentPrivate, setCommentPrivate] = useState(false);
  const [participantEmail, setParticipantEmail] = useState("");
  const [participantPhone, setParticipantPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [changingVote, setChangingVote] = useState(false); // user chose to re-vote
  const [deviceId, setDeviceId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareTab, setShareTab] = useState("social");
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSent, setInviteSent] = useState(null);
  const [userPlan, setUserPlan] = useState("community");
  const shareRef = useRef(null);
  const { data: session } = useSession();

  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
  }, []);

  useEffect(() => {
    if (id) {
      setAlreadyVoted(hasVotedCookie(id));
      setSubmitError(null);
    }
  }, [id]);

  useEffect(() => {
    async function fetchPoll() {
      try {
        const res = await fetch(`/api/polls/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setPoll(data);
        if (data.hasVoted) setAlreadyVoted(true);
      } catch { setError(true); } finally { setLoading(false); }
    }
    fetchPoll();
  }, [id]);

  useEffect(() => {
    if (session?.user?.name && !voterName) {
      setVoterName(session.user.name.split(" ")[0]);
    }
  }, [session]);

  useEffect(() => {
    async function fetchPlan() {
      if (!session) return;
      try {
        const res = await fetch("/api/user/settings");
        const data = await res.json();
        setUserPlan(data.plan || "community");
      } catch (e) { console.error(e); }
    }
    fetchPlan();
  }, [session]);

  useEffect(() => {
    function handleClick(e) {
      if (shareRef.current && !shareRef.current.contains(e.target)) setShowShare(false);
    }
    if (showShare) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showShare]);

  function parseEmails(input) {
    const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
    const matches = input.match(emailRegex) || [];
    return [...new Set(matches)];
  }

  function formatDateWithTime(d, timesMap) {
    const dateStr = new Date(d + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
    const t = timesMap && timesMap[d];
    return t ? `${dateStr} · ${t}` : dateStr;
  }
  function formatDeadline(d) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }
  function formatCommentDate(str) {
    return new Date(str).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  function isDeadlinePassed(d) { return new Date(d) < new Date(); }

  function parseDateParts(d) {
    const dt = new Date(d + "T00:00:00");
    return {
      day: dt.getDate().toString(),
      month: dt.toLocaleDateString("en-GB", { month: "short" }).toUpperCase(),
    };
  }

  function getBestDate() {
    if (!poll || Object.keys(poll.votes).length === 0) return null;
    const counts = {};
    poll.dates.forEach(d => { counts[d] = 0; });
    Object.values(poll.votes).forEach(v => {
      Object.entries(v).forEach(([date, val]) => { if (val === "yes") counts[date] = (counts[date] || 0) + 1; });
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (!sorted.length || sorted[0][1] === 0) return null;
    const topCount = sorted[0][1];
    const topDates = sorted.filter(([, count]) => count === topCount);
    if (topDates.length === poll.dates.length) return { allEqual: true, count: topCount };
    return { allEqual: false, date: sorted[0][0], count: topCount, totalVoters: Object.keys(poll.votes).length };
  }

  function getDateStats(d) {
    if (!poll) return null;
    const allVotes = Object.values(poll.votes);
    const total = allVotes.length;
    if (total === 0) return null;
    const yes = allVotes.filter(v => v[d] === "yes").length;
    const maybe = allVotes.filter(v => v[d] === "maybe").length;
    const pct = Math.round((yes / total) * 100);
    return { yes, maybe, total, pct };
  }

  function voteLabel(v) {
    if (v === "yes") return "Yes";
    if (v === "no") return "No";
    if (v === "maybe") return "Maybe";
    return v;
  }

  function getUrl() { return typeof window !== "undefined" ? window.location.href : ""; }
  function getShareUrl() { return encodeURIComponent(getUrl()); }
  function getShareText() { return encodeURIComponent(`Vote on "${poll?.title}" — let's find the best time!`); }

  function copyLink() {
    navigator.clipboard.writeText(getUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function nativeShare() {
    if (navigator.share) {
      try { await navigator.share({ title: poll?.title, text: `Vote on "${poll?.title}"`, url: getUrl() }); }
      catch (e) { console.log(e); }
    }
  }

  const shareLinks = [
    {
      label: "WhatsApp", color: "#25D366",
      action: () => window.open(`https://wa.me/?text=${getShareText()}%20${getShareUrl()}`, "_blank"),
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.852L0 24l6.335-1.507A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.644-.511-5.157-1.402l-.37-.22-3.763.896.952-3.668-.241-.386A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" /></svg>
    },
    {
      label: "Telegram", color: "#26A5E4",
      action: () => window.open(`https://t.me/share/url?url=${getShareUrl()}&text=${getShareText()}`, "_blank"),
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
    },
    {
      label: "Messenger", color: "#0099FF",
      action: () => window.open(`fb-messenger://share?link=${getShareUrl()}`, "_blank"),
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.193 14.963l-3.056-3.259-5.963 3.259L10.986 8.3l3.13 3.259L20.007 8.3l-6.814 6.663z" /></svg>
    },
    {
      label: "X", color: "#000000",
      action: () => window.open(`https://twitter.com/intent/tweet?text=${getShareText()}&url=${getShareUrl()}`, "_blank"),
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.261 5.631 5.903-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
    },
    {
      label: "LinkedIn", color: "#0A66C2",
      action: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${getShareUrl()}`, "_blank"),
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
    },
  ];

  async function handleSubmit() {
    if (!voterName || Object.keys(votes).length === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/polls/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voterName, votes, comment, commentPrivate,
          participantEmail, participantPhone, deviceId,
          allowOverwrite: changingVote, // tell API this is an intentional re-vote
        }),
      });

      if (res.status === 409) {
        const data = await res.json();
        // If they're in "change vote" mode, these shouldn't fire — but handle gracefully
        setSubmitError(data.error);
        if (data.error === "duplicate_cookie") setAlreadyVoted(true);
        return;
      }

      if (!res.ok) throw new Error("Submit failed");

      const pollRes = await fetch(`/api/polls/${id}`);
      const data = await pollRes.json();
      setPoll(data);
      setSubmitted(true);
      setAlreadyVoted(true);
      setChangingVote(false);
      setShowShare(true);
    } catch (e) { console.error(e); } finally { setSubmitting(false); }
  }

  async function handleInvite() {
    const emailList = parseEmails(inviteEmails);
    if (emailList.length === 0) { alert("No valid email addresses found."); return; }
    setInviteSending(true);
    try {
      const res = await fetch(`/api/polls/${id}/invite`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: emailList, message: inviteMessage }),
      });
      const data = await res.json();
      setInviteSent(data);
      setInviteEmails("");
      setInviteMessage("");
    } catch (e) { console.error(e); } finally { setInviteSending(false); }
  }

  if (loading) return <div className="min-h-screen bg-[#f0f9ff] flex items-center justify-center"><div className="text-sky-400 text-sm">Loading poll...</div></div>;
  if (error) return (
    <div className="min-h-screen bg-[#f0f9ff] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🤔</div>
        <div className="text-lg font-semibold text-[#0c4a6e] mb-2">Poll not found</div>
        <div className="text-sm text-sky-400 mb-6">This poll may have been deleted or the link is wrong.</div>
        <a href="/create" className="bg-sky-500 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-sky-600 transition">Create a new poll</a>
      </div>
    </div>
  );

  const bestDate = getBestDate();
  const participantCount = Object.keys(poll.votes).length;
  const comments = poll.comments || {};
  const isClosed = poll.closed;
  const deadlinePassed = poll.deadline && isDeadlinePassed(poll.deadline);
  // canVote: open poll + (hasn't voted OR is in change-vote mode)
  const canVote = !isClosed && !deadlinePassed && (!alreadyVoted || changingVote);
  const detectedEmails = parseEmails(inviteEmails);
  const publicComments = Object.entries(comments);
  const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className="min-h-screen bg-[#f0f9ff] flex">

      {/* SIDEBAR */}
      {session && (
        <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-sky-100 sticky top-0 h-screen pt-14">
          <nav className="flex flex-col gap-1 px-3 py-4">
            <a href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#0c4a6e] hover:bg-sky-50 hover:text-sky-700 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
              Dashboard
            </a>
            <a href="/create" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#0c4a6e] hover:bg-sky-50 hover:text-sky-700 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
              New poll
            </a>
            <a href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#0c4a6e] hover:bg-sky-50 hover:text-sky-700 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
              Settings
            </a>
            <a href="/pricing" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#0c4a6e] hover:bg-sky-50 hover:text-sky-700 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
              Pricing
            </a>
          </nav>
          <div className="mt-auto px-4 py-4 border-t border-sky-50">
            <div className="text-xs text-sky-400 truncate">{session.user?.email}</div>
            <div className="text-xs font-semibold text-[#0c4a6e] capitalize mt-0.5">{userPlan} plan</div>
          </div>
        </aside>
      )}

      <div className="flex-1 flex flex-col min-w-0">

        {/* SHARE MODAL */}
        {showShare && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
            <div ref={shareRef} className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100">
                <div>
                  <div className="text-base font-semibold text-[#0c4a6e]">Share this ora</div>
                  <div className="text-xs text-sky-400 mt-0.5 truncate max-w-xs">{poll.title}</div>
                </div>
                <button onClick={() => setShowShare(false)} className="w-8 h-8 rounded-full bg-sky-50 hover:bg-sky-100 flex items-center justify-center text-sky-400 transition text-sm">✕</button>
              </div>
              <div className="flex border-b border-sky-100">
                {["social", "link", "email"].map(tab => (
                  <button key={tab} onClick={() => setShareTab(tab)}
                    className={`flex-1 py-3 text-sm font-medium transition ${shareTab === tab ? "text-sky-600 border-b-2 border-sky-500" : "text-sky-300 hover:text-sky-500"}`}>
                    {tab === "social" ? "Share via" : tab === "link" ? "Get link" : "Via email"}
                  </button>
                ))}
              </div>
              <div className="p-6">
                {shareTab === "social" && (
                  <div>
                    {hasNativeShare && (
                      <button onClick={nativeShare} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition mb-4">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
                        </svg>
                        Share with your apps
                      </button>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                      {shareLinks.map(({ label, color, action, icon }) => (
                        <button key={label} onClick={action} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-sky-50 transition border border-sky-100 hover:border-sky-200">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: color }}>{icon}</div>
                          <span className="text-xs font-medium text-[#0c4a6e]">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {shareTab === "link" && (
                  <div>
                    <div className="text-sm text-sky-400 mb-4">Copy the link and share it anywhere.</div>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 text-sm text-[#0c4a6e] truncate">{getUrl()}</div>
                      <button onClick={copyLink} className={`px-4 py-3 rounded-xl text-sm font-semibold transition flex-shrink-0 ${copied ? "bg-emerald-500 text-white" : "bg-sky-500 hover:bg-sky-600 text-white"}`}>
                        {copied ? "✓ Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}
                {shareTab === "email" && (
                  <div>
                    {inviteSent ? (
                      <div className="text-center py-4">
                        <div className="text-3xl mb-2">✉️</div>
                        <div className="text-sm font-semibold text-[#0c4a6e] mb-1">{inviteSent.sent} {inviteSent.sent === 1 ? "invite" : "invites"} sent!</div>
                        {inviteSent.failed > 0 && <div className="text-xs text-red-500 mb-2">{inviteSent.failed} failed to send</div>}
                        <button onClick={() => setInviteSent(null)} className="text-xs text-sky-500 hover:underline">Send more</button>
                      </div>
                    ) : (
                      <>
                        <label className="block text-sm font-medium text-[#0c4a6e] mb-1.5">
                          Email addresses <span className="text-sky-400 font-normal text-xs">(one per line or comma separated)</span>
                        </label>
                        <textarea placeholder={"john@example.com\nmaria@example.com"} value={inviteEmails} onChange={e => setInviteEmails(e.target.value)} rows={3}
                          className="w-full border border-sky-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 mb-3 resize-none font-mono" />
                        {inviteEmails.trim() && (
                          detectedEmails.length > 0 ? (
                            <div className="bg-sky-50 border border-sky-100 rounded-xl px-4 py-3 mb-3">
                              <div className="text-xs font-semibold text-sky-600 mb-1.5">{detectedEmails.length} email{detectedEmails.length !== 1 ? "s" : ""} detected:</div>
                              <div className="flex flex-wrap gap-1.5">
                                {detectedEmails.map((e, i) => <span key={i} className="text-xs bg-white border border-sky-200 text-sky-600 px-2 py-0.5 rounded-full">{e}</span>)}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-3">
                              <div className="text-xs text-red-500">No valid emails detected yet — keep typing!</div>
                            </div>
                          )
                        )}
                        <label className="block text-sm font-medium text-[#0c4a6e] mb-1.5">Message <span className="text-sky-400 font-normal">(optional)</span></label>
                        <textarea placeholder="Hi everyone, please vote on the best date!" value={inviteMessage} onChange={e => setInviteMessage(e.target.value)} rows={2}
                          className="w-full border border-sky-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 mb-4 resize-none" />
                        <button onClick={handleInvite} disabled={detectedEmails.length === 0 || inviteSending}
                          className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-sky-100 disabled:text-sky-300 text-white font-semibold py-3 rounded-xl transition text-sm">
                          {inviteSending ? "Sending..." : `Send ${detectedEmails.length > 0 ? detectedEmails.length : ""} invite${detectedEmails.length !== 1 ? "s" : ""} →`}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* NAV */}
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-sky-100 px-4 sm:px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Slotora" className="w-8 h-8 rounded-xl" />
            <span className="font-serif text-xl font-bold text-[#0c4a6e]">Slotora</span>
          </a>
          <button onClick={() => setShowShare(true)} className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            Share ora
          </button>
        </nav>

        <div className="max-w-3xl mx-auto px-3 sm:px-6 py-6 w-full">

          {/* POLL HEADER */}
          <div className="mb-2">
            {!isClosed && poll.deadline && !deadlinePassed && (
              <div className="text-xs font-semibold text-[#f97316] mb-2">Answer by {formatDeadline(poll.deadline)}</div>
            )}
            {isClosed && <div className="text-xs font-semibold text-sky-400 mb-2">This poll is closed</div>}
            {!isClosed && deadlinePassed && <div className="text-xs font-semibold text-red-400 mb-2">Deadline passed</div>}
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#0c4a6e] mb-1">{poll.title}</h1>
            {poll.description && <p className="text-sm text-sky-400 mb-2">{poll.description}</p>}
            <div className="text-sm">
              <span className="text-sky-400">Created by </span>
              <span className="font-semibold text-sky-600">{poll.creatorName}</span>
              {participantCount > 0 && <span className="text-sky-400"> · {participantCount} {participantCount === 1 ? "response" : "responses"}</span>}
            </div>
          </div>

          {/* MAIN POLL CARD */}
          <div className="bg-white rounded-2xl border border-sky-100 shadow-sm overflow-hidden mt-5 mb-5">

            {/* Card header */}
            <div className="flex items-center justify-between px-4 sm:px-5 pt-4 pb-3 border-b border-sky-50">
              <div>
                <div className="text-sm font-bold text-[#0c4a6e] leading-tight">{poll.title}</div>
                <div className="text-xs text-sky-400 mt-0.5">
                  {participantCount} participant{participantCount !== 1 ? "s" : ""} · {poll.dates.length} date{poll.dates.length !== 1 ? "s" : ""} proposed
                </div>
              </div>
              <button onClick={copyLink} className="flex items-center gap-1.5 bg-[#f97316] hover:bg-orange-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition flex-shrink-0 ml-3">
                {copied ? (
                  <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>Copied!</>
                ) : (
                  <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>Copy link</>
                )}
              </button>
            </div>

            {/* Responsive grid */}
            {participantCount > 0 && (
              <div className="overflow-x-auto">
                <div
                  className="min-w-max"
                  style={{ display: "grid", gridTemplateColumns: `130px repeat(${poll.dates.length}, minmax(100px, 1fr))` }}
                >
                  {/* Top-left mascot */}
                  <div className="px-3 py-3 flex items-end justify-start">
                    <img src="/ora-mascot.png" alt="Ora" className="w-10 h-10 object-contain opacity-90" onError={e => { e.target.style.display = "none"; }} />
                  </div>

                  {/* Date headers with stats */}
                  {poll.dates.map(d => {
                    const { day, month } = parseDateParts(d);
                    const isBest = bestDate && !bestDate.allEqual && bestDate.date === d;
                    const stats = getDateStats(d);
                    return (
                      <div key={d} className={`px-2 py-3 text-center ${isBest ? "bg-sky-50" : ""}`}>
                        <div className="text-xl font-bold text-[#0c4a6e]">{day}</div>
                        <div className={`text-[11px] font-bold tracking-wider ${isBest ? "text-sky-500" : "text-sky-400"}`}>{month}</div>
                        {poll.times?.[d] && <div className="text-[10px] text-sky-400">{poll.times[d]}</div>}
                        {stats && (
                          <div className="mt-1.5 px-1">
                            <div className={`text-xs font-bold leading-none ${isBest ? "text-[#f97316]" : "text-sky-500"}`}>
                              {stats.pct}%
                            </div>
                            <div className="text-[10px] text-sky-400 mt-0.5">{stats.yes}/{stats.total}</div>
                            <div className="w-full bg-sky-100 rounded-full h-1 mt-1">
                              <div
                                className={`h-1 rounded-full transition-all ${isBest ? "bg-[#f97316]" : "bg-sky-400"}`}
                                style={{ width: `${stats.pct}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Participant rows */}
                  {Object.entries(poll.votes).map(([name, v], rowIdx) => (
                    <React.Fragment key={name}>
                      <div className={`px-3 py-2.5 flex items-center text-sm font-semibold text-[#0c4a6e] truncate ${rowIdx % 2 === 0 ? "bg-white" : "bg-sky-50/30"}`}>
                        {name}
                      </div>
                      {poll.dates.map(d => {
                        const val = v[d];
                        const isBestCol = bestDate && !bestDate.allEqual && bestDate.date === d;
                        const isActiveBest = isBestCol && val === "yes";
                        let pillClass = "bg-sky-50 text-sky-300 border border-sky-100";
                        if (val === "yes") pillClass = isActiveBest ? "bg-[#f97316] text-white border border-orange-400 shadow-sm" : "bg-sky-50 text-[#0c4a6e] border border-sky-200";
                        if (val === "no") pillClass = "bg-red-50 text-red-500 border border-red-200";
                        if (val === "maybe") pillClass = "bg-amber-50 text-amber-600 border border-amber-200";
                        return (
                          <div key={d} className={`px-2 py-2.5 flex items-center justify-center ${rowIdx % 2 === 0 ? "bg-white" : "bg-sky-50/30"} ${isBestCol ? "bg-sky-50/50" : ""}`}>
                            <span className={`inline-flex items-center justify-center text-xs font-semibold px-3 py-1.5 rounded-xl w-full max-w-[90px] ${pillClass}`}>
                              {val ? voteLabel(val) : "—"}
                            </span>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {participantCount === 0 && (
              <div className="px-5 py-10 text-center text-sky-300 text-sm">No votes yet — be the first!</div>
            )}

            {/* Best date footer */}
            {bestDate && (
              <div className="border-t border-sky-100 px-4 sm:px-5 py-3 flex items-center justify-between bg-sky-50/50">
                <span className="text-sm font-semibold text-sky-500">Best date</span>
                <span className="text-sm font-bold text-[#f97316]">
                  {bestDate.allEqual ? "All dates equal!" : `${formatDateWithTime(bestDate.date, poll.times)} — ${bestDate.count}/${bestDate.totalVoters} available`}
                </span>
              </div>
            )}

            {/* CTA footer */}
            <div className="border-t border-sky-100 px-4 sm:px-5 py-3 flex items-center justify-between">
              <span className="text-sm text-sky-400">
                {isClosed ? "Poll closed"
                  : deadlinePassed ? "Deadline passed"
                    : alreadyVoted && !changingVote ? "You've already voted"
                      : participantCount === 0 ? "No responses yet"
                        : `${participantCount} response${participantCount !== 1 ? "s" : ""} so far`}
              </span>
              {canVote && !submitted && (
                <button onClick={() => document.getElementById("vote-form")?.scrollIntoView({ behavior: "smooth" })}
                  className="bg-[#0c4a6e] hover:bg-sky-900 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
                  {changingVote ? "Edit my vote ↓" : "Add your vote"}
                </button>
              )}
            </div>
          </div>

          {/* PUBLIC COMMENTS */}
          {publicComments.length > 0 && (
            <div className="bg-white rounded-2xl border border-sky-100 mb-5 overflow-hidden">
              <div className="px-5 py-3 border-b border-sky-50 text-xs font-semibold text-sky-400 uppercase tracking-wider">Comments</div>
              <div className="divide-y divide-sky-50">
                {publicComments.map(([name, data]) => {
                  const text = typeof data === "object" ? data.text : data;
                  const createdAt = typeof data === "object" ? data.createdAt : null;
                  const isPrivate = typeof data === "object" ? data.private : false;
                  return (
                    <div key={name} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-semibold text-[#0c4a6e]">{name}</div>
                          {isPrivate && <span className="text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full">🔒 Private</span>}
                        </div>
                        {createdAt && <div className="text-xs text-sky-300">{formatCommentDate(createdAt)}</div>}
                      </div>
                      <div className="text-sm text-sky-500">{text}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── ALREADY VOTED BANNER ── only one shown, never both ────────── */}
          {alreadyVoted && !submitted && !changingVote && !submitError && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-5 flex items-start gap-3">
              <div className="text-lg flex-shrink-0 mt-0.5">✅</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-emerald-700 mb-0.5">You've already voted on this poll</div>
                <div className="text-xs text-emerald-600 mb-2">Your response has been recorded. Share the poll to get more responses!</div>
                <div className="flex items-center gap-3 flex-wrap">
                  <button onClick={() => setShowShare(true)} className="text-xs text-emerald-700 font-semibold underline hover:no-underline">
                    Share this ora →
                  </button>
                  {!isClosed && !deadlinePassed && (
                    <button
                      onClick={() => { setChangingVote(true); setSubmitError(null); setTimeout(() => document.getElementById("vote-form")?.scrollIntoView({ behavior: "smooth" }), 50); }}
                      className="text-xs text-sky-600 font-semibold underline hover:no-underline"
                    >
                      Changed your mind? Update my vote
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Changing vote notice */}
          {changingVote && !submitted && (
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 mb-5 flex items-center justify-between gap-3">
              <div className="text-sm text-sky-600">
                <span className="font-semibold">Updating your vote</span> — your previous response will be replaced.
              </div>
              <button onClick={() => { setChangingVote(false); setSubmitError(null); }} className="text-xs text-sky-500 underline hover:no-underline flex-shrink-0">
                Cancel
              </button>
            </div>
          )}

          {/* Submit error banner — only after a failed attempt */}
          {submitError && !changingVote && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 flex items-start gap-3">
              <div className="text-lg flex-shrink-0 mt-0.5">⚠️</div>
              <div>
                <div className="text-sm font-semibold text-amber-700 mb-0.5">
                  {submitError === "duplicate_name" && `"${voterName}" has already voted on this poll`}
                  {submitError === "duplicate_ip" && "A vote has already been submitted from your network"}
                  {submitError === "duplicate_device" && "A vote has already been submitted from your device"}
                  {submitError === "duplicate_cookie" && "You've already voted on this poll"}
                </div>
                <div className="text-xs text-amber-600">
                  {submitError === "duplicate_name" ? "Try a different name if you're a different person." : "Each device can only submit one vote per poll."}
                </div>
                {submitError === "duplicate_name" && (
                  <button onClick={() => { setSubmitError(null); setVoterName(""); }} className="mt-1.5 text-xs text-amber-700 underline hover:no-underline">
                    Use a different name
                  </button>
                )}
              </div>
            </div>
          )}

          {/* CLOSED state */}
          {!canVote && !alreadyVoted && (isClosed || deadlinePassed) && (
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-6 text-center mb-5">
              <div className="text-2xl mb-2">{isClosed ? "🔒" : "⏰"}</div>
              <div className="text-sm font-semibold text-[#0c4a6e] mb-1">{isClosed ? "This poll is closed" : "The deadline has passed"}</div>
              <div className="text-xs text-sky-400">No more votes can be submitted.</div>
            </div>
          )}

          {/* VOTE FORM */}
          {canVote && !submitted && (
            <div id="vote-form" className="bg-white rounded-2xl border border-sky-100 p-5 shadow-sm">
              <h2 className="text-base font-bold text-[#0c4a6e] mb-4">
                {changingVote ? "Update your vote" : "Add your vote"}
              </h2>

              <label className="block text-sm font-medium text-[#0c4a6e] mb-1.5">Your name</label>
              <input type="text" placeholder="e.g. James" value={voterName}
                onChange={e => { setVoterName(e.target.value); setSubmitError(null); }}
                className="w-full border border-sky-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 mb-5 text-[#0c4a6e]" />

              <div className="text-sm font-medium text-[#0c4a6e] mb-3">Your availability</div>
              <div className="space-y-2.5 mb-5">
                {poll.dates.map(d => (
                  <div key={d} className="rounded-xl border border-sky-100 overflow-hidden">
                    <div className="px-4 py-2 bg-sky-50 border-b border-sky-100 text-sm font-semibold text-[#0c4a6e]">
                      {formatDateWithTime(d, poll.times)}
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-sky-100">
                      {(poll.voteOptions && poll.voteOptions.length >= 2 ? poll.voteOptions : ["yes", "maybe", "no"]).map(v => (
                        <button key={v} onClick={() => setVotes({ ...votes, [d]: v })}
                          className={`py-2.5 text-sm font-semibold transition-all duration-150 flex flex-col items-center gap-0.5 ${votes[d] === v
                              ? v === "yes" ? "bg-emerald-500 text-white"
                                : v === "no" ? "bg-red-400 text-white"
                                  : v === "maybe" ? "bg-amber-400 text-white"
                                    : "bg-sky-400 text-white"
                              : "bg-white text-sky-300 hover:bg-sky-50"
                            }`}>
                          <span className="text-sm">{v === "yes" ? "✓" : v === "no" ? "✕" : v === "maybe" ? "?" : "●"}</span>
                          <span className="text-xs capitalize">{v}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {poll.collectParticipantData && (
                <div className="mb-5 p-4 bg-sky-50 border border-sky-100 rounded-xl">
                  <div className="text-xs font-semibold text-sky-600 mb-3 uppercase tracking-wider">Contact details <span className="font-normal text-sky-400">(optional)</span></div>
                  <input type="email" placeholder="Your email address" value={participantEmail} onChange={e => setParticipantEmail(e.target.value)}
                    className="w-full border border-sky-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 mb-3" />
                  <input type="tel" placeholder="Your phone number" value={participantPhone} onChange={e => setParticipantPhone(e.target.value)}
                    className="w-full border border-sky-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                </div>
              )}

              <label className="block text-sm font-medium text-[#0c4a6e] mb-1.5">Leave a comment <span className="text-sky-300 font-normal">(optional)</span></label>
              <textarea placeholder="Any notes for the organiser..." value={comment} onChange={e => setComment(e.target.value)}
                rows={2} className="w-full border border-sky-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 mb-3 resize-none" />

              {comment.trim() && (
                <div className="flex items-center gap-3 mb-5 p-3 bg-sky-50 rounded-xl border border-sky-100">
                  <button type="button" onClick={() => setCommentPrivate(!commentPrivate)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${commentPrivate ? "bg-sky-500" : "bg-sky-200"}`}>
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${commentPrivate ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                  <div>
                    <div className="text-xs font-medium text-[#0c4a6e]">{commentPrivate ? "🔒 Private comment" : "💬 Public comment"}</div>
                    <div className="text-xs text-sky-400">{commentPrivate ? "Only the poll creator can see this" : "Visible to all participants"}</div>
                  </div>
                </div>
              )}

              <button onClick={handleSubmit} disabled={!voterName || Object.keys(votes).length === 0 || submitting}
                className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-sky-100 disabled:text-sky-300 text-white font-semibold py-3 rounded-xl transition text-sm">
                {submitting ? "Submitting..." : changingVote ? "Update my vote →" : "Submit my vote →"}
              </button>
            </div>
          )}

          {/* SUCCESS */}
          {submitted && (
            <div className="bg-white rounded-2xl border border-sky-200 p-8 text-center shadow-sm">
              <div className="text-4xl mb-3">🎉</div>
              <div className="text-lg font-bold text-[#0c4a6e] mb-1">Vote submitted!</div>
              <div className="text-sm text-sky-400 mb-6">Thanks {voterName}! Share this ora so others can vote too.</div>
              <button onClick={() => setShowShare(true)} className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-8 py-3 rounded-xl transition mx-auto">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                Share this ora
              </button>
            </div>
          )}

          {/* SHARE PROMPT */}
          {!submitted && (
            <div className="bg-white rounded-2xl border border-sky-100 p-4 mt-5 flex items-center justify-between shadow-sm">
              <div>
                <div className="text-sm font-semibold text-[#0c4a6e]">Know someone who should vote?</div>
                <div className="text-xs text-sky-400 mt-0.5">Share this ora and get more responses.</div>
              </div>
              <button onClick={() => setShowShare(true)} className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition flex-shrink-0 ml-4">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                Share ora
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}