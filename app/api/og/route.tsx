import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0D0D1F",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Purple glow top-left */}
        <div
          style={{
            position: "absolute",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)",
            top: -100,
            left: -80,
          }}
        />
        {/* Purple glow bottom-right */}
        <div
          style={{
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)",
            bottom: -60,
            right: -40,
          }}
        />
        {/* Rose glow top-right */}
        <div
          style={{
            position: "absolute",
            width: 260,
            height: 260,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(244,63,94,0.1) 0%, transparent 70%)",
            top: -20,
            right: 100,
          }}
        />

        {/* Grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(124,58,237,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.05) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
            position: "relative",
          }}
        >
          {/* Emoji */}
          <div style={{ fontSize: 96, lineHeight: 1, marginBottom: 24 }}>🍬</div>

          {/* Title */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: "#E2E8F0",
              letterSpacing: "-2px",
              lineHeight: 1,
              textShadow: "0 0 40px rgba(124,58,237,0.7), 0 0 80px rgba(124,58,237,0.35)",
            }}
          >
            ChupeteClicker
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#7C3AED",
              letterSpacing: "6px",
              textTransform: "uppercase",
              marginTop: 16,
            }}
          >
            Coleccionables Argentinos
          </div>

          {/* Divider */}
          <div
            style={{
              width: 280,
              height: 1,
              background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.6), transparent)",
              marginTop: 28,
              marginBottom: 28,
            }}
          />

          {/* Steps */}
          <div
            style={{
              display: "flex",
              gap: 40,
              alignItems: "center",
            }}
          >
            {["Clickeá", "Abrí cajas", "Coleccioná", "Vendé"].map((step, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "rgba(124,58,237,0.15)",
                    border: "1px solid rgba(124,58,237,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#A78BFA",
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
                  {step}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tag */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#7C3AED",
              boxShadow: "0 0 8px rgba(124,58,237,0.8)",
            }}
          />
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.2)", letterSpacing: "2px" }}>
            chupete-chi.vercel.app
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
