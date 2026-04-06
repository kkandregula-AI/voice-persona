export default function SolutionSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#050508" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.07) 0%, transparent 55%)" }} />
      <div className="absolute" style={{ top: 0, left: 0, right: 0, height: "0.15vh", background: "linear-gradient(90deg, transparent, #00D4FF, transparent)" }} />

      <div className="relative flex flex-col h-full px-[8vw] py-[6vh]">
        <div style={{ marginBottom: "2.5vh" }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "#00D4FF", letterSpacing: "0.18em", fontWeight: 600, textTransform: "uppercase", marginBottom: "1.2vh" }}>The Solution</div>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "4vw", fontWeight: 700, color: "#F8FAFC", lineHeight: 1.05, letterSpacing: "-0.03em" }}>
            One app. Four superpowers.
          </div>
        </div>

        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: "2vh 2vw" }}>
          <div style={{ background: "linear-gradient(145deg, #16161F, #0d0d14)", borderRadius: "1.2vw", padding: "3vh 2.2vw", border: "1px solid rgba(0,212,255,0.2)", display: "flex", gap: "1.5vw", alignItems: "flex-start" }}>
            <div style={{ width: "4vw", height: "4vw", borderRadius: "0.8vw", background: "rgba(0,212,255,0.12)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="2vw" height="2vw" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" x2="12" y1="19" y2="22"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2vw", fontWeight: 700, color: "#00D4FF", marginBottom: "1vh" }}>Voice Cloning</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.45vw", color: "rgba(248,250,252,0.7)", lineHeight: 1.5 }}>Record 15 seconds. ElevenLabs clones your voice instantly. Every generated word sounds exactly like you.</div>
            </div>
          </div>

          <div style={{ background: "linear-gradient(145deg, #16161F, #0d0d14)", borderRadius: "1.2vw", padding: "3vh 2.2vw", border: "1px solid rgba(167,139,250,0.2)", display: "flex", gap: "1.5vw", alignItems: "flex-start" }}>
            <div style={{ width: "4vw", height: "4vw", borderRadius: "0.8vw", background: "rgba(167,139,250,0.12)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="2vw" height="2vw" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="5"/>
                <path d="M20 21a8 8 0 1 0-16 0"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2vw", fontWeight: 700, color: "#A78BFA", marginBottom: "1vh" }}>Persona Engine</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.45vw", color: "rgba(248,250,252,0.7)", lineHeight: 1.5 }}>Natural, News Anchor, or Storytelling mode — each with Emotion control: Calm, Energetic, Serious, or Happy.</div>
            </div>
          </div>

          <div style={{ background: "linear-gradient(145deg, #16161F, #0d0d14)", borderRadius: "1.2vw", padding: "3vh 2.2vw", border: "1px solid rgba(16,185,129,0.2)", display: "flex", gap: "1.5vw", alignItems: "flex-start" }}>
            <div style={{ width: "4vw", height: "4vw", borderRadius: "0.8vw", background: "rgba(16,185,129,0.12)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="2vw" height="2vw" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                <path d="M2 12h20"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2vw", fontWeight: 700, color: "#10B981", marginBottom: "1vh" }}>Travel Talk</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.45vw", color: "rgba(248,250,252,0.7)", lineHeight: 1.5 }}>Real-time two-way AI translation. Speak or type — the app speaks back in the target language with a large "Show to them" card.</div>
            </div>
          </div>

          <div style={{ background: "linear-gradient(145deg, #16161F, #0d0d14)", borderRadius: "1.2vw", padding: "3vh 2.2vw", border: "1px solid rgba(34,197,94,0.2)", display: "flex", gap: "1.5vw", alignItems: "flex-start" }}>
            <div style={{ width: "4vw", height: "4vw", borderRadius: "0.8vw", background: "rgba(34,197,94,0.12)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="2vw" height="2vw" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12h5"/><path d="m7 7-5 5 5 5"/>
                <path d="M22 12h-5"/><path d="m17 7 5 5-5 5"/>
                <rect x="8" y="8" width="8" height="8" rx="1"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2vw", fontWeight: 700, color: "#22C55E", marginBottom: "1vh" }}>Live Interpreter</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.45vw", color: "rgba(248,250,252,0.7)", lineHeight: 1.5 }}>Speak once — get simultaneous translations into multiple languages at once with per-language Speak buttons. Week 3 hero.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
