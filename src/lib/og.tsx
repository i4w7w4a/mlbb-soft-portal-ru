import { ImageResponse } from "next/og";

export const OG_IMAGE_SIZE = {
  width: 1200,
  height: 630,
} as const;

export const OG_IMAGE_CONTENT_TYPE = "image/png";

type OgImageOptions = {
  eyebrow: string;
  title: string;
  description: string;
  accent?: string;
  chips?: string[];
  footerLeft?: string;
  footerRight?: string;
  variant?: "portal" | "hero" | "story";
  watermark?: string;
};

function truncate(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}...`;
}

export function createOgImageResponse({
  eyebrow,
  title,
  description,
  accent = "#65e6ff",
  chips = [],
  footerLeft = "SOFT Rift",
  footerRight = "MLBB editorial portal",
  variant = "portal",
  watermark = "SOFT",
}: OgImageOptions) {
  const visibleChips = chips.filter(Boolean).slice(0, 4);
  const railLabel =
    variant === "hero"
      ? "Hero Universe"
      : variant === "story"
        ? "Editorial Read"
        : "Portal Control";

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          height: "100%",
          width: "100%",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, rgba(4,8,17,1) 0%, rgba(8,14,26,1) 58%, rgba(6,11,20,1) 100%)",
          color: "white",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at 18% 22%, ${accent}52, transparent 26%), radial-gradient(circle at 84% 16%, rgba(118,231,255,0.18), transparent 24%), linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0))`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "84px 84px",
            maskImage: "linear-gradient(180deg, rgba(0,0,0,0.7), transparent 92%)",
            opacity: 0.36,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -96,
            bottom: -96,
            display: "flex",
            height: 340,
            width: 340,
            borderRadius: 9999,
            border: `1px solid ${accent}2f`,
            background: `${accent}1f`,
            filter: "blur(8px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 72,
            top: 48,
            display: "flex",
            height: 534,
            width: 280,
            borderRadius: 40,
            border: "1px solid rgba(255,255,255,0.1)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
            opacity: 0.86,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 52,
            bottom: 92,
            display: "flex",
            fontSize: 220,
            lineHeight: 0.8,
            fontWeight: 800,
            letterSpacing: "-0.08em",
            color: "rgba(255,255,255,0.05)",
            textTransform: "uppercase",
          }}
        >
          {truncate(watermark, 8)}
        </div>
        <div
          style={{
            position: "relative",
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            gap: 40,
            padding: "52px 56px 48px 56px",
          }}
        >
          <div
            style={{
              display: "flex",
              maxWidth: 820,
              flex: 1,
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 32,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                {visibleChips.map((chip) => (
                  <div
                    key={chip}
                    style={{
                      display: "flex",
                      borderRadius: 9999,
                      border: "1px solid rgba(255,255,255,0.14)",
                      background: "rgba(255,255,255,0.06)",
                      padding: "10px 18px",
                      fontSize: 18,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "rgba(236,245,255,0.88)",
                    }}
                  >
                    {chip}
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    height: 54,
                    width: 54,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 18,
                    border: `1px solid ${accent}55`,
                    background: `${accent}20`,
                    color: "white",
                    fontSize: 26,
                    fontWeight: 700,
                  }}
                >
                  S
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    textAlign: "right",
                  }}
                >
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 700,
                    }}
                  >
                    SOFT Rift
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      letterSpacing: "0.24em",
                      textTransform: "uppercase",
                      color: "rgba(148,163,184,0.8)",
                    }}
                  >
                    {railLabel}
                  </div>
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                maxWidth: 760,
                flexDirection: "column",
                gap: 22,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "rgba(193,231,255,0.76)",
                }}
              >
                {truncate(eyebrow, 42)}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 72,
                  lineHeight: 1.02,
                  fontWeight: 800,
                  letterSpacing: "-0.05em",
                }}
              >
                {truncate(title, 92)}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 28,
                  lineHeight: 1.35,
                  color: "rgba(226,232,240,0.88)",
                  maxWidth: 780,
                }}
              >
                {truncate(description, 180)}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 24,
                borderTop: "1px solid rgba(255,255,255,0.08)",
                paddingTop: 24,
                fontSize: 18,
                color: "rgba(148,163,184,0.88)",
              }}
            >
              <div style={{ display: "flex", maxWidth: 420 }}>{truncate(footerLeft, 72)}</div>
              <div style={{ display: "flex", textAlign: "right", maxWidth: 280 }}>
                {truncate(footerRight, 72)}
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: 244,
              marginTop: 10,
              marginBottom: 10,
              padding: "32px 24px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  height: 86,
                  width: 86,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 28,
                  border: `1px solid ${accent}55`,
                  background: `linear-gradient(180deg, ${accent}2d, rgba(255,255,255,0.02))`,
                  boxShadow: `0 0 0 1px ${accent}18 inset`,
                  fontSize: 38,
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                }}
              >
                {truncate(watermark, 2)}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    letterSpacing: "0.24em",
                    textTransform: "uppercase",
                    color: "rgba(148,163,184,0.78)",
                  }}
                >
                  SOFT Layer
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    lineHeight: 1.18,
                  }}
                >
                  Premium editorial signal
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  height: 2,
                  width: "100%",
                  background: `linear-gradient(90deg, ${accent}, rgba(255,255,255,0))`,
                }}
              />
              <div
                style={{
                  display: "flex",
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: "rgba(226,232,240,0.8)",
                }}
              >
                Structured headlines, stronger SOFT presence, and high-contrast visual hierarchy.
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    OG_IMAGE_SIZE,
  );
}
