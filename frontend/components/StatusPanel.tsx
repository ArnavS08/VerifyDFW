import DisclaimerBanner from "./DisclaimerBanner";

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

const VERDICT_BORDER: Record<Verdict, string> = {
  confirmed: "border-emerald-500/40",
  unverified: "border-amber-400/40",
  contradicted: "border-rose-500/40",
};

const VERDICT_DOT: Record<Verdict, string> = {
  confirmed: "bg-emerald-500",
  unverified: "bg-amber-400",
  contradicted: "bg-rose-500",
};

const VERDICT_TEXT: Record<Verdict, string> = {
  confirmed: "text-emerald-400",
  unverified: "text-amber-400",
  contradicted: "text-rose-400",
};

const CONFIDENCE_TEXT: Record<Confidence, string> = {
  high: "text-sky-400",
  medium: "text-violet-400",
  low: "text-slate-400",
};

const CLAIM_LABEL: Record<ClaimType, string> = {
  tornado_touchdown: "Tornado Touchdown",
  siren_malfunction: "Siren Malfunction",
  flooding: "Flooding",
  power_outage: "Power Outage",
  other: "Other",
};

interface StatusPanelProps {
  result: VerifyResponse;
}

export default function StatusPanel({ result }: StatusPanelProps) {
  return (
    <section
      aria-label="Verification result"
      className={`rounded-md border p-6 space-y-5 ${VERDICT_BORDER[result.verdict]}`}
      style={{ background: "rgba(10,15,30,0.65)", backdropFilter: "blur(24px)" }}
    >
      {/* Location + claim type */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500" style={{ letterSpacing: "0.02em" }}>
        <span>{result.extracted_location}</span>
        <span>·</span>
        <span>{CLAIM_LABEL[result.claim_type]}</span>
      </div>

      {/* Original claim */}
      <blockquote className="border-l-2 border-slate-700 pl-4 text-slate-400 text-sm leading-relaxed italic font-light">
        &ldquo;{result.claim_text}&rdquo;
      </blockquote>

      {/* Verdict + confidence */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2" role="status" aria-label={`Verdict: ${result.verdict}`}>
          <span className={`inline-block w-2 h-2 rounded-full ${VERDICT_DOT[result.verdict]}`} />
          <span className={`text-sm font-semibold capitalize ${VERDICT_TEXT[result.verdict]}`}>
            {result.verdict}
          </span>
        </div>
        <span className="text-slate-700 text-xs">|</span>
        <span
          className={`text-xs font-medium capitalize ${CONFIDENCE_TEXT[result.confidence]}`}
          aria-label={`Confidence: ${result.confidence}`}
          style={{ letterSpacing: "0.02em" }}
        >
          {result.confidence} confidence
        </span>
      </div>

      {/* Analysis */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-slate-500 uppercase" style={{ letterSpacing: "0.1em" }}>
          Analysis
        </p>
        <p className="text-sm text-slate-300 leading-relaxed font-light">{result.explanation}</p>
      </div>

      {/* Sources */}
      {result.sources.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-500 uppercase" style={{ letterSpacing: "0.1em" }}>
            Sources Checked
          </p>
          <ul className="space-y-1">
            {result.sources.map((src) => (
              <li key={src} className="flex items-start gap-2">
                <span className="text-slate-600 mt-0.5 text-xs select-none">→</span>
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-sky-400 hover:text-sky-300 break-all underline underline-offset-2 transition-colors font-light"
                >
                  {src}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <DisclaimerBanner message={result.safety_disclaimer} verdict={result.verdict} />
    </section>
  );
}
