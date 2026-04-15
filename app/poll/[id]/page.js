"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

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
    async function fetchPoll() {
      try {
        const res = await fetch(`/api/polls/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setPoll(data);
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

  function formatDate(d) {
    return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
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
    return { allEqual: false, date: sorted[0][0], count: topCount };
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
      try {
        await navigator.share({ title: poll?.title, text: `Vote on "${poll?.title}"`, url: getUrl() });
      } catch (e) { console.log(e); }
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
    try {
      await fetch(`/api/polls/${id}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterName, votes, comment, commentPrivate, participantEmail, participantPhone }),
      });
      const res = await fetch(`/api/polls/${id}`);
      const data = await res.json();
      setPoll(data);
      setSubmitted(true);
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

  if (loading) return <div className="min-h-screen bg-stone-50 flex items-center justify-center"><div className="text-stone-400 text-sm">Loading poll...</div></div>;
  if (error) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🤔</div>
        <div className="text-lg font-semibold text-stone-700 mb-2">Poll not found</div>
        <div className="text-sm text-stone-400 mb-6">This poll may have been deleted or the link is wrong.</div>
        <a href="/create" className="bg-sky-500 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-sky-600 transition">Create a new poll</a>
      </div>
    </div>
  );

  const bestDate = getBestDate();
  const participantCount = Object.keys(poll.votes).length;
  const comments = poll.comments || {};
  const isClosed = poll.closed;
  const deadlinePassed = poll.deadline && isDeadlinePassed(poll.deadline);
  const canVote = !isClosed && !deadlinePassed;
  const detectedEmails = parseEmails(inviteEmails);
  const publicComments = Object.entries(comments);
  const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className="min-h-screen bg-stone-50 flex">

      {/* SIDEBAR — logged in users only */}
      {session && (
        <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-stone-200 sticky top-0 h-screen pt-14">
          <nav className="flex flex-col gap-1 px-3 py-4">
            <a href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
              Dashboard
            </a>
            <a href="/create" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
              New poll
            </a>
            <a href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
              Settings
            </a>
            <a href="/pricing" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
              Pricing
            </a>
          </nav>
          <div className="mt-auto px-4 py-4 border-t border-stone-100">
            <div className="text-xs text-stone-400 truncate">{session.user?.email}</div>
            <div className="text-xs font-semibold text-stone-600 capitalize mt-0.5">{userPlan} plan</div>
          </div>
        </aside>
      )}

      <div className="flex-1 flex flex-col min-w-0">

        {/* SHARE ORA MODAL */}
        {showShare && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
            <div ref={shareRef} className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
                <div>
                  <div className="text-base font-semibold text-stone-900">Share this ora</div>
                  <div className="text-xs text-stone-400 mt-0.5 truncate max-w-xs">{poll.title}</div>
                </div>
                <button onClick={() => setShowShare(false)} className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition text-sm">✕</button>
              </div>
              <div className="flex border-b border-stone-100">
                <button onClick={() => setShareTab("social")}
                  className={`flex-1 py-3 text-sm font-medium transition ${shareTab === "social" ? "text-sky-600 border-b-2 border-sky-500" : "text-stone-400 hover:text-stone-600"}`}>
                  Share via
                </button>
                <button onClick={() => setShareTab("link")}
                  className={`flex-1 py-3 text-sm font-medium transition ${shareTab === "link" ? "text-sky-600 border-b-2 border-sky-500" : "text-stone-400 hover:text-stone-600"}`}>
                  Get link
                </button>
                <button onClick={() => setShareTab("email")}
                  className={`flex-1 py-3 text-sm font-medium transition ${shareTab === "email" ? "text-sky-600 border-b-2 border-sky-500" : "text-stone-400 hover:text-stone-600"}`}>
                  Via email
                </button>
              </div>
              <div className="p-6">
                {shareTab === "social" && (
                  <div>
                    {hasNativeShare && (
                      <button onClick={nativeShare}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition mb-4">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
                        </svg>
                        Share with your apps
                      </button>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                      {shareLinks.map(({ label, color, action, icon }) => (
                        <button key={label} onClick={action}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-stone-50 transition border border-stone-100 hover:border-stone-200">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: color }}>
                            {icon}
                          </div>
                          <span className="text-xs font-medium text-stone-600">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {shareTab === "link" && (
                  <div>
                    <div className="text-sm text-stone-500 mb-4">Copy the link and share it anywhere.</div>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-600 truncate">{getUrl()}</div>
                      <button onClick={copyLink}
                        className={`px-4 py-3 rounded-xl text-sm font-semibold transition flex-shrink-0 ${copied ? "bg-emerald-500 text-white" : "bg-sky-500 hover:bg-sky-600 text-white"}`}>
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
                        <div className="text-sm font-semibold text-stone-800 mb-1">{inviteSent.sent} {inviteSent.sent === 1 ? "invite" : "invites"} sent!</div>
                        {inviteSent.failed > 0 && <div className="text-xs text-red-500 mb-2">{inviteSent.failed} failed to send</div>}
                        <button onClick={() => setInviteSent(null)} className="text-xs text-sky-500 hover:underline">Send more</button>
                      </div>
                    ) : (
                      <>
                        <label className="block text-sm font-medium text-stone-700 mb-1.5">
                          Email addresses
                          <span className="text-stone-400 font-normal ml-1 text-xs">(one per line or comma separated)</span>
                        </label>
                        <textarea
                          placeholder={"john@example.com\nmaria@example.com"}
                          value={inviteEmails}
                          onChange={e => setInviteEmails(e.target.value)}
                          rows={3}
                          className="w-full border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 mb-3 resize-none font-mono"
                        />
                        {inviteEmails.trim() && (
                          detectedEmails.length > 0 ? (
                            <div className="bg-sky-50 border border-sky-100 rounded-xl px-4 py-3 mb-3">
                              <div className="text-xs font-semibold text-sky-600 mb-1.5">{detectedEmails.length} email{detectedEmails.length !== 1 ? "s" : ""} detected:</div>
                              <div className="flex flex-wrap gap-1.5">
                                {detectedEmails.map((e, i) => (
                                  <span key={i} className="text-xs bg-white border border-sky-200 text-sky-600 px-2 py-0.5 rounded-full">{e}</span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-3">
                              <div className="text-xs text-red-500">No valid emails detected yet — keep typing!</div>
                            </div>
                          )
                        )}
                        <label className="block text-sm font-medium text-stone-700 mb-1.5">
                          Message <span className="text-stone-400 font-normal">(optional)</span>
                        </label>
                        <textarea
                          placeholder="Hi everyone, please vote on the best date!"
                          value={inviteMessage}
                          onChange={e => setInviteMessage(e.target.value)}
                          rows={2}
                          className="w-full border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 mb-4 resize-none"
                        />
                        <button onClick={handleInvite} disabled={detectedEmails.length === 0 || inviteSending}
                          className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold py-3 rounded-xl transition text-sm">
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
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-stone-200 px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Slotora" className="w-8 h-8 rounded-xl" />
            <span className="font-serif text-xl font-bold text-stone-900">Slotora</span>
          </a>
          <button onClick={() => setShowShare(true)}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            Share ora
          </button>
        </nav>

        <div className="max-w-2xl mx-auto px-6 py-10 w-full">

          {/* POLL HEADER */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {isClosed && <span className="text-xs bg-stone-800 text-white font-semibold px-2.5 py-1 rounded-full">Closed</span>}
              {!isClosed && deadlinePassed && <span className="text-xs bg-red-100 text-red-600 font-semibold px-2.5 py-1 rounded-full">Deadline passed</span>}
              {!isClosed && poll.deadline && !deadlinePassed && (
                <span className="text-xs bg-amber-50 text-amber-600 font-semibold px-2.5 py-1 rounded-full">Answer by {formatDeadline(poll.deadline)}</span>
              )}
            </div>
            <h1 className="text-2xl font-serif font-bold text-stone-900 mb-1">{poll.title}</h1>
            {poll.description && <p className="text-sm text-stone-500 mb-2">{poll.description}</p>}
            <div className="flex items-center gap-3 text-xs text-stone-400">
              <span>Created by <span className="font-medium text-stone-600">{poll.creatorName}</span></span>
              <span>·</span>
              <span>{participantCount} {participantCount === 1 ? "response" : "responses"}</span>
            </div>
          </div>

          {/* BEST DATE BANNER */}
          {bestDate && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl px-5 py-3 mb-6 flex items-center justify-between">
              <div className="text-sm text-sky-600">
                {bestDate.allEqual
                  ? <span><span className="font-semibold">All dates work equally!</span> Every date has the same number of yes votes.</span>
                  : <span><span className="font-semibold">Best date so far:</span> {formatDateWithTime(bestDate.date, poll.times)}</span>
                }
              </div>
              <div className="text-xs bg-sky-100 text-sky-600 font-semibold px-2.5 py-1 rounded-full ml-3 flex-shrink-0">
                {bestDate.count} {bestDate.count === 1 ? "yes" : "yes votes"}
              </div>
            </div>
          )}

          {/* RESULTS TABLE */}
          {participantCount > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 mb-6 overflow-hidden">
              <div className="px-5 py-3 border-b border-stone-100 text-xs font-medium text-stone-400 uppercase tracking-wider">Responses so far</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100">
                      <th className="text-left px-5 py-3 font-medium text-stone-500 text-xs w-32">Participant</th>
                      {poll.dates.map(d => <th key={d} className="text-center px-3 py-3 font-medium text-stone-600 text-xs">{formatDateWithTime(d, poll.times)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(poll.votes).map(([name, v]) => (
                      <tr key={name} className="border-b border-stone-50 last:border-0">
                        <td className="px-5 py-3 font-medium text-stone-700 text-xs truncate max-w-[120px]">{name}</td>
                        {poll.dates.map(d => (
                          <td key={d} className="px-3 py-3 text-center">
                            <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold ${v[d] === "yes" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                              v[d] === "no" ? "bg-red-50 text-red-500 border border-red-200" :
                                v[d] === "maybe" ? "bg-amber-50 text-amber-600 border border-amber-200" :
                                  v[d] ? "bg-sky-50 text-sky-600 border border-sky-200" :
                                    "bg-stone-50 text-stone-300 border border-stone-100"}`}>
                              {v[d] ? voteLabel(v[d]) : "—"}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PUBLIC COMMENTS */}
          {publicComments.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 mb-6 overflow-hidden">
              <div className="px-5 py-3 border-b border-stone-100 text-xs font-medium text-stone-400 uppercase tracking-wider">Comments</div>
              <div className="divide-y divide-stone-50">
                {publicComments.map(([name, data]) => {
                  const text = typeof data === "object" ? data.text : data;
                  const createdAt = typeof data === "object" ? data.createdAt : null;
                  const isPrivate = typeof data === "object" ? data.private : false;
                  return (
                    <div key={name} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-semibold text-stone-700">{name}</div>
                          {isPrivate && (
                            <span className="text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full">🔒 Private</span>
                          )}
                        </div>
                        {createdAt && <div className="text-xs text-stone-400">{formatCommentDate(createdAt)}</div>}
                      </div>
                      <div className="text-sm text-stone-500">{text}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CLOSED */}
          {!canVote && (
            <div className="bg-stone-100 border border-stone-200 rounded-2xl p-6 text-center mb-6">
              <div className="text-2xl mb-2">{isClosed ? "🔒" : "⏰"}</div>
              <div className="text-sm font-semibold text-stone-700 mb-1">{isClosed ? "This poll is closed" : "The deadline has passed"}</div>
              <div className="text-xs text-stone-400">No more votes can be submitted.</div>
            </div>
          )}

          {/* VOTE FORM */}
          {canVote && !submitted && (
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h2 className="text-base font-semibold text-stone-900 mb-4">Add your vote</h2>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Your name</label>
              <input type="text" placeholder="e.g. James" value={voterName} onChange={e => setVoterName(e.target.value)}
                className="w-full border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 mb-5" />
              <div className="text-sm font-medium text-stone-700 mb-4">Your availability</div>
              <div className="space-y-3 mb-5">
                {poll.dates.map(d => (
                  <div key={d} className="rounded-xl border border-stone-200 overflow-hidden">
                    <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-200 text-sm font-semibold text-stone-700">{formatDateWithTime(d, poll.times)}</div>
                    <div className="grid grid-cols-3 divide-x divide-stone-200">
                      {(poll.voteOptions && poll.voteOptions.length >= 2 ? poll.voteOptions : ["yes", "maybe", "no"]).map(v => (
                        <button key={v} onClick={() => setVotes({ ...votes, [d]: v })}
                          className={`py-3 text-sm font-semibold transition-all duration-150 flex flex-col items-center gap-1 ${votes[d] === v
                            ? v === "yes" ? "bg-emerald-500 text-white"
                              : v === "no" ? "bg-red-400 text-white"
                                : v === "maybe" ? "bg-amber-400 text-white"
                                  : "bg-sky-400 text-white"
                            : "bg-white text-stone-400 hover:bg-stone-50"
                            }`}>
                          <span className="text-base">{v === "yes" ? "✓" : v === "no" ? "✕" : v === "maybe" ? "?" : "●"}</span>
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
                    className="w-full border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 mb-3" />
                  <input type="tel" placeholder="Your phone number" value={participantPhone} onChange={e => setParticipantPhone(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                </div>
              )}

              <label className="block text-sm font-medium text-stone-700 mb-1.5">Leave a comment <span className="text-stone-400 font-normal">(optional)</span></label>
              <textarea placeholder="Any notes for the organiser..." value={comment} onChange={e => setComment(e.target.value)}
                rows={2} className="w-full border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 mb-3 resize-none" />

              {comment.trim() && (
                <div className="flex items-center gap-3 mb-5 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <button type="button" onClick={() => setCommentPrivate(!commentPrivate)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${commentPrivate ? "bg-sky-500" : "bg-stone-300"}`}>
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${commentPrivate ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                  <div>
                    <div className="text-xs font-medium text-stone-700">{commentPrivate ? "🔒 Private comment" : "💬 Public comment"}</div>
                    <div className="text-xs text-stone-400">{commentPrivate ? "Only the poll creator can see this" : "Visible to all participants"}</div>
                  </div>
                </div>
              )}

              <button onClick={handleSubmit} disabled={!voterName || Object.keys(votes).length === 0 || submitting}
                className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold py-3 rounded-xl transition text-sm">
                {submitting ? "Submitting..." : "Submit my vote →"}
              </button>
            </div>
          )}

          {/* SUCCESS */}
          {submitted && (
            <div className="bg-white rounded-2xl border border-sky-200 p-8 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <div className="text-lg font-semibold text-stone-800 mb-1">Vote submitted!</div>
              <div className="text-sm text-stone-400 mb-6">Thanks {voterName}! Share this ora so others can vote too.</div>
              <button onClick={() => setShowShare(true)}
                className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-8 py-3 rounded-xl transition mx-auto">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                Share this ora
              </button>
            </div>
          )}

          {/* SHARE PROMPT */}
          {!submitted && (
            <div className="bg-white rounded-2xl border border-stone-200 p-5 mt-6 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-stone-800">Know someone who should vote?</div>
                <div className="text-xs text-stone-400 mt-0.5">Share this ora and get more responses.</div>
              </div>
              <button onClick={() => setShowShare(true)}
                className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition flex-shrink-0 ml-4">
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