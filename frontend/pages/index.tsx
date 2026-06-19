import { useState, useMemo } from "react";
import Head from "next/head";
import Image from "next/image";
import StatusPanel from "@/components/StatusPanel";
import type { VerifyResponse } from "@/components/StatusPanel";

// ── Static mock state ────────────────────────────────────────────────────────
const MOCK_RESULT: VerifyResponse = {
  claim_text:
    "I heard a tornado touched down near Stonebriar Centre mall in Frisco.",
  extracted_location: "Stonebriar Centre, Frisco, TX",
  claim_type: "tornado_touchdown",
  verdict: "unverified",
  confidence: "medium",
  explanation:
    "No active NWS tornado warnings are confirmed for Frisco at this time. The claim may reference a brief funnel cloud sighting. Treat as unverified until official NWS or local PD confirmation is issued.",
  sources: [
    "https://api.weather.gov/alerts/active?area=TX",
    "https://www.weather.gov/fwd/",
  ],
  safety_disclaimer:
    "⚠️ This is an AI-assisted analysis, not an official emergency broadcast. Always follow guidance from local emergency management and the National Weather Service.",
};

const EXAMPLES = [
  "Tornado touched down near Stonebriar Centre mall — sirens going off everywhere",
  "Frisco emergency sirens have been looping for 20 minutes, no official update",
  "Flash flooding on Preston Road near Legacy Drive, cars stranded",
  "ERCOT rolling blackouts hitting West Plano right now",
  "Hail the size of golf balls reported at Legacy West",
];

// ── Background scenes — img tag approach (bypasses CSP inline-style block) ───
type Scene = { url: string; label: string; keywords: string[] };

const BG_SCENES: Scene[] = [
  {
    keywords: ["tornado", "funnel", "twister", "rotation", "wedge", "touchdown"],
    url: "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=1920&q=80",
    label: "Tornado",
  },
  {
    keywords: ["flood", "flooding", "flash flood", "water", "stranded", "inundated", "surge"],
    url: "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1920&q=80",
    label: "Flooding",
  },
  {
    keywords: ["hail", "ice", "golf ball", "baseball sized", "hailstorm"],
    url: "https://images.unsplash.com/photo-1530908295418-a12e326966ba?auto=format&fit=crop&w=1920&q=80",
    label: "Hail Storm",
  },
  {
    keywords: ["power", "blackout", "outage", "ercot", "electric", "grid", "lights out", "rolling blackout"],
    url: "https://images.unsplash.com/photo-1548613053-22087dd8edb8?auto=format&fit=crop&w=1920&q=80",
    label: "Power Outage",
  },
  {
    keywords: ["siren", "emergency", "alert", "warning", "alarm", "dispatch"],
    url: "https://images.unsplash.com/photo-1580745294621-9e62e87e08b9?auto=format&fit=crop&w=1920&q=80",
    label: "Emergency Alert",
  },
  {
    keywords: ["lightning", "thunder", "thunderstorm", "storm", "severe"],
    url: "https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?auto=format&fit=crop&w=1920&q=80",
    label: "Thunderstorm",
  },
];

const DEFAULT_BG =
  "https://images.unsplash.com/photo-1531685250784-7569952593d2?auto=format&fit=crop&w=1920&q=80";

