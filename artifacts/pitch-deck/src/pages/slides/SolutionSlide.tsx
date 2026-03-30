export default function SolutionSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#050508" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.07) 0%, transparent 55%)" }} />
      <div className="absolute" style={{ top: 0, left: 0, right: 0, height: "0.15vh", background: "linear-gradient(90deg, transparent, #00D4FF, transparent)" }} />

      <div className="relative flex flex-col h-full px-[8vw] py-[7vh]">
        <div style={{ marginBottom: "2vh" }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "#00D4FF", letterSpacing: "0.18em", fontWeight: 600, textTransform: "uppercase", marginBottom: "1.5vh" }}>The Solution</div>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "4.5vw", fontWeight: 700, color: "#F8FAFC", lineHeight: 1.05, letterSpacing: "-0.03em" }}>
            One app. Three superpowers.
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2vw", width: "100%" }}>
            <div style={{ background: "linear-gradient(145deg, #16161F, #0d0d14)", borderRadius: "1.2vw", padding: "4vh 2.5vw", border: "1px solid rgba(0,212,255,0.2)", display: "flex", flexDirection: "column", gap: "1.8vh" }}>
              <div style={{ width: "5vw", height: "5vw", borderRadius: "1vw", background: "rgba(0,212,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="2.5vw" height="2.5vw" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" x2="12" y1="19" y2="22"/>
                </svg>
              </div>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2.2vw", fontWeight: 700, color: "#00D4FF" }}>Voice Cloning</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.5vw", color: "rgba(248,250,252,0.7)", lineHeight: 1.55 }}>Record 15 seconds. ElevenLabs clones your voice. Speak scripts, generate reels, and narrate content — all sounding exactly like you.</div>
            </div>

            <div style={{ background: "linear-gradient(145deg, #16161F, #0d0d14)", borderRadius: "1.2vw", padding: "4vh 2.5vw", border: "1px solid rgba(167,139,250,0.2)", display: "flex", flexDirection: "column", gap: "1.8vh" }}>
              <div style={{ width: "5vw", height: "5vw", borderRadius: "1vw", background: "rgba(167,139,250,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="2.5vw" height="2.5vw" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="5"/>
                  <path d="M20 21a8 8 0 1 0-16 0"/>
                  <path d="M12 13v8"/>
                  <path d="m9 18 3 3 3-3"/>
                </svg>
              </div>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2.2vw", fontWeight: 700, color: "#A78BFA" }}>Persona Engine</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.5vw", color: "rgba(248,250,252,0.7)", lineHeight: 1.55 }}>Choose Natural, News Anchor, or Storytelling mode. Add Emotion: Calm, Energetic, Serious, or Happy. Your voice, transformed for any context.</div>
            </div>

            <div style={{ background: "linear-gradient(145deg, #16161F, #0d0d14)", borderRadius: "1.2vw", padding: "4vh 2.5vw", border: "1px solid rgba(16,185,129,0.2)", display: "flex", flexDirection: "column", gap: "1.8vh" }}>
              <div style={{ width: "5vw", height: "5vw", borderRadius: "1vw", background: "rgba(16,185,129,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="2.5vw" height="2.5vw" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  <path d="M2 12h20"/>
                </svg>
              </div>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2.2vw", fontWeight: 700, color: "#10B981" }}>Travel Talk</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.5vw", color: "rgba(248,250,252,0.7)", lineHeight: 1.55 }}>Real-time AI translation across 18 languages. Speak or type. The app speaks back in the target language and shows a large "Show to them" card.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
