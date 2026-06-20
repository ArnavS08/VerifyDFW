import { useState, useMemo, useEffect, useRef } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import StatusPanel from "@/components/StatusPanel";
import type { VerifyResponse } from "@/components/StatusPanel";

const EXAMPLES = [
  "Tornado touched down near Stonebriar Centre mall — sirens going off everywhere",
  "Frisco emergency sirens have been looping for 20 minutes, no official update",
  "Flash flooding on Preston Road near Legacy Drive, cars stranded",
  "ERCOT rolling blackouts hitting West Plano right now",
  "Hail the size of golf balls reported at Legacy West",
];

type Scene = { url: string; keywords: string[] };

const BG_SCENES: Scene[] = [
  {
    keywords: ["tornado", "funnel", "twister", "rotation", "wedge", "touchdown"],
    url: "https://images.unsplash.com/photo-1504608524841-42584120d176?auto=format&fit=crop&w=1920&q=80",
  },
  {
    keywords: ["flood", "flooding", "flash flood", "water", "stranded", "inundated", "surge"],
    url: "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1920&q=80",
  },
  {
    keywords: ["hail", "ice", "golf ball", "baseball sized", "hailstorm"],
    url: "https://images.unsplash.com/photo-1530908295418-a12e326966ba?auto=format&fit=crop&w=1920&q=80",
  },
  {
    keywords: ["power", "blackout", "outage", "ercot", "electric", "grid", "lights out", "rolling blackout"],
    url: "https://images.unsplash.com/photo-1548613053-22087dd8edb8?auto=format&fit=crop&w=1920&q=80",
  },
  {
    keywords: ["siren", "emergency", "alert", "warning", "alarm", "dispatch"],
    url: "https://images.unsplash.com/photo-1580745294621-9e62e87e08b9?auto=format&fit=crop&w=1920&q=80",
  },
  {
    keywords: ["lightning", "thunder", "thunderstorm", "storm", "severe"],
    url: "https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?auto=format&fit=crop&w=1920&q=80",
  },
];

const DEFAULT_BG =
  "https://images.unsplash.com/photo-1531685250784-7569952593d2?auto=format&fit=crop&w=1920&q=80";

function detectBg(text: string): string {
  const lower = text.toLowerCase();
  for (const scene of BG_SCENES) {
    if (scene.keywords.some((kw) => lower.includes(kw))) return scene.url;
  }
  return DEFAULT_BG;
}

function isTweetUrl(text: string): boolean {
  return /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/i.test(text.trim());
}

function extractTweetText(html: string): string {
  const match = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (!match) return "";
  return match[1]
    .replace(/<a[^>]*>([^<]*)<\/a>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .trim();
}

function CloudLightningIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
      <path d="m13 12-3 5h4l-3 5" />
    </svg>
  );
}

