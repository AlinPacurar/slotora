"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function CreatePoll() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [userPlan, setUserPlan] = useState("community");
  const [form, setForm] = useState({
    title: "", description: "", creatorName: "", dates: [], deadline: "",
    voteOptions: [], collectParticipantData: false, times: {},
  });
  const [editingTimeFor, setEditingTimeFor] = useState(null);
  const [timeInput, setTimeInput] = useState({ start: "", end: "" });
  const [applyToAll, setApplyToAll] = useState(false);
  const [useCustomOptions, setUseCustomOptions] = useState(false);
  const [customOption, setCustomOption] = useState("");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const isDragging = useRef(false);
  const dragMode = useRef(null);

  useEffect(() => {
    async function fetchPlan() {
      if (!session) return;
      try {
        const res = await fetch("/api/user/settings");
        const data = await res.json();
        setUserPlan(data.plan || "community");
      } catch (e) {
        console.error(e);
      }
    }
    fetchPlan();
  }, [session]);

  const maxOptions = userPlan === "ora" ? 999 : userPlan === "snap" ? 3 : 0;
  const canCustomise = maxOptions > 0;
  const canCollectData = ["snap", "ora"].includes(userPlan);

  const { year, month } = currentMonth;

  function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
  function getFirstDayOfMonth(y, m) { const day = new Date(y, m, 1).getDay(); return day === 0 ? 6 : day - 1; }
  function dateStr(y, m, d) { return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`; }
  function formatDateShort(str) { return new Date(str + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }); }
  function formatDateFull(str) { return new Date(str + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }); }
  function monthName(y, m) { return new Date(y, m, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" }); }

  function prevMonth() {
    setCurrentMonth(({ year, month }) => month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 });
  }
  function nextMonth() {
    setCurrentMonth(({ year, month }) => month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 });
  }

  function toggleDate(str) {
    setForm(prev => prev.dates.includes(str)
      ? { ...prev, dates: prev.dates.filter(d => d !== str) }
      : { ...prev, dates: [...prev.dates, str].sort() }
    );
  }

  function applyDrag(str) {
    setForm(prev => {
      if (dragMode.current === "add" && !prev.dates.includes(str)) return { ...prev, dates: [...prev.dates, str].sort() };
      if (dragMode.current === "remove" && prev.dates.includes(str)) return { ...prev, dates: prev.dates.filter(d => d !== str) };
      return prev;
    });
  }

  function onMouseDown(str) { isDragging.current = true; dragMode.current = form.dates.includes(str) ? "remove" : "add"; toggleDate(str); }
  function onMouseEnter(str) { if (isDragging.current) applyDrag(str); }
  function onMouseUp() { isDragging.current = false; dragMode.current = null; }
  function onTouchStart(str) { isDragging.current = true; dragMode.current = form.dates.includes(str) ? "remove" : "add"; toggleDate(str); }
  function onTouchMove(e) { if (!isDragging.current) return; const touch = e.touches[0]; const el = document.elementFromPoint(touch.clientX, touch.clientY); if (el && el.dataset.date) applyDrag(el.dataset.date); }
  function removeDate(str) { setForm(prev => ({ ...prev, dates: prev.dates.filter(d => d !== str) })); }

  function addCustomOption() {
    const val = customOption.trim();
    if (!val) return;
    if (form.voteOptions.includes(val)) return;
    if (maxOptions !== 999 && form.voteOptions.length >= maxOptions) return;
    setForm(prev => ({ ...prev, voteOptions: [...prev.voteOptions, val] }));
    setCustomOption("");
  }

  function removeCustomOption(opt) {
    setForm(prev => ({ ...prev, voteOptions: prev.voteOptions.filter(o => o !== opt) }));
  }

  async function handleSubmit() {
    if (!form.title || !form.creatorName || form.dates.length === 0) return;
    setLoading(true);
    setCreateError("");
    try {
      const payload = {
        ...form,
        voteOptions: useCustomOptions && form.voteOptions.length > 0 ? form.voteOptions : [],
        times: form.times,
      };
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.id) {
        setCreateError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      router.push(`/poll/${data.id}`);
    } catch (e) {
      console.error(e);
      setCreateError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date().toISOString().split("T")[0];
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col" onMouseUp={onMouseUp} onTouchEnd={onMouseUp} onTouchMove={onTouchMove}>

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-stone-200 px-6 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="Slotora" className="w-8 h-8 rounded-xl" />
          <span className="font-serif text-xl font-bold tracking-tight text-stone-900">Slotora</span>
        </a>
      </nav>

      {/* PROGRESS */}
      <div className="bg-white border-b border-stone-100 px-6 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step > s ? "bg-sky-400 text-white" : step === s ? "bg-stone-900 text-white" : "bg-stone-200 text-stone-400"}`}>
                {step > s ? "✓" : s}
              </div>
              <div className={`text-xs font-medium ${step === s ? "text-stone-900" : "text-stone-400"}`}>
                {s === 1 ? "Name it" : s === 2 ? "Pick dates" : "Finish"}
              </div>
              {s < 3 && <div className={`flex-1 h-px ${step > s ? "bg-sky-200" : "bg-stone-200"}`}></div>}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-6 py-12">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm w-full max-w-lg p-8">

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-serif font-bold text-stone-900 mb-1">Name your poll</h1>
              <p className="text-sm text-stone-400 mb-6">Give it a clear title so participants know what they&apos;re voting on.</p>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Poll title <span className="text-red-400">*</span></label>
              <input
                type="text"
                placeholder="e.g. Team offsite — when works?"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 mb-4"
              />
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Description <span className="text-stone-400 font-normal">(optional)</span></label>
              <textarea
                placeholder="Any extra context for participants..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 mb-6 resize-none"
              />

              {/* CUSTOM VOTE OPTIONS */}
              <div className={`rounded-xl p-4 mb-6 border ${canCustomise ? "border-sky-200 bg-sky-50" : "border-stone-200 bg-stone-50"}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm font-semibold text-stone-800">Custom vote options</div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      {canCustomise
                        ? `Replace Yes/No/Maybe with your own options (${userPlan === "ora" ? "unlimited" : `up to ${maxOptions}`})`
                        : "Available on Snap and Ora plans"}
                    </div>
                  </div>
                  {canCustomise ? (
                    <button
                      type="button"
                      onClick={() => setUseCustomOptions(!useCustomOptions)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useCustomOptions ? "bg-sky-500" : "bg-stone-300"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useCustomOptions ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  ) : (
                    <a href="/pricing" className="text-xs bg-sky-500 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-sky-600 transition">
                      Upgrade ↑
                    </a>
                  )}
                </div>

                {canCustomise && useCustomOptions && (
                  <div className="mt-3">
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="e.g. Available, Busy, Maybe..."
                        value={customOption}
                        onChange={(e) => setCustomOption(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addCustomOption()}
                        className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                      />
                      <button
                        type="button"
                        onClick={addCustomOption}
                        disabled={!customOption.trim() || (maxOptions !== 999 && form.voteOptions.length >= maxOptions)}
                        className="px-4 py-2 bg-sky-500 text-white text-sm font-semibold rounded-lg hover:bg-sky-600 disabled:bg-stone-200 disabled:text-stone-400 transition"
                      >
                        Add
                      </button>
                    </div>
                    {form.voteOptions.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {form.voteOptions.map(opt => (
                          <div key={opt} className="flex items-center gap-1 bg-white border border-sky-200 text-sky-800 text-xs font-medium px-2.5 py-1 rounded-full">
                            {opt}
                            <button onClick={() => removeCustomOption(opt)} className="text-sky-300 hover:text-sky-600 ml-0.5 font-bold">✕</button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-stone-400">Add at least 2 options to replace Yes/No/Maybe</div>
                    )}
                    {maxOptions !== 999 && (
                      <div className="text-xs text-stone-400 mt-2">{form.voteOptions.length}/{maxOptions} options used</div>
                    )}
                  </div>
                )}
              </div>

              {/* COLLECT PARTICIPANT DATA */}
              <div className={`rounded-xl p-4 mb-6 border ${canCollectData ? "border-sky-200 bg-sky-50" : "border-stone-200 bg-stone-50"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-stone-800">Collect participant info</div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      {canCollectData
                        ? "Ask voters for their email and/or phone number"
                        : "Available on Snap and Ora plans"}
                    </div>
                  </div>
                  {canCollectData ? (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, collectParticipantData: !form.collectParticipantData })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.collectParticipantData ? "bg-sky-500" : "bg-stone-300"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.collectParticipantData ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  ) : (
                    <a href="/pricing" className="text-xs bg-sky-500 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-sky-600 transition">
                      Upgrade ↑
                    </a>
                  )}
                </div>
              </div>

              <button
                onClick={() => form.title && setStep(2)}
                disabled={!form.title}
                className="w-full bg-stone-900 hover:bg-stone-700 disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold py-3 rounded-xl transition text-sm"
              >
                Next: pick dates →
              </button>
            </div>
          )}

          {/* STEP 2 — CALENDAR */}
          {step === 2 && (
            <div>
              <h1 className="text-2xl font-serif font-bold text-stone-900 mb-1">Pick your dates</h1>
              <p className="text-sm text-stone-400 mb-5">Click a date or <span className="font-medium text-stone-600">click and drag</span> to select a range. Click again to deselect.</p>

              <div className="border border-stone-200 rounded-xl overflow-hidden mb-4 select-none">
                <div className="flex items-center justify-between px-4 py-3 bg-stone-50 border-b border-stone-200">
                  <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-200 transition text-stone-600 font-bold">‹</button>
                  <span className="text-sm font-semibold text-stone-800">{monthName(year, month)}</span>
                  <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-200 transition text-stone-600 font-bold">›</button>
                </div>
                <div className="grid grid-cols-7 border-b border-stone-100">
                  {DAYS.map((d) => (
                    <div key={d} className={`text-center text-xs font-semibold py-2 ${d === "Sat" || d === "Sun" ? "text-stone-400" : "text-stone-500"}`}>{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="h-10" />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const str = dateStr(year, month, day);
                    const isSelected = form.dates.includes(str);
                    const isToday = str === today;
                    const isPast = str < today;
                    const isWeekend = new Date(str + "T00:00:00").getDay() === 0 || new Date(str + "T00:00:00").getDay() === 6;
                    return (
                      <div
                        key={str}
                        data-date={str}
                        onMouseDown={() => !isPast && onMouseDown(str)}
                        onMouseEnter={() => !isPast && onMouseEnter(str)}
                        onTouchStart={() => !isPast && onTouchStart(str)}
                        className={`h-10 flex items-center justify-center text-sm font-medium transition-all cursor-pointer relative
                          ${isPast ? "text-stone-300 cursor-not-allowed" :
                            isSelected ? "bg-sky-400 text-white" :
                              isWeekend ? "text-stone-400 hover:bg-stone-100" :
                                "text-stone-700 hover:bg-sky-50 hover:text-sky-600"}
                          ${isToday && !isSelected ? "ring-2 ring-inset ring-sky-300 rounded-lg" : ""}
                        `}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
              </div>

              {form.dates.length > 0 ? (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{form.dates.length} date{form.dates.length !== 1 ? "s" : ""} selected</div>
                    <button onClick={() => setForm({ ...form, dates: [] })} className="text-xs text-stone-400 hover:text-red-400 transition">Clear all</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {form.dates.map((d) => (
                      <div key={d} className="flex items-center gap-1 bg-sky-50 text-sky-800 text-xs font-medium px-2.5 py-1 rounded-full border border-sky-200">
                        {formatDateShort(d)}
                        <button onClick={() => removeDate(d)} className="text-sky-300 hover:text-sky-600 ml-0.5 font-bold">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-stone-200 rounded-xl p-4 text-center text-sm text-stone-400 mb-5">
                  No dates selected yet — click or drag on the calendar above
                </div>
              )}

              {/* TIME SLOTS */}
              {form.dates.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Times <span className="font-normal text-stone-400">(optional)</span></div>
                  </div>
                  <div className="space-y-2">
                    {form.dates.map(d => {
                      const timeVal = form.times[d];
                      const isEditing = editingTimeFor === d;
                      return (
                        <div key={d} className="flex items-center gap-2">
                          <div className="text-xs font-medium text-stone-600 w-24 flex-shrink-0">{formatDateShort(d)}</div>
                          {isEditing ? (
                            <div className="flex-1 bg-white border border-sky-200 rounded-xl p-3 shadow-sm">
                              <div className="flex gap-3 mb-3">
                                <div className="flex-1">
                                  <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Start time</div>
                                  <select
                                    value={timeInput.start}
                                    onChange={e => setTimeInput(t => ({ ...t, start: e.target.value }))}
                                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white"
                                  >
                                    <option value="">--</option>
                                    {Array.from({ length: 48 }, (_, i) => {
                                      const h = String(Math.floor(i / 2)).padStart(2, "0");
                                      const m = i % 2 === 0 ? "00" : "30";
                                      return <option key={i} value={`${h}:${m}`}>{`${h}:${m}`}</option>;
                                    })}
                                  </select>
                                </div>
                                <div className="flex items-end pb-2 text-stone-300 text-sm font-medium">→</div>
                                <div className="flex-1">
                                  <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">End time <span className="font-normal normal-case">(optional)</span></div>
                                  <select
                                    value={timeInput.end}
                                    onChange={e => setTimeInput(t => ({ ...t, end: e.target.value }))}
                                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white"
                                  >
                                    <option value="">--</option>
                                    {Array.from({ length: 48 }, (_, i) => {
                                      const h = String(Math.floor(i / 2)).padStart(2, "0");
                                      const m = i % 2 === 0 ? "00" : "30";
                                      return <option key={i} value={`${h}:${m}`}>{`${h}:${m}`}</option>;
                                    })}
                                  </select>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <button type="button" onClick={() => {
                                  let val = "";
                                  if (timeInput.start) {
                                    val = timeInput.end ? `${timeInput.start}–${timeInput.end}` : timeInput.start;
                                  }
                                  setForm(prev => {
                                    let newTimes = { ...prev.times };
                                    if (val) {
                                      if (applyToAll) {
                                        prev.dates.forEach(date => { newTimes[date] = val; });
                                      } else {
                                        newTimes[d] = val;
                                      }
                                    } else {
                                      delete newTimes[d];
                                    }
                                    return { ...prev, times: newTimes };
                                  });
                                  setEditingTimeFor(null);
                                  setTimeInput({ start: "", end: "" });
                                  setApplyToAll(false);
                                }} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition">
                                  Save
                                </button>
                                {form.dates.length > 1 && (
                                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={applyToAll}
                                      onChange={e => setApplyToAll(e.target.checked)}
                                      className="w-3.5 h-3.5 rounded accent-orange-500"
                                    />
                                    <span className="text-xs text-stone-500">Apply to all dates</span>
                                  </label>
                                )}
                                <button type="button" onClick={() => { setEditingTimeFor(null); setTimeInput({ start: "", end: "" }); setApplyToAll(false); }}
                                  className="ml-auto text-xs text-stone-400 hover:text-stone-600 transition">
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button type="button" onClick={() => {
                              setEditingTimeFor(d);
                              if (timeVal) {
                                const rangeMatch = timeVal.match(/^(\d{2}:\d{2})–(\d{2}:\d{2})/);
                                if (rangeMatch) {
                                  setTimeInput({ start: rangeMatch[1], end: rangeMatch[2] });
                                } else {
                                  setTimeInput({ start: timeVal, end: "" });
                                }
                              } else {
                                setTimeInput({ start: "", end: "" });
                              }
                            }}
                              className={`flex-1 text-left px-3 py-2 rounded-xl border text-sm transition ${timeVal ? "bg-sky-50 border-sky-200 text-sky-700 font-medium" : "border-dashed border-stone-200 text-stone-400 hover:border-sky-200 hover:text-sky-500"}`}>
                              {timeVal ? `🕐 ${timeVal}` : "+ Add time"}
                            </button>
                          )}
                          {timeVal && !isEditing && (
                            <button type="button" onClick={() => setForm(prev => { const t = { ...prev.times }; delete t[d]; return { ...prev, times: t }; })}
                              className="text-stone-300 hover:text-red-400 transition text-xs px-1">✕</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 border border-stone-300 text-stone-600 font-semibold py-3 rounded-xl hover:bg-stone-50 transition text-sm">← Back</button>
                <button
                  onClick={() => form.dates.length >= 1 && setStep(3)}
                  disabled={form.dates.length === 0}
                  className="flex-1 bg-stone-900 hover:bg-stone-700 disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold py-3 rounded-xl transition text-sm"
                >
                  Next: finish →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <h1 className="text-2xl font-serif font-bold text-stone-900 mb-1">Almost done!</h1>
              <p className="text-sm text-stone-400 mb-6">Just your name so participants know who created the poll.</p>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Your name <span className="text-red-400">*</span></label>
              <input
                type="text"
                placeholder="e.g. Sarah"
                value={form.creatorName}
                onChange={(e) => setForm({ ...form, creatorName: e.target.value })}
                className="w-full border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 mb-4"
              />
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Answer by date <span className="text-stone-400 font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={form.deadline || ""}
                min={today}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && val < today) return;
                  setForm({ ...form, deadline: val });
                }}
                className="w-full border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 mb-1"
              />
              {form.deadline && form.deadline < today && (
                <p className="text-xs text-red-400 mb-5">Answer by date cannot be in the past.</p>
              )}
              {(!form.deadline || form.deadline >= today) && <div className="mb-5" />}
              <div className="bg-stone-50 rounded-xl p-4 mb-6 border border-stone-100">
                <div className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">Poll summary</div>
                <div className="text-sm font-semibold text-stone-800 mb-1">{form.title}</div>
                {form.description && <div className="text-xs text-stone-500 mb-2">{form.description}</div>}
                {useCustomOptions && form.voteOptions.length >= 2 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {form.voteOptions.map(opt => (
                      <span key={opt} className="text-xs bg-sky-100 text-sky-600 px-2 py-0.5 rounded-full">{opt}</span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 mt-2 max-h-20 overflow-y-auto">
                  {form.dates.map((d) => (
                    <span key={d} className="text-xs bg-white border border-stone-200 text-stone-600 px-2 py-1 rounded-full">{formatDateFull(d)}</span>
                  ))}
                </div>
                <div className="text-xs text-stone-400 mt-2">{form.dates.length} date{form.dates.length !== 1 ? "s" : ""} selected</div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 border border-stone-300 text-stone-600 font-semibold py-3 rounded-xl hover:bg-stone-50 transition text-sm">← Back</button>
                <button
                  onClick={handleSubmit}
                  disabled={!form.creatorName || loading}
                  className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold py-3 rounded-xl transition text-sm"
                >
                  {loading ? "Creating..." : "Create poll →"}
                </button>
              </div>
              {createError && (
                <div className="mt-3 text-sm text-red-500 text-center">{createError}</div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}