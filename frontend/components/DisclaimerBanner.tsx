// ── DisclaimerBanner — Person 4 (Phase 3, Task 3) ───────────────────────────
// TODO (Person 4): Replace this stub with the full stylized disclaimer component.
//
// Requirements:
// - Highly visible, cannot be missed
// - Always shown whenever a result is present (never hidden)
// - Style must change based on verdict:
//     confirmed    → amber warning tone  (this is real, take action)
//     unverified   → amber/neutral tone  (treat with caution)
//     contradicted → rose/red tone       (claim is likely false)
// - Must display:
//     1. The safety_disclaimer text from the API response
//     2. A hardcoded system explanation line (e.g. "This analysis was generated
//        by an AI system cross-referencing live NWS, ERCOT, and local PD feeds.")
//     3. An emergency resources link row (NWS Fort Worth, 911, ERCOT outage map)
// - Use role="alert" and aria-live="polite" for accessibility

import type { Verdict } from "./StatusPanel";

interface DisclaimerBannerProps {
  message: string;
  verdict: Verdict;
}

export default function DisclaimerBanner({
  message,
  verdict: _verdict,
}: DisclaimerBannerProps) {
  // ── Stub — Person 4: replace everything inside this return ────────────────
  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-5 py-4"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-1">
        Safety Notice
      </p>
      <p className="text-sm text-amber-200 leading-relaxed">{message}</p>
      {/* Person 4: add system explanation line and emergency links below */}
    </div>
  );
}
