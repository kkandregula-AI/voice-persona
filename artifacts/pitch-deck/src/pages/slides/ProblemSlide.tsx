export default function ProblemSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#050508" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(255,107,107,0.07) 0%, transparent 60%)" }} />

      <div className="relative flex flex-col h-full px-[8vw] py-[7vh]">
        <div style={{ marginBottom: "1.5vh" }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.3vw", color: "#FF6B6B", letterSpacing: "0.18em", fontWeight: 600, textTransform: "uppercase", marginBottom: "1.5vh" }}>The Problem</div>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "4.5vw", fontWeight: 700, color: "#F8FAFC", lineHeight: 1.05, letterSpacing: "-0.03em" }}>
            Creating with your voice is broken
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2.5vw", width: "100%" }}>
            <div style={{ background: "#16161F", borderRadius: "1.2vw", padding: "3.5vh 2.5vw", borderTop: "3px solid #FF6B6B", display: "flex", flexDirection: "column", gap: "1.5vh" }}>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "3.5vw", fontWeight: 700, color: "#FF6B6B" }}>01</div>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2vw", fontWeight: 600, color: "#F8FAFC", lineHeight: 1.2 }}>Hours lost to voiceover editing</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.5vw", color: "rgba(248,250,252,0.6)", lineHeight: 1.5 }}>Content creators spend more time editing audio than creating. Expensive studios or voice talent add cost without flexibility.</div>
            </div>
            <div style={{ background: "#16161F", borderRadius: "1.2vw", padding: "3.5vh 2.5vw", borderTop: "3px solid #FF6B6B", display: "flex", flexDirection: "column", gap: "1.5vh" }}>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "3.5vw", fontWeight: 700, color: "#FF6B6B" }}>02</div>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2vw", fontWeight: 600, color: "#F8FAFC", lineHeight: 1.2 }}>Language barriers kill moments</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.5vw", color: "rgba(248,250,252,0.6)", lineHeight: 1.5 }}>Travelers miss experiences, misread menus, lose deals. Clunky translation apps require Wi-Fi and slow everything down.</div>
            </div>
            <div style={{ background: "#16161F", borderRadius: "1.2vw", padding: "3.5vh 2.5vw", borderTop: "3px solid #FF6B6B", display: "flex", flexDirection: "column", gap: "1.5vh" }}>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "3.5vw", fontWeight: 700, color: "#FF6B6B" }}>03</div>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2vw", fontWeight: 600, color: "#F8FAFC", lineHeight: 1.2 }}>Generic AI voices feel inhuman</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.5vw", color: "rgba(248,250,252,0.6)", lineHeight: 1.5 }}>Text-to-speech tools use robotic voices with zero personality. Your brand voice — your tone, your style — is lost.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