export default function Dashboard() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [tweetHtml, setTweetHtml] = useState<string | null>(null);
  const [tweetText, setTweetText] = useState<string | null>(null);
  const [tweetAuthor, setTweetAuthor] = useState<string | null>(null);
  const [tweetFetching, setTweetFetching] = useState(false);
  const tweetRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const claimText = tweetText ?? inputText;
  const bgUrl = useMemo(() => detectBg(claimText), [claimText]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!isTweetUrl(inputText)) {
      setTweetHtml(null);
      setTweetText(null);
      setTweetAuthor(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setTweetFetching(true);
      try {
        const res = await fetch(`/api/oembed?url=${encodeURIComponent(inputText.trim())}`);
        if (!res.ok) throw new Error("not embeddable");
        const data = await res.json();
        setTweetHtml(data.html ?? null);
        setTweetAuthor(data.author_name ?? null);
        setTweetText(extractTweetText(data.html ?? ""));
      } catch {
        setTweetHtml(null);
        setTweetText(null);
      } finally {
        setTweetFetching(false);
      }
    }, 400);
  }, [inputText]);

  useEffect(() => {
    if (!tweetHtml) return;
    // Re-run Twitter widget rendering after HTML is injected
    const w = window as typeof window & { twttr?: { widgets?: { load: (el?: HTMLElement) => void } } };
    if (w.twttr?.widgets?.load && tweetRef.current) {
      w.twttr.widgets.load(tweetRef.current);
    }
  }, [tweetHtml]);

  const handleSubmit = async () => {
    if (!claimText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim_text: claimText }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      setResult(await res.json());
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
        <title>VerifyDFW — Emergency Claim Verification</title>
        <meta name="description" content="AI-powered emergency claim verification for DFW block leaders and community coordinators." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen text-slate-100 relative">

        {/* Dynamic background */}
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
          <div className="absolute inset-0 bg-gradient-to-br from-[#050810]/92 via-[#050810]/72 to-[#050810]/88" />
        </div>

        {/* Header */}
        <header
          className="sticky top-0 z-50 border-b border-white/[0.06]"
          style={{ background: "rgba(5,8,20,0.88)", backdropFilter: "blur(20px)" }}
        >
          <div className="mx-auto max-w-7xl px-8 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <CloudLightningIcon className="w-5 h-5 text-sky-400 transition-opacity group-hover:opacity-70" />
              <span className="text-sm font-semibold text-white" style={{ letterSpacing: "-0.01em" }}>
                VerifyDFW
              </span>
            </Link>
          </div>
        </header>

        {/* Main two-column layout */}
        <main className="mx-auto max-w-7xl px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

            {/* Left — Input panel */}
            <div className="space-y-7">

              {/* Hero text */}
              <section aria-labelledby="hero-heading" className="space-y-4">
                <p
                  className="text-xs font-medium text-sky-400 uppercase"
                  style={{ letterSpacing: "0.14em" }}
                >
                  For DFW Block Leaders &amp; Community Coordinators
                </p>

                <h2
                  id="hero-heading"
                  className="text-4xl font-bold text-white leading-tight"
                  style={{ letterSpacing: "-0.03em" }}
                >
                  Is what your neighborhood<br />
                  <span className="text-slate-400">is saying actually</span>{" "}
                  <span className="text-sky-400">true?</span>
                </h2>

                <p className="text-slate-400 text-sm leading-relaxed max-w-md font-light">
                  When a storm warning spreads through your WhatsApp group or Nextdoor feed,
                  get an instant cross-reference against live{" "}
                  <span className="text-slate-200 font-medium">NWS Fort Worth</span>,{" "}
                  <span className="text-slate-200 font-medium">ERCOT grid</span>, and{" "}
                  <span className="text-slate-200 font-medium">local PD feeds</span>.
                </p>

                {/* Stats */}
                <div className="flex gap-8 pt-1">
                  {[
                    { value: "3", label: "Live Data Sources" },
                    { value: "DFW", label: "Metroplex Coverage" },
                    { value: "~2s", label: "Response Time" },
                  ].map((s) => (
                    <div key={s.label} className="flex flex-col">
                      <span className="text-2xl font-bold text-white" style={{ letterSpacing: "-0.04em" }}>{s.value}</span>
                      <span className="text-[11px] text-slate-500 mt-0.5 uppercase" style={{ letterSpacing: "0.1em" }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Input card */}
              <section
                aria-label="Claim input"
                className="rounded-md p-6 space-y-4"
                style={{
                  background: "rgba(10,15,30,0.7)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(24px)",
                }}
              >
                <div className="flex items-center justify-between">
                  <label htmlFor="claim-input" className="text-sm font-semibold text-slate-200">
                    Paste a rumor before you forward it
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
                  placeholder="Paste a tweet URL, or type a rumor you heard…"
                  className="w-full rounded-sm px-4 py-3 text-sm text-slate-100 placeholder-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-sky-500/60 transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    lineHeight: "1.6",
                  }}
                  aria-describedby="input-hint"
                />

                {/* Tweet preview */}
                {tweetFetching && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Loading tweet…
                  </div>
                )}

                {tweetHtml && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500" style={{ letterSpacing: "0.04em" }}>
                      Tweet detected{tweetAuthor ? ` · ${tweetAuthor}` : ""}
                    </p>
                    <div
                      ref={tweetRef}
                      className="rounded-sm overflow-hidden"
                      style={{ maxWidth: "100%" }}
                      dangerouslySetInnerHTML={{ __html: tweetHtml }}
                    />
                    {tweetText && (
                      <p className="text-xs text-slate-500 leading-relaxed font-light">
                        Extracted claim: <span className="text-slate-300 italic">&ldquo;{tweetText.slice(0, 120)}{tweetText.length > 120 ? "…" : ""}&rdquo;</span>
                      </p>
                    )}
                  </div>
                )}

                <p id="input-hint" className="text-xs text-slate-600 leading-relaxed">
                  Paste a tweet URL to auto-extract the claim, or type directly. Press{" "}
                  <kbd
                    className="rounded px-1.5 py-0.5 text-slate-400 text-xs"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}
                  >
                    ⌘ Enter
                  </kbd>{" "}
                  to submit.
                </p>

                {/* Example prompts */}
                <div>
                  <p className="text-xs text-slate-600 mb-2.5 uppercase" style={{ letterSpacing: "0.1em" }}>
                    Try an example
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLES.map((ex) => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => setInputText(ex)}
                        className="text-xs text-slate-500 hover:text-slate-200 transition-colors text-left underline underline-offset-2 decoration-slate-700 hover:decoration-slate-400"
                        style={{}}
                      >
                        {ex.length > 52 ? ex.slice(0, 52) + "…" : ex}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-lg px-4 py-3 text-sm text-rose-300"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}
                  >
                    {error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 pt-1">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !claimText.trim() || tweetFetching}
                    className="rounded-sm px-6 py-2.5 text-sm font-semibold text-white transition-opacity active:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none"
                    style={{ background: loading ? "#1e3a5f" : "#1a56db" }}
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
                    ) : tweetFetching ? (
                      "Loading tweet…"
                    ) : (
                      "Verify Claim"
                    )}
                  </button>

                  {(result || error) && !loading && (
                    <button
                      type="button"
                      onClick={() => { setResult(null); setInputText(""); setError(null); setTweetHtml(null); setTweetText(null); setTweetAuthor(null); }}
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </section>
            </div>

            {/* Right — Results */}
            <div className="lg:sticky lg:top-24 space-y-3">
              {result ? (
                <>
                  <StatusPanel result={result} />
                  <button
                    type="button"
                    onClick={() => {
                      const verdictLabel = result.verdict === "confirmed" ? "CONFIRMED" : result.verdict === "contradicted" ? "CONTRADICTED" : "UNVERIFIED";
                      const msg = `[VerifyDFW] "${claimText.slice(0, 120)}${claimText.length > 120 ? "…" : ""}" — ${verdictLabel} (${result.confidence} confidence). ${result.explanation} Source: ${result.sources[0] ?? "weather.gov/fwd"}. Do not forward unverified claims.`;
                      navigator.clipboard.writeText(msg).then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      });
                    }}
                    className="w-full rounded-sm py-2.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors border border-white/[0.07] hover:border-white/20"
                    style={{ background: "rgba(10,15,30,0.5)" }}
                  >
                    {copied ? "Copied to clipboard" : "Copy result to share with your group"}
                  </button>
                </>
              ) : (
                <div
                  className="rounded-md p-10 flex flex-col items-center justify-center text-center gap-5 min-h-[360px]"
                  style={{
                    background: "rgba(10,15,30,0.5)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    backdropFilter: "blur(24px)",
                  }}
                >
                  <CloudLightningIcon className="w-10 h-10 text-slate-700" />
                  <div className="space-y-1.5">
                    <p className="text-slate-400 text-sm font-medium">Awaiting your claim</p>
                    <p className="text-slate-600 text-xs max-w-[220px] leading-relaxed font-light">
                      Your verification result will appear here once you submit.
                    </p>
                  </div>
                  {loading && (
                    <div className="flex items-center gap-2 text-sky-400 text-sm font-light">
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

        </main>

        <footer
          className="mt-12 border-t"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(5,8,20,0.7)" }}
        >
          <div className="mx-auto max-w-7xl px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600" style={{ letterSpacing: "0.02em" }}>
            <span>VerifyDFW</span>
            <span>Not an official emergency broadcast | Always follow local emergency management</span>
          </div>
        </footer>

      </div>
    </>
  );
}
