"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const plans = [
  {
    key: "community",
    name: "Community",
    monthly: 0,
    description: "For groups getting started",
    audience: "Casual groups · one-off events · family plans",
    badge: null,
    features: [
      { text: "Unlimited polls & sign-ups", included: true },
      { text: "Yes / No / Maybe voting", included: true },
      { text: "Comments & deadlines", included: true },
      { text: "Share via link", included: true },
      { text: "No ads", included: false },
      { text: "CSV export", included: false },
      { text: "Vote reminders", included: false },
      { text: "Custom vote options", included: false },
      { text: "Collect participant data", included: false },
      { text: "Fee collection", included: false },
      { text: "Custom branding", included: false },
    ],
  },
  {
    key: "slot",
    name: "Slot",
    monthly: 4,
    description: "For regular organisers",
    audience: "Coaches · teachers · PTA leads · team captains",
    badge: null,
    features: [
      { text: "Everything in Community", included: true },
      { text: "No ads", included: true },
      { text: "Vote reminders", included: true },
      { text: "CSV export", included: true },
      { text: "1 file upload (2MB) per poll", included: true },
      { text: "Custom vote options", included: false },
      { text: "Collect participant data", included: false },
      { text: "Fee collection", included: false },
      { text: "Custom branding", included: false },
    ],
  },
  {
    key: "snap",
    name: "Snap",
    monthly: 9,
    description: "For teams & committees",
    audience: "Committees · sports teams · schools · multiple organisers",
    badge: "Most popular",
    features: [
      { text: "Everything in Slot", included: true },
      { text: "3 file uploads (5MB each)", included: true },
      { text: "Up to 3 custom vote options", included: true },
      { text: "Collect participant data", included: true },
      { text: "Fee collection", included: false },
      { text: "Custom branding", included: false },
    ],
  },
  {
    key: "ora",
    name: "Ora",
    monthly: 19,
    description: "For organisations & leagues",
    audience: "Schools · charities · associations · leagues",
    badge: "Best value",
    features: [
      { text: "Everything in Snap", included: true },
      { text: "5 file uploads (10MB each)", included: true },
      { text: "Unlimited custom vote options", included: true },
      { text: "Fee collection from participants", included: true },
      { text: "Custom branding on polls", included: true },
      { text: "Priority support", included: true },
    ],
  },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [yearly, setYearly] = useState(true); // default yearly
  const [loading, setLoading] = useState(null);

  async function handleUpgrade(planKey) {
    if (planKey === "community") return;
    if (!session) {
      router.push("/signup?redirect=pricing");
      return;
    }
    setLoading(planKey);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey, billing: yearly ? "yearly" : "monthly" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-white">

      <style>{`
        .hover-lift{transition:transform .2s ease,box-shadow .2s ease}
        .hover-lift:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(14,165,233,.12)}
      `}</style>

      {/* NAV */}
      <div className="flex items-center gap-2">
        <a href="/" className="hidden sm:block text-sm text-sky-900/60 hover:text-sky-900 px-3 py-1.5 rounded-lg hover:bg-sky-50 transition">Home</a>
        {session ? (
          <>
            <a href="/dashboard" className="hidden sm:block text-sm text-sky-900/60 hover:text-sky-900 px-3 py-1.5 rounded-lg hover:bg-sky-50 transition">Dashboard</a>
            <button onClick={() => signOut({ callbackUrl: "/" })} className="hidden sm:block text-sm text-sky-900/60 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">Log out</button>
            <a href="/dashboard" className="sm:hidden text-sm bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-xl transition">Dashboard</a>
          </>
        ) : (
          <>
            <a href="/login" className="hidden sm:block text-sm text-sky-900/70 font-medium px-3 py-1.5 transition">Log in</a>
            <a href="/signup" className="text-sm bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-xl transition">Sign up free</a>
          </>
        )}
      </div>

      {/* HERO BANNER — Ora pricing image full 16:9 */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/9" }}>
        <img
          src="/ora-pricing.jpg"
          alt="Ora — helping build a community"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-sky-950/80 via-sky-950/50 to-transparent flex items-center px-8 md:px-16">
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 bg-orange-500/90 text-white text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              Simple, transparent pricing
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-white leading-tight mb-3">
              I&apos;m helping build<br />
              <span className="italic text-orange-400">a community!</span>
            </h1>
            <p className="text-sky-200 text-sm md:text-base leading-relaxed">
              From casual family plans to full league management — there&apos;s a plan for every group.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 relative z-10 -mt-40 md:-mt-64">

        {/* BILLING TOGGLE */}
        <div className="flex flex-col items-center gap-3 mb-10">
          <div className="inline-flex items-center gap-1 bg-sky-100 p-1 rounded-xl">
            <button
              onClick={() => setYearly(false)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition ${!yearly ? "bg-white text-sky-900 shadow-sm" : "text-sky-500"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${yearly ? "bg-white text-sky-900 shadow-sm" : "text-sky-500"}`}
            >
              Yearly
              <span className="text-xs bg-orange-500 text-white font-semibold px-2 py-0.5 rounded-full">Save 20%</span>
            </button>
          </div>
          {yearly && (
            <p className="text-xs text-sky-500 font-medium">🎉 You&apos;re saving 20% with yearly billing!</p>
          )}
        </div>

        {/* PLANS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`rounded-2xl border p-6 flex flex-col relative hover-lift ${plan.key === "snap"
                ? "bg-sky-950 border-sky-800 shadow-xl shadow-sky-900/30"
                : "bg-white border-sky-100"
                }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${plan.key === "snap" ? "text-sky-300" : "text-orange-500"}`}>
                {plan.name}
              </div>

              <div className={`text-3xl font-serif font-bold mb-0.5 ${plan.key === "snap" ? "text-white" : "text-sky-950"}`}>
                {plan.monthly === 0 ? (
                  "Free"
                ) : (
                  <>
                    £{yearly ? (plan.monthly * 0.8).toFixed(2) : plan.monthly}
                    <span className={`text-base font-normal ${plan.key === "snap" ? "text-sky-400" : "text-sky-400"}`}>/mo</span>
                  </>
                )}
              </div>

              {plan.monthly > 0 && (
                <div className={`text-xs mb-1 ${plan.key === "snap" ? "text-sky-400" : "text-sky-400"}`}>
                  {yearly
                    ? `Billed £${(plan.monthly * 12 * 0.8).toFixed(2)}/year`
                    : `or £${(plan.monthly * 12 * 0.8).toFixed(2)}/year — save 20%`}
                </div>
              )}

              <p className={`text-sm font-medium mt-1 mb-1 ${plan.key === "snap" ? "text-sky-200" : "text-sky-900"}`}>
                {plan.description}
              </p>
              <p className={`text-xs mb-4 leading-relaxed ${plan.key === "snap" ? "text-sky-400" : "text-sky-500/70"}`}>
                {plan.audience}
              </p>

              <button
                onClick={() => handleUpgrade(plan.key)}
                disabled={loading === plan.key || plan.key === "community"}
                className={`w-full text-center text-sm font-semibold py-2.5 rounded-xl transition mb-5 ${plan.key === "snap"
                  ? "bg-orange-500 hover:bg-orange-600 text-white disabled:bg-orange-300"
                  : plan.key === "community"
                    ? "border-2 border-sky-200 text-sky-600 cursor-default"
                    : "border-2 border-sky-200 text-sky-700 hover:bg-sky-50 disabled:opacity-50"
                  }`}
              >
                {loading === plan.key ? "Redirecting..." : plan.key === "community" ? "Get started free" : `Get ${plan.name}`}
              </button>

              <ul className="space-y-2.5 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <span className={`mt-0.5 flex-shrink-0 leading-none font-bold ${f.included
                      ? plan.key === "snap" ? "text-orange-400" : "text-orange-500"
                      : plan.key === "snap" ? "text-sky-700" : "text-sky-200"
                      }`}>
                      {f.included ? "✓" : "✕"}
                    </span>
                    <span className={
                      f.included
                        ? plan.key === "snap" ? "text-sky-100" : "text-sky-800"
                        : plan.key === "snap" ? "text-sky-600" : "text-sky-300/60"
                    }>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* WHO IS SLOTORA FOR */}
        <div className="relative rounded-3xl overflow-hidden mb-16">
          <div className="bg-sky-50 border border-sky-100 rounded-3xl p-8">
            <h2 className="text-2xl font-serif font-bold text-sky-950 text-center mb-8">
              Built for real-world organisers
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: "⚽", title: "Sports clubs", desc: "Training schedules, match sign-ups, kit collections" },
                { icon: "🏫", title: "Schools & PTAs", desc: "Parent meetings, trips, fundraising sign-ups" },
                { icon: "🎭", title: "Community groups", desc: "Events, rehearsals, volunteering rotas" },
                { icon: "🏆", title: "Leagues & associations", desc: "Fixtures, AGMs, committee votes" },
              ].map(item => (
                <div key={item.title} className="text-center bg-white rounded-2xl p-5 border border-sky-100 hover-lift">
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <div className="text-sm font-semibold text-sky-900 mb-1">{item.title}</div>
                  <div className="text-xs text-sky-500/70 leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-serif font-bold text-sky-950 text-center mb-8">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {[
              { q: "Can I switch plans anytime?", a: "Yes — upgrade or downgrade at any time. Changes take effect immediately." },
              { q: "What happens to my polls if I downgrade?", a: "Your existing polls stay intact. You just lose access to premium features on new polls going forward." },
              { q: "Do participants need an account to vote?", a: "No — anyone with the link can vote without creating an account. Only organisers need an account." },
              { q: "How does fee collection work on Ora?", a: "Ora plan organisers can request a payment from participants when they sign up or vote. Fees are processed securely via Stripe and paid directly to your account." },
              { q: "Is there a free trial for paid plans?", a: "Not currently, but the Community plan is generous and gives you a great feel for the product." },
              { q: "What payment methods do you accept?", a: "All major credit and debit cards via Stripe. Your payment info is never stored on our servers." },
            ].map((faq, i) => (
              <div key={i} className="bg-white border border-sky-100 rounded-2xl px-6 py-5 hover-lift">
                <div className="text-sm font-semibold text-sky-900 mb-1.5">{faq.q}</div>
                <div className="text-sm text-sky-700/60 leading-relaxed">{faq.a}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* CTA */}
      <section className="bg-sky-950 text-white py-16 px-6 text-center mt-16">
        <div className="flex justify-center mb-4">
          <img src="/ora-superhero.png" alt="Ora" className="w-16 h-16 object-contain drop-shadow-xl" style={{ animation: "hero-float 4s ease-in-out infinite" }} />
        </div>
        <h2 className="text-3xl font-serif font-bold mb-3">Ready to bring your group together?</h2>
        <p className="text-sky-300 mb-8">Free forever. No card required.</p>
        <a href="/signup" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-2xl transition hover-lift">
          Get started free →
        </a>
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
          <a href="/" className="hover:text-sky-200 transition">Home</a>
          <a href="/dashboard" className="hover:text-sky-200 transition">Dashboard</a>
          <a href="mailto:alinpacurar@slotora.app" className="hover:text-sky-200 transition">Contact</a>
        </div>
        <div className="text-sky-500">© 2025 Slotora. Made in the UK.</div>
      </footer>

    </div>
  );
}