const base = import.meta.env.BASE_URL;

export default function TitleSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#050508" }}>
      <img
        src={`${base}hero-bg.png`}
        crossOrigin="anonymous"
        alt="Hero background"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.28 }}
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(5,5,8,0.95) 0%, rgba(5,5,8,0.5) 55%, rgba(0,212,255,0.05) 100%)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 8% 88%, rgba(167,139,250,0.13) 0%, transparent 48%), radial-gradient(circle at 92% 8%, rgba(0,212,255,0.10) 0%, transparent 45%)" }} />

      {/* Top accent line */}
      <div className="absolute" style={{ top: 0, left: 0, right: 0, height: "0.18vh", background: "linear-gradient(90deg, transparent, #00D4FF 40%, #A78BFA 70%, transparent)" }} />

      <div className="relative flex flex-col justify-between h-full px-[7vw] py-[7vh]">
        {/* Eyebrow */}
        <div className="flex items-center gap-[1.2vw]">
          <div style={{ width: "0.3vw", height: "2.4vh", background: "#00D4FF", borderRadius: "2px" }} />
          <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.25vw", color: "rgba(0,212,255,0.9)", letterSpacing: "0.22em", fontWeight: 600, textTransform: "uppercase" }}>Replit Buildathon 2026 — Week 3</span>
        </div>

        {/* Hero text */}
        <div>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "8.5vw", fontWeight: 700, color: "#F8FAFC", lineHeight: 0.95, letterSpacing: "-0.04em", marginBottom: "2.8vh" }}>
            Voice Persona AI
          </div>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2.6vw", fontWeight: 500, color: "rgba(248,250,252,0.78)", marginBottom: "4vh", letterSpacing: "-0.01em" }}>
            Your Voice. Any Language. Infinite Personas.
          </div>

          {/* Feature pills */}
          <div style={{ display: "flex", gap: "1vw", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ padding: "0.7vh 1.5vw", borderRadius: "100px", border: "1.5px solid #00D4FF", color: "#00D4FF", fontFamily: "Inter, sans-serif", fontSize: "1.25vw", fontWeight: 500 }}>Voice Cloning</div>
            <div style={{ padding: "0.7vh 1.5vw", borderRadius: "100px", border: "1.5px solid #A78BFA", color: "#A78BFA", fontFamily: "Inter, sans-serif", fontSize: "1.25vw", fontWeight: 500 }}>AI Creator Mode</div>
            <div style={{ padding: "0.7vh 1.5vw", borderRadius: "100px", border: "1.5px solid #10B981", color: "#10B981", fontFamily: "Inter, sans-serif", fontSize: "1.25vw", fontWeight: 500 }}>Travel Talk</div>
            <div style={{ padding: "0.7vh 1.5vw", borderRadius: "100px", border: "1.5px solid #22C55E", color: "#22C55E", fontFamily: "Inter, sans-serif", fontSize: "1.25vw", fontWeight: 500 }}>Live Interpreter</div>
            <div style={{ padding: "0.7vh 1.5vw", borderRadius: "100px", border: "1.5px solid rgba(0,212,255,0.55)", color: "rgba(0,212,255,0.75)", fontFamily: "Inter, sans-serif", fontSize: "1.25vw", fontWeight: 500 }}>Two-Way Talk</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", gap: "2.5vw" }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.4vw", color: "rgba(248,250,252,0.45)", letterSpacing: "0.02em" }}>Expo PWA + Mobile — April 2026</span>
          <div style={{ width: "1px", height: "2vh", background: "rgba(248,250,252,0.2)" }} />
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.4vw", color: "rgba(248,250,252,0.45)" }}>7 tabs</span>
          <div style={{ width: "1px", height: "2vh", background: "rgba(248,250,252,0.2)" }} />
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.4vw", color: "rgba(248,250,252,0.45)" }}>50+ languages</span>
          <div style={{ width: "1px", height: "2vh", background: "rgba(248,250,252,0.2)" }} />
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.4vw", color: "rgba(248,250,252,0.45)" }}>15s voice clone</span>
        </div>
      </div>

      {/* Decorative vertical line right */}
      <div className="absolute" style={{ top: "18vh", right: "5vw", width: "0.15vw", height: "64vh", background: "linear-gradient(180deg, transparent, rgba(0,212,255,0.22), transparent)" }} />
    </div>
  );
}
