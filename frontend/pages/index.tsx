import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

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

export default function Landing() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = 0.85;
  }, []);

  return (
    <>
      <Head>
        <title>VerifyDFW — Emergency Claim Verification</title>
        <meta name="description" content="AI-powered emergency claim verification for DFW communities." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="relative min-h-screen flex flex-col overflow-hidden" style={{ background: "#050810" }}>

        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          onCanPlay={() => setVideoLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms]"
          style={{ opacity: videoLoaded ? 0.9 : 0 }}
          aria-hidden="true"
        >
          <source src="/rain.mp4" type="video/mp4" />
        </video>

        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(5,8,20,0.65) 0%, rgba(5,8,20,0.45) 35%, rgba(5,8,20,0.78) 100%)" }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(5,8,20,0.55) 100%)" }}
        />

        <div className="relative z-10 flex flex-col min-h-screen">

          <header className="flex items-center justify-between px-10 pt-9">
            <div className="flex items-center gap-2">
              <CloudLightningIcon className="w-5 h-5 text-sky-400" />
              <span className="text-sm font-semibold text-white/80" style={{ letterSpacing: "0.02em" }}>
                VerifyDFW
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-emerald-400" style={{ letterSpacing: "0.03em" }}>
                NWS Live
              </span>
            </div>
          </header>

          <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pb-8">

            <p className="mb-7 text-xs font-medium text-slate-400 uppercase" style={{ letterSpacing: "0.18em" }}>
              Emergency Claim Verification &nbsp;·&nbsp; North Texas
            </p>

            <h1
              className="text-white leading-none"
              style={{ fontSize: "clamp(3.4rem, 9vw, 7.8rem)", fontWeight: 700, letterSpacing: "-0.04em", textShadow: "0 2px 48px rgba(0,0,0,0.45)" }}
            >
              VerifyDFW.
            </h1>

            <p
              className="mt-6 text-slate-300 max-w-lg leading-relaxed font-light"
              style={{ fontSize: "clamp(1rem, 2vw, 1.15rem)" }}
            >
              When a storm warning spreads through your neighborhood, you need
              truth. Cross-reference any emergency claim against live
              NWS, ERCOT, and local PD data in seconds.
            </p>

            <div
              className="mt-10 max-w-md text-left px-7 py-6 rounded-md"
              style={{ background: "rgba(8,12,28,0.6)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(18px)" }}
            >
              <p className="text-xs font-semibold text-rose-400 uppercase mb-3" style={{ letterSpacing: "0.14em" }}>
                Why we built this
              </p>
              <p className="text-slate-300 text-sm leading-relaxed font-light">
                During the 2021 Texas winter storm and every major DFW weather
                event since, unverified rumors spread faster than official
                warnings, causing people to delay shelter, ignore real alerts,
                or act on false ones. Block leaders and community coordinators
                had no tool to quickly separate fact from fear.{" "}
                <span className="text-white font-medium">We built one.</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="mt-9 rounded-sm px-10 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-80 active:opacity-60 focus:outline-none"
              style={{ background: "#1a56db", letterSpacing: "0.01em" }}
            >
              Verify a Claim
            </button>

            <p className="mt-4 text-xs text-slate-600" style={{ letterSpacing: "0.02em" }}>
              Not an official emergency broadcast &nbsp;·&nbsp; Always follow local emergency management
            </p>
          </main>

          <footer className="text-center pb-7">
            <p className="text-xs text-slate-700" style={{ letterSpacing: "0.04em" }}>
              NWS Fort Worth &nbsp;·&nbsp; ERCOT &nbsp;·&nbsp; USGS &nbsp;·&nbsp; AI
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
