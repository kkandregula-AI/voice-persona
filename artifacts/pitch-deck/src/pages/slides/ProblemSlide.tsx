export default function ProblemSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#050508" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 110%, rgba(255,107,107,0.09) 0%, transparent 60%)" }} />
      <div className="absolute" style={{ top: 0, left: 0, right: 0, height: "0.15vh", background: "linear-gradient(90deg, transparent, #FF6B6B 50%, transparent)" }} />

      <div className="relative flex flex-col h-full px-[8vw] py-[7vh]">
        {/* Header */}
        <div style={{ marginBottom: "4vh" }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.25vw", color: "#FF6B6B", letterSpacing: "0.2em", fontWeight: 600, textTransform: "uppercase", marginBottom: "1.5vh" }}>The Problem</div>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "4.5vw", fontWeight: 700, color: "#F8FAFC", lineHeight: 1.0, letterSpacing: "-0.03em" }}>
            Creating with your voice is broken
          </div>
        </div>

        {/* Three problem cards */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2vw", alignContent: "center" }}>
          {/* Card 1 */}
          <div style={{ background: "#16161F", borderRadius: "1.2vw", padding: "3.5vh 2.5vw", borderTop: "3px solid #FF6B6B", display: "flex", flexDirection: "column", gap: "1.5vh" }}>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "3.5vw", fontWeight: 700, color: "rgba(255,107,107,0.5)" }}>01</div>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.9vw", fontWeight: 700, color: "#F8FAFC", lineHeight: 1.2 }}>Hours lost to voiceover editing</div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.45vw", color: "rgba(248,250,252,0.6)", lineHeight: 1.55 }}>Creators spend more time in editing suites than creating. Hiring a voice actor costs hundreds per session with zero flexibility.</div>
          </div>

          {/* Card 2 */}
          <div style={{ background: "#16161F", borderRadius: "1.2vw", padding: "3.5vh 2.5vw", borderTop: "3px solid #FF6B6B", display: "flex", flexDirection: "column", gap: "1.5vh" }}>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "3.5vw", fontWeight: 700, color: "rgba(255,107,107,0.5)" }}>02</div>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.9vw", fontWeight: 700, color: "#F8FAFC", lineHeight: 1.2 }}>Language barriers kill real moments</div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.45vw", color: "rgba(248,250,252,0.6)", lineHeight: 1.55 }}>Travelers miss experiences. Doctors misread patients. Business deals collapse. Clunky apps require Wi-Fi and slow everything down.</div>
          </div>

          {/* Card 3 */}
          <div style={{ background: "#16161F", borderRadius: "1.2vw", padding: "3.5vh 2.5vw", borderTop: "3px solid #FF6B6B", display: "flex", flexDirection: "column", gap: "1.5vh" }}>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "3.5vw", fontWeight: 700, color: "rgba(255,107,107,0.5)" }}>03</div>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.9vw", fontWeight: 700, color: "#F8FAFC", lineHeight: 1.2 }}>Generic AI voices feel inhuman</div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.45vw", color: "rgba(248,250,252,0.6)", lineHeight: 1.55 }}>TTS tools deliver robotic output with no personality. Your brand voice — your tone, your warmth, your style — is completely lost.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
