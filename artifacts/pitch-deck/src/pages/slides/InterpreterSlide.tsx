export default function InterpreterSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#050508" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 10% 50%, rgba(34,197,94,0.08) 0%, transparent 48%), radial-gradient(ellipse at 90% 20%, rgba(0,212,255,0.06) 0%, transparent 45%)" }} />
      <div className="absolute" style={{ top: 0, left: 0, right: 0, height: "0.15vh", background: "linear-gradient(90deg, transparent, #22C55E 40%, #00D4FF 70%, transparent)" }} />

      <div className="relative flex flex-col h-full px-[8vw] py-[6vh]">
        {/* Header */}
        <div style={{ marginBottom: "2.5vh" }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.25vw", color: "#22C55E", letterSpacing: "0.2em", fontWeight: 600, textTransform: "uppercase", marginBottom: "1vh" }}>Week 3 Hero Features</div>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "3.8vw", fontWeight: 700, color: "#F8FAFC", lineHeight: 1.05, letterSpacing: "-0.03em" }}>
            Interpreter + Two-Way Talk
          </div>
        </div>

        {/* Two panels side by side */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5vw" }}>
          {/* Left — Interpreter */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5vh" }}>
            <div style={{ background: "rgba(34,197,94,0.07)", border: "1.5px solid rgba(34,197,94,0.28)", borderRadius: "1.2vw", padding: "2vh 2vw", flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.15vw", color: "#22C55E", letterSpacing: "0.1em", fontWeight: 600, textTransform: "uppercase", marginBottom: "1.5vh" }}>Live Interpreter — Speak Once, Reach Everyone</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1vh", marginBottom: "2vh" }}>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.45vw", color: "rgba(248,250,252,0.82)" }}>Type in any language, select multiple targets — all translate simultaneously</span>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.45vw", color: "rgba(248,250,252,0.82)" }}>Per-language Speak card — one tap plays the translation aloud</span>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.45vw", color: "rgba(248,250,252,0.82)" }}>Script mismatch warning — catches wrong-keyboard input</span>
              </div>
              {/* Mock translation cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8vh" }}>
                <div style={{ background: "#16161F", borderRadius: "0.8vw", padding: "1.2vh 1.5vw", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.1vw", color: "rgba(248,250,252,0.4)", marginBottom: "0.3vh" }}>Hindi</div>
                    <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.45vw", fontWeight: 600, color: "#F8FAFC" }}>नमस्ते, आप कैसे हैं?</div>
                  </div>
                  <div style={{ background: "rgba(34,197,94,0.14)", border: "1px solid rgba(34,197,94,0.38)", borderRadius: "0.5vw", padding: "0.5vh 1.1vw" }}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.15vw", color: "#22C55E", fontWeight: 600 }}>Speak</span>
                  </div>
                </div>
                <div style={{ background: "#16161F", borderRadius: "0.8vw", padding: "1.2vh 1.5vw", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.1vw", color: "rgba(248,250,252,0.4)", marginBottom: "0.3vh" }}>Japanese</div>
                    <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.45vw", fontWeight: 600, color: "#F8FAFC" }}>こんにちは、お元気ですか？</div>
                  </div>
                  <div style={{ background: "rgba(34,197,94,0.14)", border: "1px solid rgba(34,197,94,0.38)", borderRadius: "0.5vw", padding: "0.5vh 1.1vw" }}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.15vw", color: "#22C55E", fontWeight: 600 }}>Speak</span>
                  </div>
                </div>
                <div style={{ background: "#16161F", borderRadius: "0.8vw", padding: "1.2vh 1.5vw", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.1vw", color: "rgba(248,250,252,0.4)", marginBottom: "0.3vh" }}>Spanish</div>
                    <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.45vw", fontWeight: 600, color: "#F8FAFC" }}>Hola, ¿cómo estás?</div>
                  </div>
                  <div style={{ background: "rgba(34,197,94,0.14)", border: "1px solid rgba(34,197,94,0.38)", borderRadius: "0.5vw", padding: "0.5vh 1.1vw" }}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.15vw", color: "#22C55E", fontWeight: 600 }}>Speak</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Talk tab */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5vh" }}>
            <div style={{ background: "rgba(0,212,255,0.06)", border: "1.5px solid rgba(0,212,255,0.25)", borderRadius: "1.2vw", padding: "2vh 2vw", flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.15vw", color: "#00D4FF", letterSpacing: "0.1em", fontWeight: 600, textTransform: "uppercase", marginBottom: "1.5vh" }}>Two-Way Talk — Live Bilingual Room</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1vh", marginBottom: "2.5vh" }}>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.45vw", color: "rgba(248,250,252,0.82)" }}>Create a room in one tap — share via QR code or link</span>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.45vw", color: "rgba(248,250,252,0.82)" }}>Both sides speak their language — translated live in both directions</span>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.45vw", color: "rgba(248,250,252,0.82)" }}>Other person joins from any browser — no app install needed</span>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.45vw", color: "rgba(248,250,252,0.82)" }}>Save and download the full bilingual transcript</span>
              </div>

              {/* Mock conversation */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1vh" }}>
                <div style={{ background: "#16161F", borderRadius: "0.8vw", padding: "1.2vh 1.5vw", borderLeft: "3px solid #00D4FF" }}>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.1vw", color: "#00D4FF", marginBottom: "0.3vh", fontWeight: 600 }}>You (English)</div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.4vw", color: "rgba(248,250,252,0.85)" }}>"Where is the nearest hospital?"</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.8vw", paddingLeft: "0.5vw" }}>
                  <div style={{ width: "1.5vw", height: "1.5vw", borderRadius: "50%", background: "rgba(0,212,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="0.8vw" height="0.8vw" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7 7 7-7"/><path d="M12 5v14"/></svg>
                  </div>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.1vw", color: "rgba(248,250,252,0.35)" }}>AI translates instantly</span>
                </div>
                <div style={{ background: "#16161F", borderRadius: "0.8vw", padding: "1.2vh 1.5vw", borderLeft: "3px solid #A78BFA" }}>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.1vw", color: "#A78BFA", marginBottom: "0.3vh", fontWeight: 600 }}>Them (Telugu)</div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.4vw", color: "rgba(248,250,252,0.85)" }}>"సమీప ఆసుపత్రి ఎక్కడ ఉంది?"</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
