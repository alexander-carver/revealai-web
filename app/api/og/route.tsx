import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "Reveal AI";
  const subtitle =
    searchParams.get("subtitle") ||
    "People Search | Safety Lookup & Privacy Toolkit";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Background pattern dots */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />

        {/* Red accent line at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "linear-gradient(90deg, #dc2626, #ef4444, #dc2626)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px",
            maxWidth: "1000px",
          }}
        >
          {/* Logo text */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                fontWeight: 800,
                color: "white",
              }}
            >
              R
            </div>
            <span
              style={{
                fontSize: "32px",
                fontWeight: 700,
                color: "white",
              }}
            >
              Reveal AI
            </span>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: "56px",
              fontWeight: 800,
              color: "white",
              textAlign: "center",
              lineHeight: 1.2,
              marginBottom: "16px",
            }}
          >
            {title}
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: "24px",
              color: "#94a3b8",
              textAlign: "center",
              lineHeight: 1.4,
              maxWidth: "800px",
            }}
          >
            {subtitle}
          </div>

          {/* Stats bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "40px",
              marginTop: "40px",
              padding: "16px 32px",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <span
                style={{ fontSize: "28px", fontWeight: 700, color: "#dc2626" }}
              >
                500M+
              </span>
              <span style={{ fontSize: "14px", color: "#94a3b8" }}>
                Records
              </span>
            </div>
            <div
              style={{
                width: "1px",
                height: "40px",
                background: "rgba(255,255,255,0.15)",
              }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <span
                style={{ fontSize: "28px", fontWeight: 700, color: "#dc2626" }}
              >
                4.9★
              </span>
              <span style={{ fontSize: "14px", color: "#94a3b8" }}>
                Rating
              </span>
            </div>
            <div
              style={{
                width: "1px",
                height: "40px",
                background: "rgba(255,255,255,0.15)",
              }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <span
                style={{ fontSize: "28px", fontWeight: 700, color: "#dc2626" }}
              >
                100+
              </span>
              <span style={{ fontSize: "14px", color: "#94a3b8" }}>
                Platforms
              </span>
            </div>
          </div>
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            fontSize: "16px",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          revealai-peoplesearch.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
