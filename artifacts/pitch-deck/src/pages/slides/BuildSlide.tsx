export default function BuildSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#050508" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 0% 100%, rgba(167,139,250,0.07) 0%, transparent 55%), radial-gradient(ellipse at 100% 0%, rgba(0,212,255,0.05) 0%, transparent 50%)" }} />

      <div className="relative flex h-full px-[8vw] py-[7vh] gap-[4vw]">
        <div style={{ width: "50%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "#22C55E", letterSpacing: "0.18em", fontWeight: 600, textTransform: "uppercase", marginBottom: "2vh" }}>What We Built — Week 3</div>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "3.5vw", fontWeight: 700, color: "#F8FAFC", lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: "3.5vh" }}>
            Shipped. Tested. Live.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.3vh" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1.2vw" }}>
              <div style={{ width: "1.5vw", height: "1.5vw", borderRadius: "50%", background: "rgba(34,197,94,0.2)", border: "1.5px solid #22C55E", flexShrink: 0, marginTop: "0.2vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "#22C55E" }} />
              </div>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.55vw", color: "rgba(248,250,252,0.85)" }}>Live Interpreter — multi-target simultaneous language translation</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1.2vw" }}>
              <div style={{ width: "1.5vw", height: "1.5vw", borderRadius: "50%", background: "rgba(34,197,94,0.2)", border: "1.5px solid #22C55E", flexShrink: 0, marginTop: "0.2vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "#22C55E" }} />
              </div>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.55vw", color: "rgba(248,250,252,0.85)" }}>Per-language Speak cards using Web Speech API</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1.2vw" }}>
              <div style={{ width: "1.5vw", height: "1.5vw", borderRadius: "50%", background: "rgba(34,197,94,0.2)", border: "1.5px solid #22C55E", flexShrink: 0, marginTop: "0.2vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "#22C55E" }} />
              </div>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.55vw", color: "rgba(248,250,252,0.85)" }}>30+ languages grouped Indian + International regions</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1.2vw" }}>
              <div style={{ width: "1.5vw", height: "1.5vw", borderRadius: "50%", background: "rgba(34,197,94,0.2)", border: "1.5px solid #22C55E", flexShrink: 0, marginTop: "0.2vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "#22C55E" }} />
              </div>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.55vw", color: "rgba(248,250,252,0.85)" }}>Home screen quick actions for Travel Talk + Interpreter</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1.2vw" }}>
              <div style={{ width: "1.5vw", height: "1.5vw", borderRadius: "50%", background: "rgba(34,197,94,0.2)", border: "1.5px solid #22C55E", flexShrink: 0, marginTop: "0.2vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "#22C55E" }} />
              </div>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.55vw", color: "rgba(248,250,252,0.85)" }}>How-to info cards across all 5 tabs for discoverability</span>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "2vh" }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "#00D4FF", letterSpacing: "0.18em", fontWeight: 600, textTransform: "uppercase", marginBottom: "1vh" }}>Tech Stack</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2vh" }}>
            <div style={{ background: "#16161F", borderRadius: "0.8vw", padding: "1.8vh 2vw", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.6vw", fontWeight: 600, color: "#F8FAFC" }}>Expo + React Native</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "rgba(248,250,252,0.5)" }}>PWA + Mobile</span>
            </div>
            <div style={{ background: "#16161F", borderRadius: "0.8vw", padding: "1.8vh 2vw", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.6vw", fontWeight: 600, color: "#00D4FF" }}>ElevenLabs</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "rgba(248,250,252,0.5)" }}>Voice Cloning + TTS</span>
            </div>
            <div style={{ background: "#16161F", borderRadius: "0.8vw", padding: "1.8vh 2vw", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.6vw", fontWeight: 600, color: "#A78BFA" }}>OpenRouter AI</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "rgba(248,250,252,0.5)" }}>Scripts + Translation</span>
            </div>
            <div style={{ background: "#16161F", borderRadius: "0.8vw", padding: "1.8vh 2vw", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.6vw", fontWeight: 600, color: "#10B981" }}>Express API Server</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "rgba(248,250,252,0.5)" }}>Backend + Routing</span>
            </div>
            <div style={{ background: "#16161F", borderRadius: "0.8vw", padding: "1.8vh 2vw", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.6vw", fontWeight: 600, color: "#22C55E" }}>Web Speech API</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "rgba(248,250,252,0.5)" }}>Voice Input + TTS Playback</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
