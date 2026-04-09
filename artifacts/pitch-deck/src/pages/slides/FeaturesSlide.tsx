export default function FeaturesSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#050508" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 80% 50%, rgba(167,139,250,0.07) 0%, transparent 55%)" }} />

      <div className="relative flex h-full px-[8vw] py-[7vh] gap-[5vw]">
        {/* Left panel */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "34%" }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.25vw", color: "#A78BFA", letterSpacing: "0.2em", fontWeight: 600, textTransform: "uppercase", marginBottom: "2vh" }}>Studio + Creator Mode</div>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "3.8vw", fontWeight: 700, color: "#F8FAFC", lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: "2.5vh" }}>
            Professional tools. Mobile-first.
          </div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.55vw", color: "rgba(248,250,252,0.6)", lineHeight: 1.6, marginBottom: "3vh" }}>
            Everything a creator needs — voice cloning, AI scriptwriting, emotion control, and one-tap content generation — in one seamless app.
          </div>
          {/* Mode badges */}
          <div style={{ display: "flex", gap: "1vw", flexWrap: "wrap" }}>
            <div style={{ padding: "0.5vh 1.2vw", borderRadius: "6px", background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.3)", fontFamily: "Inter, sans-serif", fontSize: "1.2vw", color: "#00D4FF", fontWeight: 600 }}>Natural</div>
            <div style={{ padding: "0.5vh 1.2vw", borderRadius: "6px", background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.3)", fontFamily: "Inter, sans-serif", fontSize: "1.2vw", color: "#A78BFA", fontWeight: 600 }}>News Anchor</div>
            <div style={{ padding: "0.5vh 1.2vw", borderRadius: "6px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", fontFamily: "Inter, sans-serif", fontSize: "1.2vw", color: "#10B981", fontWeight: 600 }}>Storytelling</div>
          </div>
        </div>

        {/* Right grid */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.8vh 2vw", alignContent: "center" }}>
          {/* ElevenLabs Clone */}
          <div style={{ background: "#16161F", borderRadius: "1vw", padding: "2.5vh 2vw", display: "flex", gap: "1.4vw", alignItems: "flex-start" }}>
            <div style={{ width: "3.5vw", height: "3.5vw", borderRadius: "0.7vw", background: "rgba(0,212,255,0.12)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="1.8vw" height="1.8vw" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" x2="12" y1="19" y2="22"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.65vw", fontWeight: 700, color: "#F8FAFC", marginBottom: "0.6vh" }}>ElevenLabs Voice Clone</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.35vw", color: "rgba(248,250,252,0.6)", lineHeight: 1.45 }}>Record 15 seconds. Clone instantly. Output sounds indistinguishable from the real you.</div>
            </div>
          </div>

          {/* AI Reel Generator */}
          <div style={{ background: "#16161F", borderRadius: "1vw", padding: "2.5vh 2vw", display: "flex", gap: "1.4vw", alignItems: "flex-start" }}>
            <div style={{ width: "3.5vw", height: "3.5vw", borderRadius: "0.7vw", background: "rgba(167,139,250,0.12)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="1.8vw" height="1.8vw" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.65vw", fontWeight: 700, color: "#F8FAFC", marginBottom: "0.6vh" }}>AI Reel Generator</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.35vw", color: "rgba(248,250,252,0.6)", lineHeight: 1.45 }}>Enter a topic, pick Reel / News / Speech / Podcast. AI writes the script. One tap to hear it in your voice.</div>
            </div>
          </div>

          {/* Emotion Engine */}
          <div style={{ background: "#16161F", borderRadius: "1vw", padding: "2.5vh 2vw", display: "flex", gap: "1.4vw", alignItems: "flex-start" }}>
            <div style={{ width: "3.5vw", height: "3.5vw", borderRadius: "0.7vw", background: "rgba(255,107,107,0.12)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="1.8vw" height="1.8vw" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.65vw", fontWeight: 700, color: "#F8FAFC", marginBottom: "0.6vh" }}>Emotion Engine</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.35vw", color: "rgba(248,250,252,0.6)", lineHeight: 1.45 }}>Calm, Energetic, Serious, or Happy — rate and pitch adjust per emotion across all three persona modes.</div>
            </div>
          </div>

          {/* Waveform + Export */}
          <div style={{ background: "#16161F", borderRadius: "1vw", padding: "2.5vh 2vw", display: "flex", gap: "1.4vw", alignItems: "flex-start" }}>
            <div style={{ width: "3.5vw", height: "3.5vw", borderRadius: "0.7vw", background: "rgba(16,185,129,0.12)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="1.8vw" height="1.8vw" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12h2l3-9 4 18 3-9 2 0"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.65vw", fontWeight: 700, color: "#F8FAFC", marginBottom: "0.6vh" }}>Waveform + SRT Export</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.35vw", color: "rgba(248,250,252,0.6)", lineHeight: 1.45 }}>Live waveform visualizer during playback. Download audio or export timed SRT caption file — ready for video editors.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
