"use client";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    name: "",
    plan: "community",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!session) return null;

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

          <form onSubmit={handleSave} className="space-y-5">

            {/* PROFILE */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-stone-900 mb-4">Profile</h2>

              <label className="block text-sm font-medium text-stone-700 mb-1.5">Display name</label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 mb-4"
              />

              <label className="block text-sm font-medium text-stone-700 mb-1.5">Email address</label>
              <input
                type="email"
                value={session.user.email}
                disabled
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm bg-stone-50 text-stone-400 cursor-not-allowed"
              />
              <p className="text-xs text-stone-400 mt-1.5">Email cannot be changed.</p>
            </div>

            {/* NOTIFICATIONS */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-stone-900 mb-1">Email notifications</h2>
              <p className="text-sm text-stone-400 mb-5">Control when Slotora sends you emails.</p>

              <div className="space-y-4">

                {/* VOTE NOTIFICATIONS */}
                <div className="flex items-center justify-between py-3 border-b border-stone-100">
                  <div>
                    <div className="text-sm font-medium text-stone-800">Someone votes on my poll</div>
                    <div className="text-xs text-stone-400 mt-0.5">Get notified every time a participant casts their vote</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.emailNotifications ? "bg-sky-500" : "bg-stone-200"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.emailNotifications ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>

                {/* INFO BOX */}
                {settings.emailNotifications && (
                  <div className="bg-sky-50 border border-sky-100 rounded-xl px-4 py-3">
                    <p className="text-xs text-sky-600 leading-relaxed">
                      You&apos;ll receive one email per vote. If you have a busy poll, consider turning this off to avoid inbox flooding. You can always check results in your dashboard.
                    </p>
                  </div>
                )}

                {!settings.emailNotifications && (
                  <div className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
                    <p className="text-xs text-stone-500 leading-relaxed">
                      Vote notifications are off. You can still check all poll results and responses in your dashboard at any time.
                    </p>
                  </div>
                )}

              </div>
            </div>
            {/* SUBSCRIPTION */}
            {settings.plan && settings.plan !== "community" && (
              <div className="bg-white border border-stone-200 rounded-2xl p-6">
                <h2 className="text-base font-semibold text-stone-900 mb-1">Subscription</h2>
                <p className="text-sm text-stone-400 mb-4">
                  You&apos;re on the{" "}
                  <span className="font-semibold text-sky-500 capitalize">{settings.plan}</span> plan.
                  Manage billing, update your payment method, or cancel your subscription.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    const res = await fetch("/api/stripe/portal", { method: "POST" });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  }}
                  className="text-sm border border-stone-300 text-stone-700 font-semibold px-4 py-2 rounded-xl hover:bg-stone-50 transition"
                >
                  Manage subscription →
                </button>
              </div>
            )}
            {/* DANGER ZONE */}
            <div className="bg-white border border-red-100 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-stone-900 mb-1">Danger zone</h2>
              <p className="text-sm text-stone-400 mb-4">Irreversible actions — proceed with caution.</p>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm border border-red-200 text-red-500 px-4 py-2 rounded-xl hover:bg-red-50 transition"
              >
                Sign out of all devices
              </button>
            </div>

            {/* SAVE */}
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-sky-500 hover:bg-sky-600 disabled:bg-stone-200 text-white font-semibold px-6 py-3 rounded-xl transition text-sm"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
              {saved && (
                <span className="text-sm text-sky-500 font-medium">✓ Changes saved!</span>
              )}
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}