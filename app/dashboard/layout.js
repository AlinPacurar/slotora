"use client";
// app/dashboard/layout.js
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

/* ─── Icon kit ───────────────────────────────────────────────────────────── */
function Icon({ name, size = 16, cls = "", strokeWidth = 1.8 }) {
    const d = {
        grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
        plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
        settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
        trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></>,
        star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />,
        home: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
        logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
        users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
    };
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
            className={cls}>
            {d[name]}
        </svg>
    );
}

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

const NAV_ITEMS = [
    { href: "/dashboard", icon: "grid", label: "Dashboard" },
    { href: "/create", icon: "plus", label: "New ora" },
    { href: "/dashboard/teams", icon: "users", label: "Groups" },
    { href: "/settings", icon: "settings", label: "Settings" },
    { href: "/pricing", icon: "star", label: "Upgrade" },
    { href: "/", icon: "home", label: "Homepage" },
];

export default function DashboardLayout({ children }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    const [userPlan, setUserPlan] = useState("community");
    const [binCount, setBinCount] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
    }, [status, router]);

    useEffect(() => {
        if (!session) return;
        fetch("/api/user/settings")
            .then(r => r.json())
            .then(d => setUserPlan(d.plan ?? "community"))
            .catch(() => { });
        fetch("/api/polls/mine?bin=true")
            .then(r => r.json())
            .then(d => setBinCount(Array.isArray(d) ? d.length : 0))
            .catch(() => { });
    }, [session]);

    // Close mobile menu on route change
    useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
            </div>
        );
    }
    if (!session) return null;

    return (
        <div className="min-h-screen bg-[#f6f8fa] flex font-sans">

            {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
            <aside className="w-[220px] bg-white border-r border-stone-100 flex-col fixed h-full hidden md:flex shadow-sm z-30">

                {/* Logo */}
                <div className="px-5 py-5 border-b border-stone-100">
                    <a href="/" className="flex items-center gap-2.5">
                        <img src="/logo.svg" alt="Slotora" className="w-8 h-8 rounded-xl" />
                        <span className="text-[17px] font-extrabold text-stone-900 tracking-tight">Slotora</span>
                    </a>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-0.5">
                    {NAV_ITEMS.map(({ href, icon, label }) => {
                        const isActive =
                            pathname === href ||
                            (href !== "/dashboard" && href !== "/" && pathname.startsWith(href));
                        return (
                            <a key={label} href={href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive
                                        ? "bg-sky-500 text-white shadow-sm shadow-sky-200"
                                        : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
                                    }`}>
                                <Icon name={icon} size={15} />
                                {label}
                            </a>
                        );
                    })}

                    {/* Bin — links to dashboard with bin tab */}
                    <a href="/dashboard?tab=bin"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${pathname === "/dashboard" && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tab") === "bin"
                                ? "bg-red-50 text-red-600"
                                : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
                            }`}>
                        <Icon name="trash" size={15} />
                        Bin
                        {binCount > 0 && (
                            <span className="ml-auto text-[10px] font-bold bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full">
                                {binCount}
                            </span>
                        )}
                    </a>
                </nav>

                {/* User card */}
                <div className="px-3 pb-4 border-t border-stone-100 pt-4">
                    <div className="bg-stone-50 rounded-xl p-3 mb-2">
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {session.user.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-stone-800 truncate">{session.user.name}</div>
                                <div className="text-[10px] text-stone-400 truncate">{session.user.email}</div>
                            </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${planColor(userPlan)}`}>
                            {planLabel(userPlan)} plan
                        </span>
                    </div>
                    <button onClick={() => signOut({ callbackUrl: "/" })}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-stone-400 hover:bg-red-50 hover:text-red-500 transition font-medium">
                        <Icon name="logout" size={13} /> Sign out
                    </button>
                </div>
            </aside>

            {/* ── Main area (sidebar offset) ────────────────────────────────────── */}
            <div className="flex-1 md:ml-[220px] flex flex-col min-h-screen">

                {/* Mobile top bar */}
                <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-stone-100 px-5 h-14 flex items-center justify-between md:hidden">
                    <a href="/" className="flex items-center gap-2">
                        <img src="/logo.svg" alt="Slotora" className="w-7 h-7 rounded-lg" />
                        <span className="text-base font-extrabold text-stone-900 tracking-tight">Slotora</span>
                    </a>
                    <div className="flex items-center gap-2">
                        <a href="/create" className="text-sm bg-sky-500 text-white font-semibold px-4 py-1.5 rounded-lg">New ora</a>
                        <button onClick={() => setMobileMenuOpen(o => !o)}
                            className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-stone-100 transition" aria-label="Menu">
                            <span className={`block w-5 h-0.5 bg-stone-700 transition-all ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
                            <span className={`block w-5 h-0.5 bg-stone-700 transition-all ${mobileMenuOpen ? "opacity-0" : ""}`} />
                            <span className={`block w-5 h-0.5 bg-stone-700 transition-all ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
                        </button>
                    </div>
                </header>

                {/* Mobile nav drawer */}
                {mobileMenuOpen && (
                    <div className="md:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setMobileMenuOpen(false)}>
                        <div className="absolute top-14 left-0 right-0 bg-white border-b border-stone-100 shadow-lg px-4 py-3"
                            onClick={e => e.stopPropagation()}>
                            <nav className="space-y-1 mb-3">
                                {NAV_ITEMS.map(({ href, icon, label }) => {
                                    const isActive =
                                        pathname === href ||
                                        (href !== "/dashboard" && href !== "/" && pathname.startsWith(href));
                                    return (
                                        <a key={label} href={href}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive
                                                    ? "bg-sky-50 text-sky-600 font-semibold"
                                                    : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                                                }`}>
                                            <Icon name={icon} size={15} />
                                            {label}
                                        </a>
                                    );
                                })}
                                <a href="/dashboard?tab=bin"
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-red-50 hover:text-red-600 transition">
                                    <Icon name="trash" size={15} />
                                    Bin
                                    {binCount > 0 && (
                                        <span className="ml-auto text-[10px] font-bold bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full">{binCount}</span>
                                    )}
                                </a>
                            </nav>
                            <div className="border-t border-stone-100 pt-3 px-3 pb-1 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs font-bold">
                                        {session.user.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-stone-800">{session.user.name}</div>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${planColor(userPlan)}`}>{planLabel(userPlan)}</span>
                                    </div>
                                </div>
                                <button onClick={() => signOut({ callbackUrl: "/" })}
                                    className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-red-500 transition font-medium px-3 py-2 rounded-xl hover:bg-red-50">
                                    <Icon name="logout" size={13} /> Sign out
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Page content injected here */}
                {children}
            </div>
        </div>
    );
}