function detectScene(text: string): Scene | null {
  const lower = text.toLowerCase();
  for (const scene of BG_SCENES) {
    if (scene.keywords.some((kw) => lower.includes(kw))) return scene;
  }
  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scene = useMemo(() => detectScene(inputText), [inputText]);
  const bgUrl = scene?.url ?? DEFAULT_BG;

  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim_text: inputText }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  return (
    <>
      <Head>
        <title>DFW Rumor Radar – Emergency Claim Verifier</title>
        <meta name="description" content="AI-powered emergency claim verification for DFW block leaders and community coordinators." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Georgia / Times New Roman serif stack */}
        <style>{`
          :root { --font-serif: Georgia, "Times New Roman", Times, serif; }
          body { background: #0a0f1e; }
        `}</style>
      </Head>

      {/* ── Root shell ────────────────────────────────────────────────── */}
      <div className="min-h-screen text-slate-100 relative" style={{ fontFamily: "Georgia, 'Times New Roman', Times, serif" }}>

        {/* ── Dynamic full-bleed background (img tag — not inline style) */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <Image
            key={bgUrl}
            src={bgUrl}
            alt=""
            fill
            priority
            quality={85}
            className="object-cover object-center transition-opacity duration-1000"
            aria-hidden="true"
          />
          {/* Layered gradient overlay for legibility */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1e]/90 via-[#0a0f1e]/70 to-[#0a0f1e]/85" />
          <div className="absolute inset-0 bg-[#0a0f1e]/30 backdrop-blur-[1px]" />
        </div>

        {/* ── Header — navy blue ─────────────────────────────────────── */}
        <header className="sticky top-0 z-50 border-b border-white/10" style={{ background: "rgba(10,20,60,0.92)", backdropFilter: "blur(20px)" }}>
          <div className="mx-auto max-w-7xl px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                🌩️
              </div>
              <div>
                <h1 className="text-base font-semibold tracking-tight text-white" style={{ letterSpacing: "-0.01em" }}>
                  DFW Rumor Radar
                </h1>
                <p className="text-[11px] text-slate-400 tracking-wide uppercase">Emergency Claim Verification · North Texas</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Live status pill */}
              <div className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-emerald-300" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                NWS Live Feed
              </div>

              {/* Scene badge */}
              {scene && (
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                  {scene.label} detected
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Two-column main ─────────────────────────────────────────── */}
        <main className="mx-auto max-w-7xl px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

            {/* ══════════════════════════════════════════════════════════
                LEFT — Input panel
            ══════════════════════════════════════════════════════════ */}
            <div className="space-y-7">

              {/* Hero */}
              <section aria-labelledby="hero-heading" className="space-y-4">
                <div
                  className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-sky-300 tracking-wide"
                  style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)" }}
                >
                  <span>📡</span> Built for DFW Block Leaders &amp; Community Coordinators
                </div>

                <h2
                  id="hero-heading"
                  className="text-4xl font-bold text-white leading-tight"
                  style={{ letterSpacing: "-0.03em" }}
                >
                  Is what your neighborhood<br />
                  <span className="text-slate-300">is saying actually</span>{" "}
                  <span style={{ color: "#38bdf8" }}>true?</span>
                </h2>

                <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                  When a storm warning spreads through your WhatsApp group or Nextdoor feed, you need facts — fast. Get an instant cross-reference against live{" "}
                  <span className="text-slate-200 font-medium">NWS Fort Worth</span>,{" "}
                  <span className="text-slate-200 font-medium">ERCOT grid</span>, and{" "}
                  <span className="text-slate-200 font-medium">local PD feeds</span>.
                </p>

                {/* Stats row */}
                <div className="flex gap-6 pt-1">
                  {[
                    { value: "3", label: "Live Data Sources" },
                    { value: "DFW", label: "Metroplex Coverage" },
                    { value: "~2s", label: "Response Time" },
                  ].map((s) => (
                    <div key={s.label} className="flex flex-col">
                      <span className="text-2xl font-bold text-white" style={{ letterSpacing: "-0.04em" }}>{s.value}</span>
                      <span className="text-[11px] text-slate-500 mt-0.5 uppercase tracking-widest">{s.label}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Input card */}
              <section
                aria-label="Claim input"
                className="rounded-2xl p-6 space-y-4"
                style={{ background: "rgba(15,23,42,0.65)", border: "1px solid rgba(255,255,255,0.09)", backdropFilter: "blur(24px)" }}
              >
                <div className="flex items-center justify-between">
                  <label htmlFor="claim-input" className="text-sm font-semibold text-slate-200 tracking-tight">
                    Enter the claim you heard
                  </label>
                  <span className="text-xs text-slate-600 tabular-nums">{inputText.length} / 500</span>
                </div>

                <textarea
                  id="claim-input"
                  rows={4}
                  maxLength={500}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Paste a rumor, social post, or voice-message transcript here…"
                  className="w-full rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 resize-none transition-all focus:outline-none focus:ring-2 focus:ring-sky-500/60"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    fontFamily: "inherit",
                    lineHeight: "1.6",
                  }}
                  aria-describedby="input-hint"
                />

                <p id="input-hint" className="text-xs text-slate-600 leading-relaxed">
                  Tip: Include location names, street intersections, or landmarks for the most accurate result. Press{" "}
                  <kbd className="rounded-md px-1.5 py-0.5 text-slate-400 text-xs" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>⌘ Enter</kbd>{" "}
                  to submit.
                </p>

                {/* Example pills */}
                <div>
                  <p className="text-xs text-slate-600 mb-2.5 uppercase tracking-widest">Try an example:</p>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLES.map((ex) => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => setInputText(ex)}
                        className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-all text-left"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      >
                        {ex.length > 52 ? ex.slice(0, 52) + "…" : ex}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div role="alert" className="rounded-xl px-4 py-3 text-sm text-rose-300" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
                    ⚠️ {error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !inputText.trim()}
                    className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                    style={{ background: loading ? "rgba(56,189,248,0.5)" : "linear-gradient(135deg,#0ea5e9,#2563eb)", boxShadow: "0 4px 24px rgba(14,165,233,0.3)" }}
                    aria-label="Verify claim"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Verifying…
                      </>
                    ) : (
                      <>⚡ Verify Claim</>
                    )}
                  </button>

                  {(result || error) && !loading && (
                    <button
                      type="button"
                      onClick={() => { setResult(null); setInputText(""); setError(null); }}
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </section>
            </div>

            {/* ══════════════════════════════════════════════════════════
                RIGHT — Results panel
            ══════════════════════════════════════════════════════════ */}
            <div className="lg:sticky lg:top-24">
              {result ? (
                <StatusPanel result={result} />
              ) : (
                <div
                  className="rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-5 min-h-[360px]"
                  style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(24px)" }}
                >
                  <div className="text-5xl opacity-20 select-none">🔍</div>
                  <div className="space-y-1">
                    <p className="text-slate-300 text-sm font-medium">Awaiting your claim</p>
                    <p className="text-slate-600 text-xs max-w-[220px] leading-relaxed">
                      Your AI-powered verification result will appear here once you submit.
                    </p>
                  </div>
                  {loading && (
                    <div className="flex items-center gap-2 text-sky-400 text-sm">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Cross-referencing live feeds…
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* ════════════════════════════════════════════════════════════
              CASE STUDY — full width below the two columns
          ════════════════════════════════════════════════════════════ */}
          <section
            aria-labelledby="case-study-heading"
            className="mt-16 rounded-2xl overflow-hidden"
            style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(239,68,68,0.2)", backdropFilter: "blur(24px)" }}
          >
            {/* Red accent bar */}
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#dc2626,#f87171,#dc2626)" }} />

            <div className="p-8 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">

              {/* Icon column */}
              <div className="flex flex-col items-center md:items-start gap-3">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.25)" }}
                >
                  🌪️
                </div>
                <div>
                  <p className="text-xs text-rose-400 font-semibold uppercase tracking-widest mb-1">Why This Matters</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Source: <a href="https://people.com" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:text-rose-300 underline underline-offset-2">People Magazine</a>,<br />
                    December 2024
                  </p>
                </div>
              </div>

              {/* Text column — spans 2 */}
              <div className="md:col-span-2 space-y-4">
                <h3
                  id="case-study-heading"
                  className="text-xl font-bold text-white leading-snug"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  A single unverified rumor can cost a life.
                </h3>

                <p className="text-slate-300 text-sm leading-relaxed">
                  In 2024, <strong className="text-white">Jamie Brown, 46</strong>, was killed when a tornado destroyed her home in Texas. During severe weather events, false social media rumors can cause people to ignore official warnings or delay seeking shelter — with fatal consequences.
                </p>

                <blockquote
                  className="rounded-xl px-5 py-4 border-l-4 border-rose-500"
                  style={{ background: "rgba(220,38,38,0.07)" }}
                >
                  <p className="text-sm text-rose-200 italic leading-relaxed">
                    "An AI weather-verification tool could help users quickly determine whether weather claims are true before making potentially life-saving decisions."
                  </p>
                </blockquote>

                <p className="text-slate-400 text-sm leading-relaxed">
                  With <strong className="text-white">DFW Rumor Radar</strong>, block leaders and community coordinators can clear up dangerous misconceptions in seconds — cross-referencing live NWS, ERCOT, and local PD data before a rumor spreads further.
                </p>

                {/* CTA row */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <div
                    className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-rose-300"
                    style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.25)" }}
                  >
                    🚨 Misinformation saves no one
                  </div>
                  <div
                    className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-emerald-300"
                    style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}
                  >
                    ✅ Verify before you share
                  </div>
                </div>
              </div>

            </div>
          </section>

        </main>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <footer className="relative mt-12 border-t" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(10,20,60,0.6)" }}>
          <div className="mx-auto max-w-7xl px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
            <span>DFW Rumor Radar · Built for community safety</span>
            <span>Not an official emergency broadcast system · Always follow local emergency management</span>
          </div>
        </footer>

      </div>
    </>
  );
}
