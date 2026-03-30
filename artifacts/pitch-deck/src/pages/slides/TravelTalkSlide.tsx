const base = import.meta.env.BASE_URL;

export default function TravelTalkSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#050508" }}>
      <img
        src={`${base}travel-bg.png`}
        crossOrigin="anonymous"
        alt="Travel background"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.28 }}
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(5,5,8,0.97) 0%, rgba(5,5,8,0.7) 55%, rgba(5,5,8,0.4) 100%)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(16,185,129,0.1) 0%, transparent 50%)" }} />

      <div className="relative flex h-full px-[8vw] py-[7vh] gap-[6vw]">
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "50%" }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "#10B981", letterSpacing: "0.18em", fontWeight: 600, textTransform: "uppercase", marginBottom: "2vh" }}>Week 2 Hero Feature</div>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "5vw", fontWeight: 700, color: "#F8FAFC", lineHeight: 1.0, letterSpacing: "-0.03em", marginBottom: "3vh" }}>
            Travel Talk
          </div>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2.2vw", fontWeight: 500, color: "#10B981", marginBottom: "3vh" }}>
            Speak naturally. Let AI bridge the language.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5vh" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1.2vw" }}>
              <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "#10B981", flexShrink: 0 }} />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.6vw", color: "rgba(248,250,252,0.85)" }}>Speak or type — translation fires instantly</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1.2vw" }}>
              <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "#10B981", flexShrink: 0 }} />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.6vw", color: "rgba(248,250,252,0.85)" }}>Auto-speaks translation in the target language</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1.2vw" }}>
              <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "#10B981", flexShrink: 0 }} />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.6vw", color: "rgba(248,250,252,0.85)" }}>Giant "Show to them" card — no squinting</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1.2vw" }}>
              <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "#10B981", flexShrink: 0 }} />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.6vw", color: "rgba(248,250,252,0.85)" }}>Quick Travel Phrases for menus, hotels, emergencies</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1.2vw" }}>
              <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "#10B981", flexShrink: 0 }} />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.6vw", color: "rgba(248,250,252,0.85)" }}>Conversation history with replay and copy</span>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "2vh" }}>
          <div style={{ background: "rgba(16,185,129,0.1)", border: "1.5px solid rgba(16,185,129,0.35)", borderRadius: "1.2vw", padding: "2.5vh 2.2vw" }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.2vw", color: "#10B981", marginBottom: "1vh", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase" }}>18 Languages Supported</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8vw" }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "rgba(248,250,252,0.75)" }}>Spanish</span>
              <span style={{ color: "rgba(248,250,252,0.3)", fontSize: "1.3vw" }}>·</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "rgba(248,250,252,0.75)" }}>French</span>
              <span style={{ color: "rgba(248,250,252,0.3)", fontSize: "1.3vw" }}>·</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "rgba(248,250,252,0.75)" }}>Japanese</span>
              <span style={{ color: "rgba(248,250,252,0.3)", fontSize: "1.3vw" }}>·</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "rgba(248,250,252,0.75)" }}>Korean</span>
              <span style={{ color: "rgba(248,250,252,0.3)", fontSize: "1.3vw" }}>·</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "rgba(248,250,252,0.75)" }}>Arabic</span>
              <span style={{ color: "rgba(248,250,252,0.3)", fontSize: "1.3vw" }}>·</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "rgba(248,250,252,0.75)" }}>Hindi</span>
              <span style={{ color: "rgba(248,250,252,0.3)", fontSize: "1.3vw" }}>·</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "rgba(248,250,252,0.75)" }}>German</span>
              <span style={{ color: "rgba(248,250,252,0.3)", fontSize: "1.3vw" }}>·</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "rgba(248,250,252,0.75)" }}>Chinese</span>
              <span style={{ color: "rgba(248,250,252,0.3)", fontSize: "1.3vw" }}>·</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "rgba(248,250,252,0.75)" }}>+ 10 more</span>
            </div>
          </div>

          <div style={{ background: "#16161F", border: "1px solid rgba(248,250,252,0.08)", borderRadius: "1.2vw", padding: "2.5vh 2.2vw" }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.2vw", color: "rgba(248,250,252,0.45)", marginBottom: "1.2vh" }}>AI Translation Priority Chain</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8vh" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
                <div style={{ background: "#10B981", borderRadius: "4px", padding: "0.2vh 0.7vw", fontFamily: "Inter, sans-serif", fontSize: "1.2vw", fontWeight: 600, color: "#050508" }}>1</div>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.4vw", color: "rgba(248,250,252,0.8)" }}>OpenRouter AI — contextual, conversational accuracy</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
                <div style={{ background: "#A78BFA", borderRadius: "4px", padding: "0.2vh 0.7vw", fontFamily: "Inter, sans-serif", fontSize: "1.2vw", fontWeight: 600, color: "#050508" }}>2</div>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.4vw", color: "rgba(248,250,252,0.8)" }}>MyMemory fallback — only if confidence score is above 80%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
