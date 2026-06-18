// ── StatusPanel — Person 3 (Phase 3, Task 2) ────────────────────────────────
// Glassmorphic results card that dynamically shifts its border and glow color
// based on the verdict classification tier: confirmed / unverified / contradicted.
//
// Person 4's job: replace the <DisclaimerBanner /> placeholder at the bottom
// of this component with the real DisclaimerBanner component they build.

import DisclaimerBanner from "./DisclaimerBanner";

// ── Types (shared contract) ───────────────────────────────────────────────────

export type ClaimType =
  | "tornado_touchdown"
  | "siren_malfunction"
  | "flooding"
  | "power_outage"
  | "other";

export type Verdict = "confirmed" | "unverified" | "contradicted";
export type Confidence = "high" | "medium" | "low";

export interface VerifyResponse {
  claim_text: string;
  extracted_location: string;
  claim_type: ClaimType;
  verdict: Verdict;
  confidence: Confidence;
  explanation: string;
  sources: string[];
  safety_disclaimer: string;
}

// ── Style maps (verdict tier → visual treatment) ──────────────────────────────

const VERDICT_BORDER: Record<Verdict, string> = {
  confirmed: "border-emerald-500/60 shadow-emerald-500/10",
  unverified: "border-amber-400/60 shadow-amber-400/10",
  contradicted: "border-rose-500/60 shadow-rose-500/10",
};

const VERDICT_GLOW: Record<Verdict, string> = {
  confirmed: "shadow-[0_0_40px_-8px_rgba(16,185,129,0.25)]",
  unverified: "shadow-[0_0_40px_-8px_rgba(251,191,36,0.2)]",
  contradicted: "shadow-[0_0_40px_-8px_rgba(239,68,68,0.25)]",
};

const VERDICT_BADGE: Record<Verdict, string> = {
  confirmed: "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40",
  unverified: "bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/40",
  contradicted: "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40",
};

const VERDICT_ICON: Record<Verdict, string> = {
  confirmed: "✅",
  unverified: "⚠️",
  contradicted: "🚫",
};

const CONFIDENCE_BADGE: Record<Confidence, string> = {
  high: "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/40",
  medium: "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/40",
  low: "bg-slate-500/20 text-slate-300 ring-1 ring-slate-500/40",
};

const CLAIM_LABEL: Record<ClaimType, string> = {
  tornado_touchdown: "🌪️ Tornado Touchdown",
  siren_malfunction: "🔊 Siren Malfunction",
  flooding: "🌊 Flooding",
  power_outage: "⚡ Power Outage",
  other: "📋 Other",
};

// ── Component ─────────────────────────────────────────────────────────────────

interface StatusPanelProps {
  result: VerifyResponse;
}

export default function StatusPanel({ result }: StatusPanelProps) {
  const borderClass = VERDICT_BORDER[result.verdict];
  const glowClass = VERDICT_GLOW[result.verdict];

  return (
    <section
      aria-label="Verification result"
      className={`rounded-2xl border bg-slate-900/50 backdrop-blur-md p-6 space-y-6 transition-all duration-500 ${borderClass} ${glowClass}`}
    >
      {/* ── Panel header: location + claim type ───────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-slate-400 text-sm font-medium">
          📍 {result.extracted_location}
        </span>
        <span className="text-slate-600 text-xs hidden sm:inline">•</span>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 ring-1 ring-slate-700">
          {CLAIM_LABEL[result.claim_type]}
        </span>
      </div>

      {/* ── Original claim text ────────────────────────────────────────── */}
      <blockquote className="border-l-2 border-slate-600 pl-4 italic text-slate-400 text-sm leading-relaxed">
        &ldquo;{result.claim_text}&rdquo;
      </blockquote>

      {/* ── Verdict + confidence tier badges ──────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize flex items-center gap-1.5 ${VERDICT_BADGE[result.verdict]}`}
          role="status"
          aria-label={`Verdict: ${result.verdict}`}
        >
          {VERDICT_ICON[result.verdict]} {result.verdict}
        </span>
        <span
          className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${CONFIDENCE_BADGE[result.confidence]}`}
          aria-label={`Confidence: ${result.confidence}`}
        >
          {result.confidence} confidence
        </span>
      </div>

      {/* ── Analysis explanation ───────────────────────────────────────── */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
          Analysis
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          {result.explanation}
        </p>
      </div>

      {/* ── Sources list ───────────────────────────────────────────────── */}
      {result.sources.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
            Sources Checked
          </h3>
          <ul className="space-y-1">
            {result.sources.map((src) => (
              <li key={src} className="flex items-start gap-1.5">
                <span className="text-slate-600 mt-0.5 text-xs">→</span>
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-sky-400 hover:text-sky-300 break-all underline underline-offset-2 transition-colors"
                >
                  {src}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Disclaimer — Person 4 builds DisclaimerBanner.tsx ─────────── */}
      <DisclaimerBanner
        message={result.safety_disclaimer}
        verdict={result.verdict}
      />
    </section>
  );
}
