const base = import.meta.env.BASE_URL;

export default function TravelTalkSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#050508" }}>
      <img
        src={`${base}travel-bg.png`}
        crossOrigin="anonymous"
        alt="Travel background"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.22 }}
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(5,5,8,0.98) 0%, rgba(5,5,8,0.75) 55%, rgba(5,5,8,0.45) 100%)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 15% 55%, rgba(16,185,129,0.11) 0%, transparent 52%)" }} />
      <div className="absolute" style={{ top: 0, left: 0, right: 0, height: "0.15vh", background: "linear-gradient(90deg, transparent, #10B981 50%, transparent)" }} />

      <div className="relative flex h-full px-[8vw] py-[7vh] gap-[5vw]">
        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "50%" }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.25vw", color: "#10B981", letterSpacing: "0.2em", fontWeight: 600, textTransform: "uppercase", marginBottom: "2vh" }}>Travel Talk</div>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "4.8vw", fontWeight: 700, color: "#F8FAFC", lineHeight: 1.0, letterSpacing: "-0.03em", marginBottom: "1.2vh" }}>
            Speak naturally.
          </div>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2.2vw", fontWeight: 500, color: "#10B981", marginBottom: "3.5vh" }}>
            Let AI bridge the language.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.4vh" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1.2vw" }}>
              <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", background: "#10B981", flexShrink: 0 }} />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.55vw", color: "rgba(248,250,252,0.85)" }}>4 modes — Speak, Listen, Live captions, Type</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1.2vw" }}>
              <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", background: "#10B981", flexShrink: 0 }} />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.55vw", color: "rgba(248,250,252,0.85)" }}>Camera OCR — scan signs and menus instantly</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1.2vw" }}>
              <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", background: "#10B981", flexShrink: 0 }} />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.55vw", color: "rgba(248,250,252,0.85)" }}>Giant "Show to them" card — no squinting required</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1.2vw" }}>
              <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", background: "#10B981", flexShrink: 0 }} />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.55vw", color: "rgba(248,250,252,0.85)" }}>Memory — sessions saved, searchable, pinnable</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1.2vw" }}>
              <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", background: "#10B981", flexShrink: 0 }} />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.55vw", color: "rgba(248,250,252,0.85)" }}>Script mismatch detection for non-Latin keyboards</span>
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "2vh" }}>
          {/* Languages card */}
          <div style={{ background: "rgba(16,185,129,0.09)", border: "1.5px solid rgba(16,185,129,0.32)", borderRadius: "1.2vw", padding: "2.2vh 2vw" }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.15vw", color: "#10B981", marginBottom: "1.2vh", letterSpacing: "0.1em", fontWeight: 600, textTransform: "uppercase" }}>50+ Languages — Indian + International</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4vw 0.8vw" }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "rgba(248,250,252,0.75)" }}>Telugu</span>
              <span style={{ color: "rgba(248,250,252,0.28)", fontSize: "1.3vw" }}>·</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "rgba(248,250,252,0.75)" }}>Hindi</span>
              <span style={{ color: "rgba(248,250,252,0.28)", fontSize: "1.3vw" }}>·</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "rgba(248,250,252,0.75)" }}>Tamil</span>
              <span style={{ color: "rgba(248,250,252,0.28)", fontSize: "1.3vw" }}>·</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "rgba(248,250,252,0.75)" }}>Arabic</span>
              <span style={{ color: "rgba(248,250,252,0.28)", fontSize: "1.3vw" }}>·</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "rgba(248,250,252,0.75)" }}>Japanese</span>
              <span style={{ color: "rgba(248,250,252,0.28)", fontSize: "1.3vw" }}>·</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "rgba(248,250,252,0.75)" }}>Korean</span>
              <span style={{ color: "rgba(248,250,252,0.28)", fontSize: "1.3vw" }}>·</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "rgba(248,250,252,0.75)" }}>Kannada</span>
              <span style={{ color: "rgba(248,250,252,0.28)", fontSize: "1.3vw" }}>·</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "rgba(248,250,252,0.75)" }}>Bengali</span>
              <span style={{ color: "rgba(248,250,252,0.28)", fontSize: "1.3vw" }}>·</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "rgba(248,250,252,0.75)" }}>+ 42 more</span>
            </div>
          </div>

          {/* AI Translation chain */}
          <div style={{ background: "#16161F", border: "1px solid rgba(248,250,252,0.07)", borderRadius: "1.2vw", padding: "2.2vh 2vw" }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.15vw", color: "rgba(248,250,252,0.4)", marginBottom: "1.2vh", letterSpacing: "0.06em" }}>AI Translation Pipeline</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8vh" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
                <div style={{ background: "#10B981", borderRadius: "4px", padding: "0.2vh 0.7vw", fontFamily: "Inter, sans-serif", fontSize: "1.15vw", fontWeight: 700, color: "#050508" }}>1</div>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.4vw", color: "rgba(248,250,252,0.8)" }}>Azure OpenAI (gpt-4o-mini) via Replit proxy — contextual accuracy</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
                <div style={{ background: "#A78BFA", borderRadius: "4px", padding: "0.2vh 0.7vw", fontFamily: "Inter, sans-serif", fontSize: "1.15vw", fontWeight: 700, color: "#050508" }}>2</div>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.4vw", color: "rgba(248,250,252,0.8)" }}>MyMemory fallback — confidence scored above 80%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
