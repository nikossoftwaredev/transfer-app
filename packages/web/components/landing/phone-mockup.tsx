"use client";

export function PhoneMockup() {
  return (
    <div className="relative animate-float">
      {/* Ambient glow */}
      <div className="absolute -inset-12 bg-amber-500/8 rounded-full blur-[80px] -z-10" />
      <div className="absolute -inset-6 bg-primary/5 rounded-full blur-[40px] -z-10" />

      {/* Phone frame */}
      <div
        className="relative mx-auto rounded-[2.5rem] p-[2px] shadow-2xl shadow-black/60"
        style={{
          width: 260,
          height: 520,
          background: "linear-gradient(135deg, rgba(120,120,130,0.6) 0%, rgba(40,40,50,0.8) 50%, rgba(80,80,90,0.5) 100%)",
        }}
      >
        <div className="h-full w-full rounded-[2.4rem] bg-[#0a0a0f] overflow-hidden relative">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-b-xl z-10">
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-zinc-800 rounded-full" />
          </div>

          {/* Screen content */}
          <div className="h-full w-full flex flex-col relative">
            {/* Ambient bg effects */}
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-amber-500/5 rounded-full blur-[60px]" />
            <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-slate-500/5 rounded-full blur-[40px]" />
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            />

            {/* Status bar */}
            <div className="relative z-20 flex justify-between items-center px-6 pt-2.5 pb-1 text-[9px] text-white/50 font-medium">
              <span>9:41</span>
              <div className="flex items-center gap-0.5">
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor"><path d="M1 10h2v4H1zM5 7h2v7H5zM9 4h2v10H9zM13 1h2v13h-2z" /></svg>
              </div>
            </div>

            {/* App header */}
            <div className="relative z-10 px-4 pt-1 pb-3">
              <div className="text-white text-xs font-bold tracking-tight">
                Transfer<span className="text-amber-400">GR</span>
              </div>
            </div>

            {/* Search inputs */}
            <div className="relative z-10 px-4 space-y-1.5 mb-3">
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-white/30 text-[10px]">Athens Airport (ATH)</span>
              </div>
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span className="text-white/30 text-[10px]">Syntagma Square, Athens</span>
              </div>
            </div>

            {/* Map area */}
            <div className="relative z-10 mx-4 flex-1 rounded-xl bg-gradient-to-br from-slate-800/30 to-slate-900/50 border border-white/[0.05] overflow-hidden mb-3">
              {/* Grid lines */}
              <div className="absolute inset-0 opacity-15">
                {[25, 50, 75].map((y) => (
                  <div key={`h-${y}`} className="absolute left-0 right-0 h-px bg-white/20" style={{ top: `${y}%` }} />
                ))}
                {[25, 50, 75].map((x) => (
                  <div key={`v-${x}`} className="absolute top-0 bottom-0 w-px bg-white/20" style={{ left: `${x}%` }} />
                ))}
              </div>
              {/* Route line */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path
                  d="M 20 20 C 35 35, 45 60, 78 78"
                  stroke="rgba(251,191,36,0.4)"
                  fill="none"
                  strokeWidth="1.2"
                  strokeDasharray="3 2"
                  className="animate-dash"
                />
                <circle cx="20" cy="20" r="2.5" fill="#34d399" />
                <circle cx="78" cy="78" r="2.5" fill="#fbbf24" />
              </svg>
              {/* Route label */}
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm rounded-md px-2 py-1">
                <div className="text-[8px] text-white/40">Est. 35 min</div>
                <div className="text-[9px] text-white/70 font-medium">38.2 km</div>
              </div>
            </div>

            {/* Vehicle selection */}
            <div className="relative z-10 px-4 pb-4 space-y-1.5">
              {/* Selected vehicle */}
              <div className="bg-amber-500/[0.08] border border-amber-500/20 rounded-xl p-2.5 flex items-center gap-2.5">
                <div className="w-10 h-7 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-3" viewBox="0 0 24 14" fill="none" stroke="rgba(251,191,36,0.7)" strokeWidth="1.2">
                    <path d="M3 10h18M5 10V6a2 2 0 012-2h4l2-2h3l2 2h1a2 2 0 012 2v4M6 10a2 2 0 100 4 2 2 0 000-4zM18 10a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-[10px] font-semibold leading-tight">Mercedes E Class</div>
                  <div className="text-white/30 text-[8px]">3 passengers &middot; Business</div>
                </div>
                <div className="text-amber-400 text-xs font-bold">&euro;55</div>
              </div>

              {/* Book button */}
              <div className="bg-amber-500 rounded-xl py-2 text-center">
                <span className="text-black text-[10px] font-bold tracking-wide">BOOK NOW</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
