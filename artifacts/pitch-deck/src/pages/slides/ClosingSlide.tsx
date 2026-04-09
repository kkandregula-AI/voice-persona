export default function ClosingSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#050508" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 65%, rgba(0,212,255,0.10) 0%, rgba(167,139,250,0.07) 38%, transparent 68%)" }} />
      <div className="absolute" style={{ top: 0, left: 0, right: 0, height: "0.15vh", background: "linear-gradient(90deg, transparent, #00D4FF 30%, #22C55E 55%, #A78BFA 80%, transparent)" }} />
      <div className="absolute" style={{ bottom: 0, left: 0, right: 0, height: "0.15vh", background: "linear-gradient(90deg, transparent, #A78BFA 30%, #22C55E 55%, #00D4FF 80%, transparent)" }} />

      <div className="relative flex flex-col items-center justify-center h-full text-center px-[8vw]">
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.25vw", color: "#00D4FF", letterSpacing: "0.22em", fontWeight: 600, textTransform: "uppercase", marginBottom: "2.5vh" }}>Replit Buildathon 2026 — Week 3</div>

        <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "7.5vw", fontWeight: 700, color: "#F8FAFC", lineHeight: 0.95, letterSpacing: "-0.04em", marginBottom: "2vh" }}>
          Try it now.
        </div>

        <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2.4vw", fontWeight: 500, color: "#00D4FF", marginBottom: "5vh", letterSpacing: "-0.01em" }}>
          voice-persona-gen.replit.app
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: "3.5vw", marginBottom: "5.5vh", alignItems: "stretch" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "3.8vw", fontWeight: 700, color: "#22C55E", lineHeight: 1 }}>50+</div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.35vw", color: "rgba(248,250,252,0.5)", marginTop: "0.4vh" }}>languages</div>
          </div>
          <div style={{ width: "1px", background: "rgba(248,250,252,0.1)", alignSelf: "stretch" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "3.8vw", fontWeight: 700, color: "#F8FAFC", lineHeight: 1 }}>7</div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.35vw", color: "rgba(248,250,252,0.5)", marginTop: "0.4vh" }}>tabs / features</div>
          </div>
          <div style={{ width: "1px", background: "rgba(248,250,252,0.1)", alignSelf: "stretch" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "3.8vw", fontWeight: 700, color: "#F8FAFC", lineHeight: 1 }}>3</div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.35vw", color: "rgba(248,250,252,0.5)", marginTop: "0.4vh" }}>persona modes</div>
          </div>
          <div style={{ width: "1px", background: "rgba(248,250,252,0.1)", alignSelf: "stretch" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "3.8vw", fontWeight: 700, color: "#F8FAFC", lineHeight: 1 }}>15s</div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.35vw", color: "rgba(248,250,252,0.5)", marginTop: "0.4vh" }}>to clone your voice</div>
          </div>
          <div style={{ width: "1px", background: "rgba(248,250,252,0.1)", alignSelf: "stretch" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "3.8vw", fontWeight: 700, color: "#A78BFA", lineHeight: 1 }}>4</div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.35vw", color: "rgba(248,250,252,0.5)", marginTop: "0.4vh" }}>emotions</div>
          </div>
        </div>

        <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2.2vw", fontWeight: 600, color: "rgba(248,250,252,0.38)", letterSpacing: "-0.01em" }}>
          Your Voice. Any Language. Infinite Personas.
        </div>
      </div>
    </div>
  );
}
