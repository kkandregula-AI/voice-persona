export default function InterpreterSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#050508" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 15% 50%, rgba(34,197,94,0.08) 0%, transparent 50%), radial-gradient(ellipse at 85% 20%, rgba(0,212,255,0.05) 0%, transparent 45%)" }} />
      <div className="absolute" style={{ top: 0, left: 0, right: 0, height: "0.15vh", background: "linear-gradient(90deg, transparent, #22C55E, transparent)" }} />

      <div className="relative flex h-full px-[8vw] py-[7vh] gap-[5vw]">
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "44%" }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "#22C55E", letterSpacing: "0.18em", fontWeight: 600, textTransform: "uppercase", marginBottom: "2vh" }}>Week 3 Hero Feature</div>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "4.5vw", fontWeight: 700, color: "#F8FAFC", lineHeight: 1.0, letterSpacing: "-0.03em", marginBottom: "1.5vh" }}>
            Live Interpreter
          </div>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2vw", fontWeight: 500, color: "#22C55E", marginBottom: "3vh" }}>
            Speak once. Reach everyone.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.8vh" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1.2vw" }}>
              <div style={{ width: "1.6vw", height: "1.6vw", borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: "1.5px solid #22C55E", flexShrink: 0, marginTop: "0.1vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "#22C55E" }} />
              </div>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.55vw", color: "rgba(248,250,252,0.85)", lineHeight: 1.4 }}>Select multiple target languages — all translate simultaneously</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1.2vw" }}>
              <div style={{ width: "1.6vw", height: "1.6vw", borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: "1.5px solid #22C55E", flexShrink: 0, marginTop: "0.1vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "#22C55E" }} />
              </div>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.55vw", color: "rgba(248,250,252,0.85)", lineHeight: 1.4 }}>Each language card has a dedicated Speak button via Web Speech API</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1.2vw" }}>
              <div style={{ width: "1.6vw", height: "1.6vw", borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: "1.5px solid #22C55E", flexShrink: 0, marginTop: "0.1vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "#22C55E" }} />
              </div>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.55vw", color: "rgba(248,250,252,0.85)", lineHeight: 1.4 }}>10-second rolling audio window — optimal for iOS Safari</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1.2vw" }}>
              <div style={{ width: "1.6vw", height: "1.6vw", borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: "1.5px solid #22C55E", flexShrink: 0, marginTop: "0.1vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "#22C55E" }} />
              </div>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.55vw", color: "rgba(248,250,252,0.85)", lineHeight: 1.4 }}>Grouped language picker — Indian + International regions</span>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "2vh" }}>
          <div style={{ background: "rgba(34,197,94,0.06)", border: "1.5px solid rgba(34,197,94,0.25)", borderRadius: "1.2vw", padding: "2vh 2vw" }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.1vw", color: "#22C55E", letterSpacing: "0.1em", fontWeight: 600, textTransform: "uppercase", marginBottom: "1.5vh" }}>Live Translation Cards</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.2vh" }}>
              <div style={{ background: "#16161F", borderRadius: "0.8vw", padding: "1.5vh 1.5vw", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.2vw", color: "rgba(248,250,252,0.45)", marginBottom: "0.4vh" }}>Hindi</div>
                  <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.5vw", fontWeight: 600, color: "#F8FAFC" }}>नमस्ते, आप कैसे हैं?</div>
                </div>
                <div style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", borderRadius: "0.5vw", padding: "0.6vh 1.2vw" }}>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.2vw", color: "#22C55E", fontWeight: 600 }}>Speak</span>
                </div>
              </div>
              <div style={{ background: "#16161F", borderRadius: "0.8vw", padding: "1.5vh 1.5vw", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.2vw", color: "rgba(248,250,252,0.45)", marginBottom: "0.4vh" }}>Japanese</div>
                  <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.5vw", fontWeight: 600, color: "#F8FAFC" }}>こんにちは、お元気ですか？</div>
                </div>
                <div style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", borderRadius: "0.5vw", padding: "0.6vh 1.2vw" }}>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.2vw", color: "#22C55E", fontWeight: 600 }}>Speak</span>
                </div>
              </div>
              <div style={{ background: "#16161F", borderRadius: "0.8vw", padding: "1.5vh 1.5vw", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.2vw", color: "rgba(248,250,252,0.45)", marginBottom: "0.4vh" }}>Spanish</div>
                  <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "1.5vw", fontWeight: 600, color: "#F8FAFC" }}>Hola, ¿cómo estás?</div>
                </div>
                <div style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", borderRadius: "0.5vw", padding: "0.6vh 1.2vw" }}>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.2vw", color: "#22C55E", fontWeight: 600 }}>Speak</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5vw" }}>
            <div style={{ background: "#16161F", borderRadius: "1vw", padding: "2vh 1.5vw", textAlign: "center" }}>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "3.5vw", fontWeight: 700, color: "#22C55E" }}>30+</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "rgba(248,250,252,0.5)" }}>languages</div>
            </div>
            <div style={{ background: "#16161F", borderRadius: "1vw", padding: "2vh 1.5vw", textAlign: "center" }}>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "3.5vw", fontWeight: 700, color: "#22C55E" }}>10s</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "rgba(248,250,252,0.5)" }}>audio window</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
