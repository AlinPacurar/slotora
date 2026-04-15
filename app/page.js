"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

function NavMenu() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <a href="#features" className="hidden sm:block text-sm text-sky-900/60 hover:text-sky-900 px-3 py-1.5 rounded-lg hover:bg-sky-50 transition">Features</a>
      <a href="/pricing" className="hidden sm:block text-sm text-sky-900/60 hover:text-sky-900 px-3 py-1.5 rounded-lg hover:bg-sky-50 transition">Pricing</a>
      {session ? (
        <>
          <button onClick={() => signOut({ callbackUrl: "/" })} className="hidden sm:block text-sm text-sky-900/60 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">Log out</button>
          <a href="/dashboard" className="hidden sm:flex bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">Dashboard</a>
        </>
      ) : (

        <>
          <a href="/login" className="hidden sm:block text-sm text-sky-900/70 font-medium px-3 py-1.5 transition">Log in</a>
          <a href="/signup" className="hidden sm:flex bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">Sign up free</a>
        </>
      )}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="sm:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-sky-50 transition"
      >
        <span className={`block w-5 h-0.5 bg-sky-900 transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`}></span>
        <span className={`block w-5 h-0.5 bg-sky-900 transition-all ${menuOpen ? "opacity-0" : ""}`}></span>
        <span className={`block w-5 h-0.5 bg-sky-900 transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}></span>
      </button>
      {menuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-white/95 backdrop-blur border-b border-sky-100 px-6 py-4 flex flex-col gap-3 sm:hidden z-50">
          <a href="#features" onClick={() => setMenuOpen(false)} className="text-sm text-sky-900/70 font-medium py-2 border-b border-sky-50">Features</a>
          <a href="/pricing" onClick={() => setMenuOpen(false)} className="text-sm text-sky-900/70 font-medium py-2 border-b border-sky-50">Pricing</a>
          {session ? (
            <>
              <a href="/dashboard" className="bg-orange-500 text-white text-sm font-semibold px-4 py-3 rounded-xl text-center">Dashboard</a>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="text-sm text-red-500 font-medium py-2 text-left">Log out</button>
            </>
          ) : (
            <>
              <a href="/login" className="text-sm text-sky-900/70 font-medium py-2 border-b border-sky-50">Log in</a>
              <a href="/signup" className="bg-orange-500 text-white text-sm font-semibold px-4 py-3 rounded-xl text-center">Sign up free</a>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { data: session } = useSession();
  const [yearly, setYearly] = useState(false);

  // Sparkle cursor — desktop only
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth < 768) return;

    const colors = ["#0ea5e9", "#38bdf8", "#f97316", "#4ade80", "#2dd4bf", "#fb923c", "#a5f3fc", "#bae6fd"];
    let tick = 0;

    const cursor = document.createElement("div");
    cursor.style.cssText = "position:fixed;width:14px;height:14px;background:#0ea5e9;border-radius:50%;pointer-events:none;z-index:99999;transform:translate(-50%,-50%);mix-blend-mode:multiply;";
    document.body.appendChild(cursor);

    const style = document.createElement("style");
    style.textContent = "@keyframes sfade{0%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(0)}}";
    document.head.appendChild(style);
    document.body.style.cursor = "none";

    function spawnSparkle(x, y) {
      tick++;
      if (tick % 2 !== 0) return;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 10 + 4;
      const dur = (Math.random() * 0.5 + 0.5).toFixed(2);
      const ox = x + (Math.random() - 0.5) * 18;
      const oy = y + (Math.random() - 0.5) * 18;

      if (Math.random() < 0.5) {
        const el = document.createElement("div");
        el.style.cssText = `position:fixed;width:${size}px;height:${size}px;left:${ox}px;top:${oy}px;background:${color};border-radius:50%;pointer-events:none;z-index:99998;animation:sfade ${dur}s ease-out forwards;`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1000);
      } else {
        const ns = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(ns, "svg");
        const s = size * 2.4;
        svg.setAttribute("width", s);
        svg.setAttribute("height", s);
        svg.setAttribute("viewBox", "-10 -10 20 20");
        svg.style.cssText = `position:fixed;left:${ox}px;top:${oy}px;pointer-events:none;z-index:99998;animation:sfade ${dur}s ease-out forwards;transform:translate(-50%,-50%);overflow:visible;`;
        const path = document.createElementNS(ns, "path");
        path.setAttribute("d", "M0,-7 L1.2,-1.2 L7,0 L1.2,1.2 L0,7 L-1.2,1.2 L-7,0 L-1.2,-1.2 Z");
        path.setAttribute("fill", color);
        svg.appendChild(path);
        document.body.appendChild(svg);
        setTimeout(() => svg.remove(), 1000);
      }
    }

    const onMove = (e) => {
      cursor.style.left = e.clientX + "px";
      cursor.style.top = e.clientY + "px";
      spawnSparkle(e.clientX, e.clientY);
    };

    document.addEventListener("mousemove", onMove);
    return () => {
      document.removeEventListener("mousemove", onMove);
      cursor.remove();
      style.remove();
      document.body.style.cursor = "";
    };
  }, []);

  const plans = [
    {
      key: "community", name: "Community", monthly: 0, badge: null, highlighted: false,
      features: ["Unlimited polls & sign-ups", "Yes / No / Maybe voting", "Comments & deadlines", "Share via link"],
      cta: "Get started", href: "/signup",
    },
    {
      key: "slot", name: "Slot", monthly: 4, badge: null, highlighted: false,
      features: ["Everything in Community", "1 file upload (2MB)", "CSV export", "No ads · Vote reminders"],
      cta: "Get Slot", href: "/signup",
    },
    {
      key: "snap", name: "Snap", monthly: 9, badge: "Most popular", highlighted: true,
      features: ["Everything in Slot", "3 file uploads (5MB each)", "Up to 3 custom vote options", "Collect participant data"],
      cta: "Get Snap", href: "/signup",
    },
    {
      key: "ora", name: "Ora", monthly: 19, badge: "Best value", highlighted: false,
      features: ["Everything in Snap", "5 file uploads (10MB each)", "Unlimited custom vote options", "Custom branding · Priority support"],
      cta: "Get Ora", href: "/signup",
    },
  ];

  return (
    <main>

      <style>{`
        @keyframes hero-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes leaf-drift{0%{opacity:0;transform:translateY(-10px) rotate(0deg)}10%{opacity:.5}90%{opacity:.3}100%{opacity:0;transform:translateY(100vh) rotate(360deg)}}
        .hero-ora{animation:hero-float 4s ease-in-out infinite}
        .hover-lift{transition:transform .2s ease,box-shadow .2s ease}
        .hover-lift:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(14,165,233,.12)}
        @media(max-width:767px){body{cursor:auto!important}}
      `}</style>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur border-b border-sky-100 px-6 flex items-center justify-between h-14 relative">
        <a href={session ? "/dashboard" : "/"} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl overflow-hidden border-2 border-sky-100 bg-white flex-shrink-0">
            <img src="/ora-superhero.png" alt="Ora" className="w-full h-full object-cover object-top" />
          </div>
          <span className="font-serif text-xl font-bold tracking-tight text-sky-900">Slotora</span>
        </a>
        <NavMenu />
      </nav>

      {/* BADGE STRIP */}
      <div className="bg-sky-50 border-b border-sky-100 py-2.5 px-6 flex items-center justify-center gap-6 flex-wrap">
        {["Free forever plan", "No account needed to vote", "Sign-ups & scheduling in one link", "Used by sports clubs, schools & PTAs"].map(b => (
          <span key={b} className="text-xs font-medium text-sky-700 flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">✓</span>
            {b}
          </span>
        ))}
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50 min-h-[88vh] flex items-center">

        {/* football bg - very subtle */}
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat pointer-events-none"
          style={{ backgroundImage: "url(/ora-football-bg.jpg)", opacity: 0.05 }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50/80 via-white/60 to-blue-50/80 pointer-events-none" />

        {/* floating leaves - desktop only */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-[50%_10%_50%_10%]"
              style={{
                width: `${8 + i * 3}px`,
                height: `${14 + i * 4}px`,
                background: ["#bae6fd", "#7dd3fc", "#4ade80", "#86efac", "#a5f3fc", "#fed7aa", "#38bdf8", "#2dd4bf"][i],
                left: `${10 + i * 12}%`,
                top: "-20px",
                opacity: 0,
                animation: `leaf-drift ${8 + i * 1.5}s ${i * 0.8}s linear infinite`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
          <div>
            <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
              The easiest scheduling platform for real-world groups
            </div>
            <h1 className="text-5xl lg:text-6xl font-serif font-bold leading-tight text-sky-950 mb-6">
              Stop the back&#8209;and&#8209;forth.<br />
              Find a time <span className="italic text-orange-500">everyone</span> agrees on.
            </h1>
            <p className="text-lg text-sky-800/70 mb-8 max-w-md leading-relaxed">
              Polls, sign-ups, and reminders — all in one link. Built for coaches, teachers, PTA leads, and community organisers who are tired of the WhatsApp chaos.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              <a href="/create" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition text-sm hover-lift">
                Create your first ora — free
              </a>
              <a href="#how" className="border-2 border-sky-200 text-sky-700 hover:bg-sky-50 font-semibold px-6 py-3 rounded-xl transition text-sm">
                See how it works
              </a>
            </div>
            <div className="flex items-center gap-3 text-sm text-sky-700/60">
              <div className="flex">
                {["JK", "MS", "AL", "RB"].map((i, idx) => (
                  <div key={i} className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold ${idx === 0 ? "bg-sky-100 text-sky-800" : idx === 1 ? "bg-orange-100 text-orange-800" : idx === 2 ? "bg-teal-100 text-teal-800" : "bg-green-100 text-green-800"} ${idx > 0 ? "-ml-2" : ""}`}>{i}</div>
                ))}
              </div>
              Trusted by teams, schools &amp; families worldwide
            </div>
          </div>

          {/* DESKTOP — Ora thinking with panel */}
          <div className="hidden lg:flex items-center justify-center relative min-h-[480px]">
            {/* thought panel behind Ora */}
            <div className="absolute left-0 right-16 top-6 bottom-6 bg-white/85 backdrop-blur-sm rounded-3xl border border-sky-100 shadow-2xl shadow-sky-100/60 p-8 flex flex-col justify-center">
              <div className="text-xs font-semibold text-sky-500 uppercase tracking-wider mb-2">The easiest way to schedule</div>
              <div className="text-3xl font-serif font-bold text-sky-950 mb-6 leading-tight">real-world<br />groups.</div>
              <div className="space-y-3">
                {[
                  { icon: "⚽", label: "Football training", time: "Tue 7pm · 8 players confirmed", color: "bg-sky-50 border-sky-100 text-sky-700" },
                  { icon: "🧘", label: "Yoga class", time: "Thu 6pm · 5 signed up", color: "bg-teal-50 border-teal-100 text-teal-700" },
                  { icon: "🍕", label: "Team dinner", time: "Fri 8pm · 12 attending", color: "bg-orange-50 border-orange-100 text-orange-700" },
                ].map(item => (
                  <div key={item.label} className={`flex items-center gap-3 rounded-xl p-3 border ${item.color}`}>
                    <span className="text-xl">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{item.label}</div>
                      <div className="text-xs opacity-70 truncate">{item.time}</div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></div>
                  </div>
                ))}
              </div>
            </div>
            {/* Ora with tablet floating on top right */}
            <div className="relative z-10 ml-auto hero-ora">
              <img src="/ora-tablet.png" alt="Ora" className="w-64 h-64 object-contain drop-shadow-2xl" />
            </div>
          </div>

          {/* MOBILE — small superhero Ora only */}
          <div className="flex lg:hidden justify-center">
            <img src="/ora-superhero.png" alt="Ora" className="w-36 h-36 object-contain drop-shadow-xl hero-ora" />
          </div>
        </div>
      </section>

      {/* DEMO POLL CARD */}
      <section className="max-w-2xl mx-auto px-6 pb-16 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl border border-sky-100 shadow-xl shadow-sky-100/40 overflow-hidden">
          <div className="px-5 py-4 border-b border-sky-50 flex items-center justify-between bg-gradient-to-r from-sky-50 to-white">
            <div>
              <div className="font-semibold text-sky-900 text-sm">Team offsite planning</div>
              <div className="text-xs text-sky-400 mt-0.5">5 participants · 3 dates proposed</div>
            </div>
            <button className="text-xs bg-orange-500 text-white font-semibold px-3 py-1.5 rounded-lg">Copy link</button>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-4 gap-2 mb-3 text-xs text-sky-400 font-medium">
              <div></div>
              {[["14", "Jan"], ["21", "Jan"], ["28", "Jan"]].map(([d, m]) => (
                <div key={d} className="text-center">
                  <div className="font-bold text-sky-900 text-sm">{d}</div>
                  <div className="uppercase tracking-wider text-xs">{m}</div>
                </div>
              ))}
            </div>
            {[
              ["Sarah M.", "yes", "yes", "no"],
              ["Janos S.", "no", "yes", "maybe"],
              ["Priya R.", "maybe", "best", "yes"],
              ["Alin P.", "yes", "yes", "no"],
            ].map(([name, ...votes]) => (
              <div key={name} className="grid grid-cols-4 gap-2 mb-2 items-center">
                <div className="text-xs font-medium text-sky-800 truncate">{name}</div>
                {votes.map((v, i) => (
                  <div key={i} className={`text-center text-xs font-semibold py-1.5 rounded-lg ${v === "yes" ? "bg-sky-50 text-sky-600" : v === "no" ? "bg-red-50 text-red-500" : v === "maybe" ? "bg-amber-50 text-amber-600" : "bg-orange-500 text-white"}`}>
                    {v === "best" ? "Yes" : v.charAt(0).toUpperCase() + v.slice(1)}
                  </div>
                ))}
              </div>
            ))}
            <div className="border-t border-sky-50 mt-3 pt-3 flex justify-between text-xs">
              <span className="text-sky-400">Best date</span>
              <span className="font-semibold text-orange-500">21 Jan — 4/4 available</span>
            </div>
          </div>
          <div className="px-5 py-3 bg-sky-50/50 border-t border-sky-50 flex items-center justify-between">
            <span className="text-xs text-sky-400">Waiting for 1 more response</span>
            <button className="text-xs bg-sky-900 text-white font-semibold px-3 py-1.5 rounded-lg">Add your vote</button>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-sky-50">
        <div className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3">Features</div>
        <h2 className="text-4xl font-serif font-bold text-sky-950 mb-4">Everything you need,<br />nothing you don&apos;t.</h2>
        <p className="text-lg text-sky-700/60 max-w-xl mb-10">Built for teams, families, schools and sports clubs. Simple enough to use in 60 seconds.</p>

        {/* Ora supervising kids — full width banner */}
        <div className="relative rounded-3xl overflow-hidden mb-12 h-64 lg:h-80">
          <img src="/ora-supervise.jpg" alt="Ora with community" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-sky-950/75 via-sky-950/40 to-transparent flex items-center px-10">
            <div>
              <div className="text-white font-serif text-2xl lg:text-3xl font-bold mb-2 leading-tight">Where real-world groups<br />come together.</div>
              <div className="text-sky-200 text-sm max-w-sm mt-2">From football training to school trips — Ora keeps everyone in sync.</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: "📅", bg: "bg-sky-50", title: "Meeting polls", desc: "Propose dates and times. Participants vote Yes, No, or Maybe. Slotora highlights the winner automatically." },
            { icon: "🗳️", bg: "bg-orange-50", title: "Opinion polls", desc: "Not just scheduling. Ask your team anything — vote on a name, location, or decision." },
            { icon: "📋", bg: "bg-teal-50", title: "Sign-up sheets", desc: "Perfect for volunteering rotas and sports slots. Participants claim slots until they're filled." },
            { icon: "🕵️", bg: "bg-blue-50", title: "Anonymous polls", desc: "Let people vote honestly. Names stay hidden from participants — ideal for sensitive decisions." },
            { icon: "🌍", bg: "bg-green-50", title: "Timezone support", desc: "Remote teams sorted. Participants see times in their own timezone automatically." },
            { icon: "⚡", bg: "bg-amber-50", title: "No account needed", desc: "Create a poll and vote without signing up. Share a link, get responses in minutes." },
          ].map(f => (
            <div key={f.title} className="bg-white border border-sky-100 rounded-2xl p-6 hover-lift">
              <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center text-lg mb-4`}>{f.icon}</div>
              <div className="font-semibold text-sky-900 mb-2">{f.title}</div>
              <div className="text-sm text-sky-700/60 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-sky-950 text-white py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-orange-400 mb-3">How it works</div>
          <h2 className="text-4xl font-serif font-bold mb-4">Up and running in 60 seconds.</h2>
          <p className="text-sky-300 text-lg mb-14">No tutorial needed. It just works.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
            <div className="hidden md:block absolute top-5 left-1/4 right-1/4 h-px bg-sky-700"></div>
            {[
              { n: "1", title: "Create your ora", desc: "Name it, pick your proposed dates or options. Takes less than a minute. No account needed." },
              { n: "2", title: "Share the link", desc: "Copy your unique link and send it via WhatsApp, email, or Slack — wherever your group lives." },
              { n: "3", title: "See the winner", desc: "Slotora tallies votes in real time and highlights the best option. Pick the winner and notify everyone." },
            ].map(s => (
              <div key={s.n} className="flex flex-col items-center">
                <div className="w-11 h-11 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-base mb-4 relative z-10">{s.n}</div>
                <div className="font-semibold text-white mb-2">{s.title}</div>
                <div className="text-sm text-sky-300 leading-relaxed max-w-xs">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO IS IT FOR — football bg */}
      <section className="relative overflow-hidden py-20">
        <div
          className="absolute inset-0 bg-center bg-cover pointer-events-none"
          style={{ backgroundImage: "url(/ora-football-bg.jpg)", opacity: 0.07 }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-sky-50/50 to-white pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3 text-center">Built for</div>
          <h2 className="text-4xl font-serif font-bold text-sky-950 text-center mb-12">Real-world organisers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: "⚽", title: "Sports clubs", desc: "Training schedules, match sign-ups, kit collections" },
              { icon: "🏫", title: "Schools & PTAs", desc: "Parent meetings, trips, fundraising sign-ups" },
              { icon: "🎭", title: "Community groups", desc: "Events, rehearsals, volunteering rotas" },
              { icon: "🏆", title: "Leagues & associations", desc: "Fixtures, AGMs, committee votes" },
            ].map(item => (
              <div key={item.title} className="text-center bg-white/80 backdrop-blur rounded-2xl p-6 border border-sky-100 hover-lift">
                <div className="text-4xl mb-3">{item.icon}</div>
                <div className="text-sm font-semibold text-sky-900 mb-1">{item.title}</div>
                <div className="text-xs text-sky-600/70 leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-20 border-t border-sky-50">
        <div className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3">Pricing</div>
        <h2 className="text-4xl font-serif font-bold text-sky-950 mb-4">Simple, transparent pricing.</h2>
        <p className="text-lg text-sky-700/60 max-w-xl mb-6">Start free. Upgrade when you need more power.</p>
        <div className="flex items-center gap-4 mb-10">
          <div className="inline-flex items-center gap-1 bg-sky-100 p-1 rounded-xl">
            <button
              onClick={() => setYearly(false)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${!yearly ? "bg-white text-sky-900 shadow-sm" : "text-sky-500"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${yearly ? "bg-white text-sky-900 shadow-sm" : "text-sky-500"}`}
            >
              Yearly
              <span className="text-xs bg-orange-100 text-orange-600 font-semibold px-2 py-0.5 rounded-full">Save 20%</span>
            </button>
          </div>
          <a href="/pricing" className="text-sm text-sky-500 font-semibold hover:underline">See full details →</a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map(p => (
            <div key={p.key} className={`rounded-2xl p-6 flex flex-col relative hover-lift ${p.highlighted ? "bg-sky-950 text-white shadow-lg shadow-sky-900/20" : "bg-white border border-sky-100"}`}>
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">{p.badge}</span>
                </div>
              )}
              <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${p.highlighted ? "text-sky-300" : "text-orange-500"}`}>{p.name}</div>
              <div className={`text-4xl font-serif font-bold mb-0.5 ${p.highlighted ? "text-white" : "text-sky-950"}`}>
                {p.monthly === 0 ? "Free" : `£${yearly ? (p.monthly * 0.8).toFixed(2) : p.monthly}`}
              </div>
              <div className={`text-xs mb-1 ${p.highlighted ? "text-sky-400" : "text-sky-400"}`}>
                {p.monthly === 0 ? "forever" : "per month"}
              </div>
              {p.monthly > 0 && (
                <div className={`text-xs mb-4 ${p.highlighted ? "text-sky-400" : "text-sky-400"}`}>
                  {yearly ? `£${(p.monthly * 12 * 0.8).toFixed(2)} billed yearly` : `or £${(p.monthly * 12 * 0.8).toFixed(2)}/yr — save 20%`}
                </div>
              )}
              {p.monthly === 0 && <div className="mb-4"></div>}
              <ul className="flex-1 space-y-2 mb-6">
                {p.features.map(f => (
                  <li key={f} className={`text-sm flex gap-2 items-start ${p.highlighted ? "text-sky-200" : "text-sky-700/70"}`}>
                    <span className={`font-bold flex-shrink-0 mt-0.5 ${p.highlighted ? "text-orange-400" : "text-orange-500"}`}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a href={p.href} className={`text-center text-sm font-semibold py-2.5 rounded-xl transition ${p.highlighted ? "bg-orange-500 hover:bg-orange-600 text-white" : "border-2 border-sky-200 text-sky-700 hover:bg-sky-50"}`}>
                {p.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-sky-50 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3">What people say</div>
          <h2 className="text-4xl font-serif font-bold text-sky-950 mb-12">Real people, less back&#8209;and&#8209;forth.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { stars: 5, text: "Finally stopped the WhatsApp nightmare of 'when can everyone do Saturday?' Slotora sorted our whole football team in 5 minutes.", name: "Dave M.", role: "Sunday league organiser", initials: "DM", bg: "bg-sky-100 text-sky-800" },
              { stars: 5, text: "We're a remote team across 4 time zones. Slotora handles the timezone conversion automatically — it's saved us embarrassing scheduling disasters.", name: "Sophie R.", role: "Engineering manager", initials: "SR", bg: "bg-orange-100 text-orange-800" },
              { stars: 5, text: "I use it for parent committee votes at school. The anonymous polls are brilliant — people are much more honest.", name: "Karen H.", role: "PTA committee chair", initials: "KH", bg: "bg-teal-100 text-teal-800" },
            ].map(t => (
              <div key={t.name} className="bg-white border border-sky-100 rounded-2xl p-6 hover-lift">
                <div className="text-amber-400 text-sm mb-3">{"★".repeat(t.stars)}</div>
                <p className="text-sm text-sky-800/70 italic leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${t.bg}`}>{t.initials}</div>
                  <div>
                    <div className="text-sm font-semibold text-sky-900">{t.name}</div>
                    <div className="text-xs text-sky-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="relative overflow-hidden bg-sky-950 text-white py-20 px-6 text-center">
        <div
          className="absolute inset-0 bg-center bg-cover pointer-events-none"
          style={{ backgroundImage: "url(/ora-football-bg.jpg)", opacity: 0.1 }}
        />
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="flex justify-center mb-6">
            <img src="/ora-superhero.png" alt="Ora" className="w-24 h-24 object-contain drop-shadow-xl hero-ora" />
          </div>
          <h2 className="text-4xl font-serif font-bold mb-4">Ready to stop the scheduling chaos?</h2>
          <p className="text-sky-300 text-lg mb-10">Free forever. No card required. Your first ora in 60 seconds.</p>
          <a href="/create" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-10 py-4 rounded-2xl text-base transition hover-lift">
            Create an ora now — it&apos;s free
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-sky-950 border-t border-sky-800 px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-sm text-sky-400">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg overflow-hidden border border-sky-700">
            <img src="/ora-superhero.png" alt="Ora" className="w-full h-full object-cover object-top" />
          </div>
          <span className="font-serif text-lg text-white font-bold">Slotora</span>
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-sky-200 transition">Privacy</a>
          <a href="#" className="hover:text-sky-200 transition">Terms</a>
          <a href="/pricing" className="hover:text-sky-200 transition">Pricing</a>
          <a href="mailto:alinpacurar@slotora.app" className="hover:text-sky-200 transition">Contact</a>
        </div>
        <div className="text-sky-500">© 2025 Slotora. Made in the UK, used worldwide.</div>
      </footer>

    </main>
  );
}