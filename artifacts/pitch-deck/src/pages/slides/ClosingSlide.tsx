export default function ClosingSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#050508" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(0,212,255,0.09) 0%, rgba(167,139,250,0.06) 35%, transparent 65%)" }} />
      <div className="absolute" style={{ top: 0, left: 0, right: 0, height: "0.15vh", background: "linear-gradient(90deg, transparent, #00D4FF, #22C55E, #A78BFA, transparent)" }} />

      <div className="relative flex flex-col items-center justify-center h-full text-center px-[8vw]">
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "#00D4FF", letterSpacing: "0.2em", fontWeight: 600, textTransform: "uppercase", marginBottom: "3vh" }}>Replit Buildathon 2026 — Week 3</div>

        <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "7vw", fontWeight: 700, color: "#F8FAFC", lineHeight: 1, letterSpacing: "-0.04em", marginBottom: "2.5vh" }}>
          Try it now.
        </div>

        <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2.5vw", fontWeight: 500, color: "#00D4FF", marginBottom: "5vh", letterSpacing: "-0.01em" }}>
          voice-persona-gen.replit.app
        </div>

        <div style={{ display: "flex", gap: "3vw", marginBottom: "6vh" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "3.5vw", fontWeight: 700, color: "#22C55E" }}>30+</div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.4vw", color: "rgba(248,250,252,0.55)" }}>languages</div>
          </div>
          <div style={{ width: "1px", background: "rgba(248,250,252,0.12)", alignSelf: "stretch" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "3.5vw", fontWeight: 700, color: "#F8FAFC" }}>5</div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.4vw", color: "rgba(248,250,252,0.55)" }}>tabs / features</div>
          </div>
          <div style={{ width: "1px", background: "rgba(248,250,252,0.12)", alignSelf: "stretch" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "3.5vw", fontWeight: 700, color: "#F8FAFC" }}>3</div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.4vw", color: "rgba(248,250,252,0.55)" }}>persona modes</div>
          </div>
          <div style={{ width: "1px", background: "rgba(248,250,252,0.12)", alignSelf: "stretch" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "3.5vw", fontWeight: 700, color: "#F8FAFC" }}>15s</div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.4vw", color: "rgba(248,250,252,0.55)" }}>to clone your voice</div>
          </div>
        </div>

        <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2.2vw", fontWeight: 600, color: "rgba(248,250,252,0.4)", letterSpacing: "-0.01em" }}>
          Your Voice. Infinite Personas. Zero Barriers.
        </div>
      </div>

      <div className="absolute" style={{ bottom: 0, left: 0, right: 0, height: "0.15vh", background: "linear-gradient(90deg, transparent, #A78BFA, #22C55E, #00D4FF, transparent)" }} />
    </div>
  );
}
