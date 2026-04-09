export default function BuildSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#050508" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 0% 100%, rgba(167,139,250,0.07) 0%, transparent 55%), radial-gradient(ellipse at 100% 0%, rgba(0,212,255,0.05) 0%, transparent 50%)" }} />

      <div className="relative flex h-full px-[8vw] py-[7vh] gap-[4vw]">
        {/* Left — Week 3 deliverables */}
        <div style={{ width: "50%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.25vw", color: "#22C55E", letterSpacing: "0.2em", fontWeight: 600, textTransform: "uppercase", marginBottom: "2vh" }}>What We Built — Week 3</div>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "3.5vw", fontWeight: 700, color: "#F8FAFC", lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: "3.5vh" }}>
            Shipped. Tested. Live.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.2vh" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1.2vw" }}>
              <div style={{ width: "1.5vw", height: "1.5vw", borderRadius: "50%", background: "rgba(34,197,94,0.18)", border: "1.5px solid #22C55E", flexShrink: 0, marginTop: "0.2vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "#22C55E" }} />
              </div>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.5vw", color: "rgba(248,250,252,0.85)" }}>Two-Way Talk Room — bilingual rooms with QR share + web viewer</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1.2vw" }}>
              <div style={{ width: "1.5vw", height: "1.5vw", borderRadius: "50%", background: "rgba(34,197,94,0.18)", border: "1.5px solid #22C55E", flexShrink: 0, marginTop: "0.2vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "#22C55E" }} />
              </div>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.5vw", color: "rgba(248,250,252,0.85)" }}>Script mismatch detection across Travel Talk, Interpreter, and Talk tabs</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1.2vw" }}>
              <div style={{ width: "1.5vw", height: "1.5vw", borderRadius: "50%", background: "rgba(34,197,94,0.18)", border: "1.5px solid #22C55E", flexShrink: 0, marginTop: "0.2vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "#22C55E" }} />
              </div>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.5vw", color: "rgba(248,250,252,0.85)" }}>Keyboard language hints for non-Latin scripts (Telugu, Arabic, etc.)</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1.2vw" }}>
              <div style={{ width: "1.5vw", height: "1.5vw", borderRadius: "50%", background: "rgba(34,197,94,0.18)", border: "1.5px solid #22C55E", flexShrink: 0, marginTop: "0.2vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "#22C55E" }} />
              </div>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.5vw", color: "rgba(248,250,252,0.85)" }}>Expanded to 50+ languages with full Indian language support</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1.2vw" }}>
              <div style={{ width: "1.5vw", height: "1.5vw", borderRadius: "50%", background: "rgba(34,197,94,0.18)", border: "1.5px solid #22C55E", flexShrink: 0, marginTop: "0.2vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "#22C55E" }} />
              </div>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.5vw", color: "rgba(248,250,252,0.85)" }}>Modal language pickers — replaced broken inline dropdowns</span>
            </div>
          </div>
        </div>

        {/* Right — Tech stack */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "1.8vh" }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.25vw", color: "#00D4FF", letterSpacing: "0.2em", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.5vh" }}>Tech Stack</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.1vh" }}>
            <div style={{ background: "#16161F", borderRadius: "0.8vw", padding: "1.7vh 2vw", display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "3px solid #00D4FF" }}>
              <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.55vw", fontWeight: 600, color: "#F8FAFC" }}>Expo + React Native</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.25vw", color: "rgba(248,250,252,0.45)" }}>PWA + Mobile (iOS, Android, Web)</span>
            </div>
            <div style={{ background: "#16161F", borderRadius: "0.8vw", padding: "1.7vh 2vw", display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "3px solid #00D4FF" }}>
              <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.55vw", fontWeight: 600, color: "#00D4FF" }}>ElevenLabs</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.25vw", color: "rgba(248,250,252,0.45)" }}>Voice Cloning + TTS</span>
            </div>
            <div style={{ background: "#16161F", borderRadius: "0.8vw", padding: "1.7vh 2vw", display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "3px solid #A78BFA" }}>
              <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.55vw", fontWeight: 600, color: "#A78BFA" }}>Azure OpenAI (Replit proxy)</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.25vw", color: "rgba(248,250,252,0.45)" }}>gpt-4o-mini — Scripts + Translation</span>
            </div>
            <div style={{ background: "#16161F", borderRadius: "0.8vw", padding: "1.7vh 2vw", display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "3px solid #10B981" }}>
              <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.55vw", fontWeight: 600, color: "#10B981" }}>Express API Server</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.25vw", color: "rgba(248,250,252,0.45)" }}>Translation, Rooms, OCR routes</span>
            </div>
            <div style={{ background: "#16161F", borderRadius: "0.8vw", padding: "1.7vh 2vw", display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "3px solid #22C55E" }}>
              <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.55vw", fontWeight: 600, color: "#22C55E" }}>Web Speech API</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.25vw", color: "rgba(248,250,252,0.45)" }}>Voice Input + TTS Playback</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
