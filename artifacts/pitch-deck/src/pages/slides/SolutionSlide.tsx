export default function SolutionSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#050508" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.07) 0%, transparent 55%)" }} />
      <div className="absolute" style={{ top: 0, left: 0, right: 0, height: "0.15vh", background: "linear-gradient(90deg, transparent, #00D4FF, transparent)" }} />

      <div className="relative flex flex-col h-full px-[8vw] py-[6vh]">
        {/* Header */}
        <div style={{ marginBottom: "2.5vh" }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.25vw", color: "#00D4FF", letterSpacing: "0.2em", fontWeight: 600, textTransform: "uppercase", marginBottom: "1.2vh" }}>The Solution</div>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "4vw", fontWeight: 700, color: "#F8FAFC", lineHeight: 1.05, letterSpacing: "-0.03em" }}>
            One app. Seven tabs. Zero compromise.
          </div>
        </div>

        {/* 2x2 grid */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: "1.8vh 2vw" }}>
          {/* Voice Studio */}
          <div style={{ background: "linear-gradient(145deg, #16161F, #0d0d14)", borderRadius: "1.2vw", padding: "2.8vh 2.2vw", border: "1px solid rgba(0,212,255,0.2)", display: "flex", gap: "1.5vw", alignItems: "flex-start" }}>
            <div style={{ width: "4vw", height: "4vw", borderRadius: "0.8vw", background: "rgba(0,212,255,0.12)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="2vw" height="2vw" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" x2="12" y1="19" y2="22"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.9vw", fontWeight: 700, color: "#00D4FF", marginBottom: "0.8vh" }}>Voice Studio + Creator</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.4vw", color: "rgba(248,250,252,0.7)", lineHeight: 1.5 }}>15s voice clone via ElevenLabs. 3 persona modes, 4 emotions. AI writes scripts — you speak them. SRT export included.</div>
            </div>
          </div>

          {/* Travel Talk */}
          <div style={{ background: "linear-gradient(145deg, #16161F, #0d0d14)", borderRadius: "1.2vw", padding: "2.8vh 2.2vw", border: "1px solid rgba(16,185,129,0.2)", display: "flex", gap: "1.5vw", alignItems: "flex-start" }}>
            <div style={{ width: "4vw", height: "4vw", borderRadius: "0.8vw", background: "rgba(16,185,129,0.12)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="2vw" height="2vw" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                <path d="M2 12h20"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.9vw", fontWeight: 700, color: "#10B981", marginBottom: "0.8vh" }}>Travel Talk</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.4vw", color: "rgba(248,250,252,0.7)", lineHeight: 1.5 }}>50+ languages. Speak, listen, type, or scan a sign with your camera. Giant "Show to them" card. Memory sessions saved locally.</div>
            </div>
          </div>

          {/* Live Interpreter */}
          <div style={{ background: "linear-gradient(145deg, #16161F, #0d0d14)", borderRadius: "1.2vw", padding: "2.8vh 2.2vw", border: "1px solid rgba(167,139,250,0.2)", display: "flex", gap: "1.5vw", alignItems: "flex-start" }}>
            <div style={{ width: "4vw", height: "4vw", borderRadius: "0.8vw", background: "rgba(167,139,250,0.12)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="2vw" height="2vw" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12h5"/><path d="m7 7-5 5 5 5"/>
                <path d="M22 12h-5"/><path d="m17 7 5 5-5 5"/>
                <rect x="8" y="8" width="8" height="8" rx="1"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.9vw", fontWeight: 700, color: "#A78BFA", marginBottom: "0.8vh" }}>Live Interpreter</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.4vw", color: "rgba(248,250,252,0.7)", lineHeight: 1.5 }}>Type once — get simultaneous translations into every selected language. Per-language Speak cards. Built for classrooms, clinics, and events.</div>
            </div>
          </div>

          {/* Two-Way Talk */}
          <div style={{ background: "linear-gradient(145deg, #16161F, #0d0d14)", borderRadius: "1.2vw", padding: "2.8vh 2.2vw", border: "1px solid rgba(34,197,94,0.2)", display: "flex", gap: "1.5vw", alignItems: "flex-start" }}>
            <div style={{ width: "4vw", height: "4vw", borderRadius: "0.8vw", background: "rgba(34,197,94,0.12)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="2vw" height="2vw" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12 19.79 19.79 0 0 1 1.93 3.4 2 2 0 0 1 3.89 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.9vw", fontWeight: 700, color: "#22C55E", marginBottom: "0.8vh" }}>Two-Way Talk Room</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.4vw", color: "rgba(248,250,252,0.7)", lineHeight: 1.5 }}>Create a live translation room. Share via QR code or link. Both sides speak their own language — translated in real time. Works in any browser.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
