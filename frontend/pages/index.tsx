import { useState } from "react";
import Head from "next/head";
import { Geist } from "next/font/google";

const geist = Geist({ subsets: ["latin"] });

// ── Types ────────────────────────────────────────────────────────────────────

type ClaimType =
  | "tornado_touchdown"
  | "siren_malfunction"
  | "flooding"
  | "power_outage"
  | "other";

type Verdict = "confirmed" | "unverified" | "contradicted";
type Confidence = "high" | "medium" | "low";

interface VerifyResponse {
  claim_text: string;
  extracted_location: string;
  claim_type: ClaimType;
  verdict: Verdict;
  confidence: Confidence;
  explanation: string;
  sources: string[];
  safety_disclaimer: string;
}

// ── Static mock state (matches shared JSON contract exactly) ─────────────────
// This will be replaced in Phase 4 with a real POST /api/verify fetch call.

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

// ── Helpers ───────────────────────────────────────────────────────────────────

const VERDICT_STYLES: Record<Verdict, string> = {
  confirmed: "border-emerald-500/60 shadow-emerald-500/10",
  unverified: "border-amber-400/60 shadow-amber-400/10",
  contradicted: "border-rose-500/60 shadow-rose-500/10",
};

const VERDICT_BADGE: Record<Verdict, string> = {
  confirmed: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/40",
  unverified: "bg-amber-400/20 text-amber-300 ring-amber-400/40",
  contradicted: "bg-rose-500/20 text-rose-300 ring-rose-500/40",
};

const CONFIDENCE_BADGE: Record<Confidence, string> = {
  high: "bg-sky-500/20 text-sky-300 ring-sky-500/40",
  medium: "bg-violet-500/20 text-violet-300 ring-violet-500/40",
  low: "bg-slate-500/20 text-slate-300 ring-slate-500/40",
};

const CLAIM_LABEL: Record<ClaimType, string> = {
  tornado_touchdown: "Tornado Touchdown",
  siren_malfunction: "Siren Malfunction",
  flooding: "Flooding",
  power_outage: "Power Outage",
  other: "Other",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function Home() {
  // Static mock state — swap this for a real API response in Phase 4
  const [result] = useState<VerifyResponse | null>(MOCK_RESULT);
  const [inputText, setInputText] = useState("");
  const [loading] = useState(false);

  const verdictStyle = result ? VERDICT_STYLES[result.verdict] : "";

  return (
    <>
      <Head>
        <title>DFW Rumor Radar – Emergency Claim Verifier</title>
        <meta
          name="description"
          content="AI-powered emergency claim verification for the DFW Metroplex"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div
        className={`${geist.className} min-h-screen bg-slate-950 text-slate-100`}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
          <div className="mx-auto max-w-3xl px-6 py-4 flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label="radar">
              🌩️
            </span>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                DFW Rumor Radar
              </h1>
              <p className="text-xs text-slate-400">
                Emergency claim verification · North Texas
              </p>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-6 py-10 space-y-8">
          {/* ── Hero copy ─────────────────────────────────────────────── */}
          <section aria-labelledby="hero-heading">
            <h2
              id="hero-heading"
              className="text-3xl font-bold tracking-tight text-slate-50"
            >
              Is what you heard actually happening?
            </h2>
            <p className="mt-2 text-slate-400 text-base leading-relaxed">
              Paste a community claim — a social post, group chat message, or
              rumor — and get an instant analysis against live NWS alerts, ERCOT
              data, and local public safety feeds for the DFW area.
            </p>
          </section>

          {/* ── Input card ────────────────────────────────────────────── */}
          <section
            aria-label="Claim input"
            className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-6 space-y-4"
          >
            <label
              htmlFor="claim-input"
              className="block text-sm font-medium text-slate-300"
            >
              What did you hear?
            </label>
            <textarea
              id="claim-input"
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder='e.g. "Tornado touched down near Stonebriar Centre mall in Frisco — sirens going off everywhere"'
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              aria-describedby="input-hint"
            />
            <p id="input-hint" className="text-xs text-slate-500">
              Be as specific as possible — include location names, street
              intersections, or landmarks.
            </p>
            <button
              type="button"
              disabled={loading || inputText.trim().length === 0}
              className="w-full sm:w-auto rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed px-6 py-3 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              aria-label="Verify claim"
            >
              {loading ? "Verifying…" : "Verify Claim"}
            </button>
          </section>

          {/* ── Results panel (glassmorphic, shown when result is present) */}
          {result && (
            <section
              aria-label="Verification result"
              className={`rounded-2xl border bg-slate-900/50 backdrop-blur-md shadow-xl p-6 space-y-6 ${verdictStyle}`}
            >
              {/* Location + claim type row */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-400 text-sm">
                  📍 {result.extracted_location}
                </span>
                <span className="text-slate-600 text-xs hidden sm:inline">
                  •
                </span>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 ring-1 ring-slate-700">
                  {CLAIM_LABEL[result.claim_type]}
                </span>
              </div>

              {/* Claim text */}
              <blockquote className="border-l-2 border-slate-600 pl-4 italic text-slate-400 text-sm leading-relaxed">
                &ldquo;{result.claim_text}&rdquo;
              </blockquote>

              {/* Verdict + confidence badges */}
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 capitalize ${VERDICT_BADGE[result.verdict]}`}
                  role="status"
                  aria-label={`Verdict: ${result.verdict}`}
                >
                  {result.verdict}
                </span>
                <span
                  className={`rounded-full px-4 py-1.5 text-sm font-medium ring-1 capitalize ${CONFIDENCE_BADGE[result.confidence]}`}
                  aria-label={`Confidence: ${result.confidence}`}
                >
                  {result.confidence} confidence
                </span>
              </div>

              {/* Explanation */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Analysis
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {result.explanation}
                </p>
              </div>

              {/* Sources */}
              {result.sources.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                    Sources
                  </h3>
                  <ul className="space-y-1">
                    {result.sources.map((src) => (
                      <li key={src}>
                        <a
                          href={src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-sky-400 hover:text-sky-300 break-all underline underline-offset-2"
                        >
                          {src}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ── Safety disclaimer (persistent, always visible when result present) */}
              <div
                role="alert"
                aria-live="polite"
                className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-5 py-4"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-1">
                  Safety Notice
                </p>
                <p className="text-sm text-amber-200 leading-relaxed">
                  {result.safety_disclaimer}
                </p>
              </div>
            </section>
          )}
        </main>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <footer className="border-t border-slate-800 mt-16">
          <div className="mx-auto max-w-3xl px-6 py-6 text-xs text-slate-600 text-center">
            DFW Rumor Radar · Built for community safety · Not an official
            emergency broadcast system
          </div>
        </footer>
      </div>
    </>
  );
}
