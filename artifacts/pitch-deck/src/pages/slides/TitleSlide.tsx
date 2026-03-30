const base = import.meta.env.BASE_URL;

export default function TitleSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#050508" }}>
      <img
        src={`${base}hero-bg.png`}
        crossOrigin="anonymous"
        alt="Hero background"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.35 }}
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(5,5,8,0.85) 0%, rgba(5,5,8,0.4) 50%, rgba(0,212,255,0.08) 100%)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 10% 90%, rgba(167,139,250,0.12) 0%, transparent 50%), radial-gradient(circle at 90% 10%, rgba(0,212,255,0.1) 0%, transparent 45%)" }} />

      <div className="relative flex flex-col justify-between h-full px-[7vw] py-[7vh]">
        <div className="flex items-center gap-[1.2vw]">
          <div style={{ width: "0.3vw", height: "2.2vh", background: "#00D4FF", borderRadius: "2px" }} />
          <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.3vw", color: "rgba(0,212,255,0.85)", letterSpacing: "0.2em", fontWeight: 600, textTransform: "uppercase" }}>Replit Buildathon 2025 — Week 2</span>
        </div>

        <div>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "8vw", fontWeight: 700, color: "#F8FAFC", lineHeight: 1, letterSpacing: "-0.03em", marginBottom: "2.5vh" }}>
            Voice Persona AI
          </div>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2.8vw", fontWeight: 500, color: "rgba(248,250,252,0.8)", marginBottom: "3.5vh", letterSpacing: "-0.01em" }}>
            Your Voice. Infinite Personas. Zero Barriers.
          </div>
          <div style={{ display: "flex", gap: "1.5vw", alignItems: "center" }}>
            <div style={{ padding: "0.8vh 1.8vw", borderRadius: "100px", border: "1.5px solid #00D4FF", color: "#00D4FF", fontFamily: "Inter, sans-serif", fontSize: "1.4vw", fontWeight: 500 }}>Voice Cloning</div>
            <div style={{ padding: "0.8vh 1.8vw", borderRadius: "100px", border: "1.5px solid #A78BFA", color: "#A78BFA", fontFamily: "Inter, sans-serif", fontSize: "1.4vw", fontWeight: 500 }}>AI Personas</div>
            <div style={{ padding: "0.8vh 1.8vw", borderRadius: "100px", border: "1.5px solid #10B981", color: "#10B981", fontFamily: "Inter, sans-serif", fontSize: "1.4vw", fontWeight: 500 }}>Travel Talk</div>
          </div>
        </div>

        <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.4vw", color: "rgba(248,250,252,0.5)", letterSpacing: "0.02em" }}>
          Expo PWA &amp; Mobile — March 2026
        </div>
      </div>

      <div className="absolute" style={{ bottom: "0", right: "0", width: "45vw", height: "100vh", background: "linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.03) 100%)", pointerEvents: "none" }} />
      <div className="absolute" style={{ top: "20vh", right: "5vw", width: "0.15vw", height: "60vh", background: "linear-gradient(180deg, transparent, rgba(0,212,255,0.3), transparent)" }} />
    </div>
  );
}
