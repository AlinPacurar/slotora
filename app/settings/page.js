"use client";
// app/settings/page.js
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "alinpacurar@slotora.app";

function daysUntilExpiry(expiresAt) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return 0;
  return Math.ceil(diff / 86400000);
}

function formatExpiry(expiresAt) {
  if (!expiresAt) return null;
  return new Date(expiresAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function formatDate(str) {
  return new Date(str).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

/* ─── Admin Voucher Panel ───────────────────────────────────────────────── */
function AdminVoucherPanel() {
  const [form, setForm] = useState({
    plan: "ora",
    durationDays: 30,
    maxUses: 1,
    expiresInDays: "",
  });
  const [generating, setGenerating] = useState(false);
  const [lastCode, setLastCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    fetch("/api/admin/vouchers")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setVouchers(d); })
      .finally(() => setLoadingList(false));
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setLastCode(null);
    try {
      const body = {
        plan: form.plan,
        durationDays: Number(form.durationDays),
        maxUses: Number(form.maxUses),
        ...(form.expiresInDays ? { expiresInDays: Number(form.expiresInDays) } : {}),
      };
      const res = await fetch("/api/admin/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.ok) {
        setLastCode(json.code);
        setVouchers(v => [json, ...v]);
      }
    } finally {
      setGenerating(false);
    }
  }

  function copyCode(code) {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete(id) {
    await fetch(`/api/admin/vouchers?id=${id}`, { method: "DELETE" });
    setVouchers(v => v.filter(x => x.id !== id));
  }

  const planColors = {
    slot: "bg-green-100 text-green-700",
    snap: "bg-blue-100 text-blue-700",
    ora: "bg-sky-100 text-sky-600",
  };

  return (
    <div className="bg-white border border-amber-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-amber-100 bg-amber-50">
        <span className="text-base">🔑</span>
        <h2 className="text-base font-semibold text-amber-900">Voucher Admin</h2>
        <span className="ml-auto text-[10px] font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full uppercase tracking-wide">Admin only</span>
      </div>

      <div className="p-6 space-y-6">

        {/* Generator form */}
        <div>
          <div className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-4">Generate voucher</div>
          <div className="grid grid-cols-2 gap-3 mb-4">

            {/* Plan */}
            <div>
              <label className="text-xs font-medium text-stone-600 mb-1.5 block">Plan tier</label>
              <div className="flex gap-2">
                {["slot", "snap", "ora"].map(p => (
                  <button key={p} type="button"
                    onClick={() => setForm(f => ({ ...f, plan: p }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize border transition ${form.plan === p
                        ? "bg-sky-500 text-white border-sky-500 shadow-sm"
                        : "border-stone-200 text-stone-500 hover:border-stone-300"
                      }`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Max uses */}
            <div>
              <label className="text-xs font-medium text-stone-600 mb-1.5 block">Max uses</label>
              <input
                type="number" min="1" value={form.maxUses}
                onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="text-xs font-medium text-stone-600 mb-1.5 block">Plan duration (days)</label>
              <div className="flex gap-1.5 flex-wrap mb-2">
                {[7, 14, 30, 90, 365].map(d => (
                  <button key={d} type="button"
                    onClick={() => setForm(f => ({ ...f, durationDays: d }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${Number(form.durationDays) === d
                        ? "bg-sky-500 text-white border-sky-500"
                        : "border-stone-200 text-stone-500 hover:border-stone-300"
                      }`}>
                    {d === 365 ? "1yr" : `${d}d`}
                  </button>
                ))}
              </div>
              <input
                type="number" min="1" value={form.durationDays}
                onChange={e => setForm(f => ({ ...f, durationDays: e.target.value }))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
              />
            </div>

            {/* Voucher expiry */}
            <div>
              <label className="text-xs font-medium text-stone-600 mb-1.5 block">
                Voucher expires in (days)
                <span className="text-stone-300 font-normal ml-1">optional</span>
              </label>
              <div className="flex gap-1.5 flex-wrap mb-2">
                {[1, 3, 7, 30].map(d => (
                  <button key={d} type="button"
                    onClick={() => setForm(f => ({ ...f, expiresInDays: d }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${Number(form.expiresInDays) === d
                        ? "bg-amber-500 text-white border-amber-500"
                        : "border-stone-200 text-stone-500 hover:border-stone-300"
                      }`}>
                    {d}d
                  </button>
                ))}
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, expiresInDays: "" }))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${form.expiresInDays === ""
                      ? "bg-stone-200 text-stone-700 border-stone-300"
                      : "border-stone-200 text-stone-400 hover:border-stone-300"
                    }`}>
                  Never
                </button>
              </div>
              <input
                type="number" min="1"
                value={form.expiresInDays}
                placeholder="No expiry"
                onChange={e => setForm(f => ({ ...f, expiresInDays: e.target.value }))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 placeholder:text-stone-300"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-stone-50 rounded-xl px-4 py-3 mb-4 text-xs text-stone-500">
            Generates a <span className="font-semibold text-stone-700 capitalize">{form.plan}</span> voucher
            valid for <span className="font-semibold text-stone-700">{form.durationDays} days</span> of access,
            usable <span className="font-semibold text-stone-700">{form.maxUses} time{form.maxUses != 1 ? "s" : ""}</span>
            {form.expiresInDays ? <>, code expires in <span className="font-semibold text-stone-700">{form.expiresInDays} days</span></> : <>, code never expires</>}.
          </div>

          <button type="button" onClick={handleGenerate} disabled={generating}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-stone-200 text-white font-semibold py-2.5 rounded-xl transition text-sm">
            {generating ? "Generating…" : "Generate voucher"}
          </button>
        </div>

        {/* Generated code display */}
        {lastCode && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4">
            <div className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-2">Voucher created</div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-bold text-emerald-800 tracking-widest flex-1">{lastCode}</span>
              <button type="button" onClick={() => copyCode(lastCode)}
                className="text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl transition flex-shrink-0">
                {copied ? "Copied! ✓" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {/* Voucher list */}
        <div>
          <div className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">All vouchers</div>
          {loadingList ? (
            <div className="text-xs text-stone-400 py-4 text-center">Loading…</div>
          ) : vouchers.length === 0 ? (
            <div className="text-xs text-stone-400 py-4 text-center">No vouchers yet.</div>
          ) : (
            <div className="space-y-2">
              {vouchers.map(v => {
                const isExpired = v.expiresAt && new Date(v.expiresAt) < new Date();
                const fullyUsed = v.usedCount >= v.maxUses;
                return (
                  <div key={v.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${isExpired || fullyUsed ? "bg-stone-50 border-stone-100 opacity-60" : "bg-white border-stone-200"
                      }`}>
                    <span className="font-mono font-bold text-stone-800 tracking-wider flex-shrink-0">{v.code}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${planColors[v.plan] ?? "bg-stone-100 text-stone-500"}`}>
                      {v.plan}
                    </span>
                    <span className="text-xs text-stone-400 flex-shrink-0">{v.durationDays}d</span>
                    <span className={`text-xs flex-shrink-0 ${fullyUsed ? "text-red-400" : "text-stone-400"}`}>
                      {v.usedCount}/{v.maxUses} uses
                    </span>
                    {v.expiresAt && (
                      <span className={`text-xs flex-shrink-0 ${isExpired ? "text-red-400" : "text-stone-400"}`}>
                        {isExpired ? "Expired" : `Exp. ${formatDate(v.expiresAt)}`}
                      </span>
                    )}
                    <div className="flex-1" />
                    <button type="button" onClick={() => copyCode(v.code)}
                      className="text-[11px] text-stone-400 hover:text-stone-700 font-medium px-2 py-1 rounded-lg hover:bg-stone-100 transition flex-shrink-0">
                      Copy
                    </button>
                    <button type="button" onClick={() => handleDelete(v.id)}
                      className="text-[11px] text-red-400 hover:text-red-600 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition flex-shrink-0">
                      Delete
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main settings page ────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [settings, setSettings] = useState({
    emailNotifications: true,
    name: "",
    plan: "community",
    planExpiresAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Voucher redemption state
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherMsg, setVoucherMsg] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/user/settings");
        const data = await res.json();
        setSettings({
          emailNotifications: data.emailNotifications ?? true,
          name: data.name ?? "",
          plan: data.plan ?? "community",
          planExpiresAt: data.planExpiresAt ?? null,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (session) fetchSettings();
  }, [session]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleRedeemVoucher() {
    if (!voucherCode.trim()) return;
    setVoucherLoading(true);
    setVoucherMsg(null);
    try {
      const res = await fetch("/api/vouchers/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: voucherCode.trim() }),
      });
      const json = await res.json();
      if (res.ok) {
        setVoucherMsg({ type: "success", text: json.message });
        setVoucherCode("");
        setSettings(s => ({ ...s, plan: json.plan, planExpiresAt: json.expiresAt }));
      } else {
        setVoucherMsg({ type: "error", text: json.error });
      }
    } catch {
      setVoucherMsg({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setVoucherLoading(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-400 text-sm">Loading...</div>
      </div>
    );
  }
  if (!session) return null;

  const isAdmin = session.user.email === ADMIN_EMAIL;
  const daysLeft = daysUntilExpiry(settings.planExpiresAt);
  const expiryLabel = formatExpiry(settings.planExpiresAt);
  const isPaid = settings.plan && settings.plan !== "community";
  const showExpiryWarning = isPaid && daysLeft !== null && daysLeft <= 7;

  return (
    <div className="min-h-screen bg-stone-50 flex">

      {/* SIDEBAR */}
      <aside className="w-56 bg-white border-r border-stone-200 flex-col fixed h-full hidden md:flex">
        <div className="px-5 py-4 border-b border-stone-100">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Slotora" className="w-8 h-8 rounded-xl" />
            <span className="font-serif text-lg font-bold text-stone-900">Slotora</span>
          </a>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <a href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-stone-600 hover:bg-stone-50 text-sm font-medium transition">
            <span>📊</span> Dashboard
          </a>
          <a href="/create" className="flex items-center gap-3 px-3 py-2 rounded-lg text-stone-600 hover:bg-stone-50 text-sm font-medium transition">
            <span>✚</span> New poll
          </a>
          <a href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-stone-100 text-stone-900 text-sm font-medium">
            <span>⚙️</span> Settings
          </a>
          <a href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-stone-600 hover:bg-stone-50 text-sm font-medium transition">
            <span>🏠</span> Homepage
          </a>
        </nav>
        <div className="px-3 py-4 border-t border-stone-100">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center text-xs font-bold">
              {session.user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-stone-800 truncate">{session.user.name}</div>
              <div className="text-xs text-stone-400 truncate">{session.user.email}</div>
            </div>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-stone-500 hover:bg-red-50 hover:text-red-500 text-sm transition">
            <span>→</span> Log out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 md:ml-56">
        <div className="max-w-2xl mx-auto px-6 py-10">

          <div className="mb-8">
            <h1 className="text-2xl font-serif font-bold text-stone-900 mb-1">Settings</h1>
            <p className="text-sm text-stone-400">Manage your account and notification preferences.</p>
          </div>

          {/* Expiry warning */}
          {showExpiryWarning && (
            <div className={`rounded-2xl px-5 py-4 mb-5 flex items-center justify-between gap-4 ${daysLeft === 0 ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"
              }`}>
              <div>
                <div className={`text-sm font-semibold ${daysLeft === 0 ? "text-red-800" : "text-amber-800"}`}>
                  {daysLeft === 0 ? "Your plan has expired" : `Your ${settings.plan} plan expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`}
                </div>
                <div className={`text-xs mt-0.5 ${daysLeft === 0 ? "text-red-500" : "text-amber-600"}`}>
                  {daysLeft === 0
                    ? "You've been moved to the Community plan."
                    : `Access ends on ${expiryLabel}. Redeem a voucher or upgrade to continue.`}
                </div>
              </div>
              <a href="/pricing"
                className={`flex-shrink-0 text-xs font-bold px-4 py-2 rounded-xl transition ${daysLeft === 0 ? "bg-red-500 hover:bg-red-600 text-white" : "bg-amber-500 hover:bg-amber-600 text-white"
                  }`}>
                Upgrade
              </a>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">

            {/* PROFILE */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-stone-900 mb-4">Profile</h2>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Display name</label>
              <input type="text" value={settings.name}
                onChange={e => setSettings({ ...settings, name: e.target.value })}
                className="w-full border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 mb-4" />
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Email address</label>
              <input type="email" value={session.user.email} disabled
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm bg-stone-50 text-stone-400 cursor-not-allowed" />
              <p className="text-xs text-stone-400 mt-1.5">Email cannot be changed.</p>
            </div>

            {/* NOTIFICATIONS */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-stone-900 mb-1">Email notifications</h2>
              <p className="text-sm text-stone-400 mb-5">Control when Slotora sends you emails.</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-stone-100">
                  <div>
                    <div className="text-sm font-medium text-stone-800">Someone votes on my poll</div>
                    <div className="text-xs text-stone-400 mt-0.5">Get notified every time a participant casts their vote</div>
                  </div>
                  <button type="button"
                    onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.emailNotifications ? "bg-sky-500" : "bg-stone-200"}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.emailNotifications ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                {settings.emailNotifications ? (
                  <div className="bg-sky-50 border border-sky-100 rounded-xl px-4 py-3">
                    <p className="text-xs text-sky-600 leading-relaxed">You'll receive one email per vote. If you have a busy poll, consider turning this off to avoid inbox flooding.</p>
                  </div>
                ) : (
                  <div className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
                    <p className="text-xs text-stone-500 leading-relaxed">Vote notifications are off. You can still check all poll results in your dashboard.</p>
                  </div>
                )}
              </div>
            </div>

            {/* SUBSCRIPTION — active Stripe sub */}
            {isPaid && !settings.planExpiresAt && (
              <div className="bg-white border border-stone-200 rounded-2xl p-6">
                <h2 className="text-base font-semibold text-stone-900 mb-1">Subscription</h2>
                <p className="text-sm text-stone-400 mb-4">
                  You're on the <span className="font-semibold text-sky-500 capitalize">{settings.plan}</span> plan. Manage billing, update your payment method, or cancel.
                </p>
                <button type="button"
                  onClick={async () => {
                    const res = await fetch("/api/stripe/portal", { method: "POST" });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  }}
                  className="text-sm border border-stone-300 text-stone-700 font-semibold px-4 py-2 rounded-xl hover:bg-stone-50 transition">
                  Manage subscription →
                </button>
              </div>
            )}

            {/* SUBSCRIPTION — voucher/manual plan with expiry */}
            {isPaid && settings.planExpiresAt && (
              <div className="bg-white border border-stone-200 rounded-2xl p-6">
                <h2 className="text-base font-semibold text-stone-900 mb-1">Plan</h2>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-stone-600">
                    You're on the <span className="font-semibold text-sky-500 capitalize">{settings.plan}</span> plan.
                  </span>
                </div>
                <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full mb-4 ${daysLeft !== null && daysLeft <= 7
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-stone-50 text-stone-500 border border-stone-200"
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${daysLeft !== null && daysLeft <= 7 ? "bg-amber-500" : "bg-emerald-500"}`} />
                  {daysLeft !== null && daysLeft > 0
                    ? `Expires ${expiryLabel} (${daysLeft} day${daysLeft === 1 ? "" : "s"} left)`
                    : daysLeft === 0 ? "Expired"
                      : `Expires ${expiryLabel}`}
                </div>
                <div className="text-xs text-stone-400">
                  To extend, redeem another voucher below or{" "}
                  <a href="/pricing" className="text-sky-500 hover:underline font-medium">upgrade with a subscription</a>.
                </div>
              </div>
            )}

            {/* VOUCHER REDEMPTION */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-stone-900 mb-1">Redeem a voucher</h2>
              <p className="text-sm text-stone-400 mb-4">Have a promo code or gift voucher? Enter it below to activate your plan.</p>
              <div className="flex gap-3">
                <input type="text" value={voucherCode}
                  onChange={e => setVoucherCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleRedeemVoucher())}
                  placeholder="e.g. XK7NQBT2MP"
                  maxLength={12}
                  className="flex-1 border border-stone-300 rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-sky-300 uppercase placeholder:font-sans placeholder:tracking-normal placeholder:text-stone-300" />
                <button type="button" onClick={handleRedeemVoucher}
                  disabled={voucherLoading || !voucherCode.trim()}
                  className="bg-sky-500 hover:bg-sky-600 disabled:bg-stone-200 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition flex-shrink-0">
                  {voucherLoading ? "Checking…" : "Redeem"}
                </button>
              </div>
              {voucherMsg && (
                <div className={`mt-3 flex items-center gap-2 text-xs font-medium ${voucherMsg.type === "success" ? "text-emerald-600" : "text-red-500"}`}>
                  <span>{voucherMsg.type === "success" ? "✓" : "✕"}</span>
                  {voucherMsg.text}
                </div>
              )}
            </div>

            {/* DANGER ZONE */}
            <div className="bg-white border border-red-100 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-stone-900 mb-1">Danger zone</h2>
              <p className="text-sm text-stone-400 mb-4">Irreversible actions — proceed with caution.</p>
              <button type="button" onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm border border-red-200 text-red-500 px-4 py-2 rounded-xl hover:bg-red-50 transition">
                Sign out of all devices
              </button>
            </div>

            {/* SAVE */}
            <div className="flex items-center gap-4">
              <button type="submit" disabled={saving}
                className="bg-sky-500 hover:bg-sky-600 disabled:bg-stone-200 text-white font-semibold px-6 py-3 rounded-xl transition text-sm">
                {saving ? "Saving..." : "Save changes"}
              </button>
              {saved && <span className="text-sm text-sky-500 font-medium">✓ Changes saved!</span>}
            </div>

          </form>

          {/* ADMIN VOUCHER PANEL — only visible to admin account */}
          {isAdmin && (
            <div className="mt-5">
              <AdminVoucherPanel />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}