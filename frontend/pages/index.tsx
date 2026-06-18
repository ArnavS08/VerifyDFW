import { useState } from "react";
import Head from "next/head";
import { Geist } from "next/font/google";
import StatusPanel from "@/components/StatusPanel";
import type { VerifyResponse } from "@/components/StatusPanel";

const geist = Geist({ subsets: ["latin"] });

// ── Static mock state (matches shared JSON contract exactly) ─────────────────
// Phase 4: replace with real POST /api/verify fetch result.

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

// ── Example prompts for the DFW Block Leader persona ─────────────────────────

const EXAMPLES = [
  "Tornado touched down near Stonebriar Centre mall — sirens going off everywhere",
  "Frisco emergency sirens have been looping for 20 minutes, no official update",
  "Flash flooding on Preston Road near Legacy Drive, cars stranded",
  "ERCOT rolling blackouts hitting West Plano right now",
  "Hail the size of golf balls reported at Legacy West",
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<VerifyResponse | null>(MOCK_RESULT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phase 4: swap the stub block below for the real fetch call.
  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // ── Uncomment in Phase 4 ────────────────────────────────────────
      // const res = await fetch("/api/verify", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ claim_text: inputText }),
      // });
      // if (!res.ok) throw new Error(`Server error: ${res.status}`);
      // const data: VerifyResponse = await res.json();
      // setResult(data);
      // ────────────────────────────────────────────────────────────────

      // Temporary stub — remove when backend is ready
      await new Promise((r) => setTimeout(r, 1200));
      setResult({ ...MOCK_RESULT, claim_text: inputText });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
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
        <meta
          name="description"
          content="AI-powered emergency claim verification for DFW block leaders and community coordinators."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={`${geist.className} min-h-screen bg-slate-950 text-slate-100`}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
          <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl" role="img" aria-label="storm">🌩️</span>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">DFW Rumor Radar</h1>
                <p className="text-xs text-slate-400">Emergency claim verification · North Texas</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              NWS Live
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-6 py-10 space-y-8">

          {/* ── Hero ──────────────────────────────────────────────────── */}
          <section aria-labelledby="hero-heading" className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-400">
              <span>📡</span> Built for DFW Block Leaders &amp; Community Coordinators
            </div>
            <h2
              id="hero-heading"
              className="text-3xl font-bold tracking-tight text-slate-50 leading-tight"
            >
              Is what your neighborhood<br />
              is saying actually true?
            </h2>
            <p className="text-slate-400 text-base leading-relaxed max-w-xl">
              When a storm warning spreads through your WhatsApp group or
              Nextdoor feed, you need facts — fast. Paste any claim below and
              get an instant cross-reference against live{" "}
              <span className="text-slate-300 font-medium">NWS Fort Worth</span>,{" "}
              <span className="text-slate-300 font-medium">ERCOT grid</span>, and{" "}
              <span className="text-slate-300 font-medium">local PD feeds</span>.
            </p>
            <div className="flex flex-wrap gap-4 pt-1">
              {[
                { label: "Data Sources", value: "3 Live" },
                { label: "Coverage", value: "DFW Metroplex" },
                { label: "Response", value: "~2 sec" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-lg font-bold text-slate-50">{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Tactical input card ───────────────────────────────────── */}
          <section
            aria-label="Claim input"
            className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <label htmlFor="claim-input" className="text-sm font-semibold text-slate-200">
                Enter the claim you heard
              </label>
              <span className="text-xs text-slate-500">{inputText.length} / 500</span>
            </div>

            <textarea
              id="claim-input"
              rows={4}
              maxLength={500}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste a rumor, social post, or voice-message transcript here…"
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none transition-colors"
              aria-describedby="input-hint"
            />

            <p id="input-hint" className="text-xs text-slate-500">
              Tip: Include location names, street intersections, or landmarks for the most accurate
              result. Press{" "}
              <kbd className="rounded bg-slate-700 px-1 py-0.5 font-mono text-slate-300">⌘ Enter</kbd>{" "}
              to submit.
            </p>

            <div>
              <p className="text-xs text-slate-500 mb-2">Try an example:</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setInputText(ex)}
                    className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors text-left"
                  >
                    {ex.length > 50 ? ex.slice(0, 50) + "…" : ex}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
              >
                ⚠️ {error}
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || inputText.trim().length === 0}
                className="rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed px-6 py-3 text-sm font-semibold text-white transition-all focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900 flex items-center gap-2"
                aria-label="Verify claim"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Verifying…
                  </>
                ) : (
                  <>⚡ Verify Claim</>
                )}
              </button>
              {result && !loading && (
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

          {/* ── Glassmorphic status panel (Person 3 component) ───────── */}
          {result && <StatusPanel result={result} />}

        </main>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <footer className="border-t border-slate-800 mt-16">
          <div className="mx-auto max-w-3xl px-6 py-6 text-xs text-slate-600 text-center">
            DFW Rumor Radar · Built for community safety · Not an official emergency broadcast system
          </div>
        </footer>
      </div>
    </>
  );
}
