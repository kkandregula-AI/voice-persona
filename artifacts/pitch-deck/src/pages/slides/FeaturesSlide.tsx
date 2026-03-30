export default function FeaturesSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#050508" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 80% 50%, rgba(167,139,250,0.06) 0%, transparent 55%)" }} />

      <div className="relative flex h-full px-[8vw] py-[7vh] gap-[5vw]">
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "35%" }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "#A78BFA", letterSpacing: "0.18em", fontWeight: 600, textTransform: "uppercase", marginBottom: "2vh" }}>Studio Features</div>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "4vw", fontWeight: 700, color: "#F8FAFC", lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: "3vh" }}>
            Professional tools. Mobile-first.
          </div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.6vw", color: "rgba(248,250,252,0.6)", lineHeight: 1.6 }}>
            Everything a creator needs — voice cloning, script writing, emotion control, and content generation — in one seamless Expo app.
          </div>
        </div>

        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2vh 2vw", alignContent: "center" }}>
          <div style={{ background: "#16161F", borderRadius: "1vw", padding: "2.5vh 2vw", display: "flex", gap: "1.5vw", alignItems: "flex-start" }}>
            <div style={{ width: "3.5vw", height: "3.5vw", borderRadius: "0.7vw", background: "rgba(0,212,255,0.12)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="1.8vw" height="1.8vw" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.7vw", fontWeight: 700, color: "#F8FAFC", marginBottom: "0.6vh" }}>ElevenLabs Voice Clone</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.4vw", color: "rgba(248,250,252,0.6)", lineHeight: 1.4 }}>15-second voice sample. Clones instantly. Sounds indistinguishable from the real you.</div>
            </div>
          </div>

          <div style={{ background: "#16161F", borderRadius: "1vw", padding: "2.5vh 2vw", display: "flex", gap: "1.5vw", alignItems: "flex-start" }}>
            <div style={{ width: "3.5vw", height: "3.5vw", borderRadius: "0.7vw", background: "rgba(167,139,250,0.12)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="1.8vw" height="1.8vw" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.7vw", fontWeight: 700, color: "#F8FAFC", marginBottom: "0.6vh" }}>AI Reel Generator</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.4vw", color: "rgba(248,250,252,0.6)", lineHeight: 1.4 }}>Enter a topic. AI writes a script. Your cloned voice reads it. One-tap generation for Reels, News, Podcasts, Speeches.</div>
            </div>
          </div>

          <div style={{ background: "#16161F", borderRadius: "1vw", padding: "2.5vh 2vw", display: "flex", gap: "1.5vw", alignItems: "flex-start" }}>
            <div style={{ width: "3.5vw", height: "3.5vw", borderRadius: "0.7vw", background: "rgba(255,107,107,0.12)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="1.8vw" height="1.8vw" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.04Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.04Z"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.7vw", fontWeight: 700, color: "#F8FAFC", marginBottom: "0.6vh" }}>Emotion Engine</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.4vw", color: "rgba(248,250,252,0.6)", lineHeight: 1.4 }}>Control tone and delivery. Calm, Energetic, Serious, or Happy — matched to every persona mode.</div>
            </div>
          </div>

          <div style={{ background: "#16161F", borderRadius: "1vw", padding: "2.5vh 2vw", display: "flex", gap: "1.5vw", alignItems: "flex-start" }}>
            <div style={{ width: "3.5vw", height: "3.5vw", borderRadius: "0.7vw", background: "rgba(16,185,129,0.12)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="1.8vw" height="1.8vw" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.7vw", fontWeight: 700, color: "#F8FAFC", marginBottom: "0.6vh" }}>Animated Waveform + History</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.4vw", color: "rgba(248,250,252,0.6)", lineHeight: 1.4 }}>Real-time waveform visualization during recording. Full playback and download history stored locally.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
