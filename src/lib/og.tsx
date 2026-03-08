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
}: OgImageOptions) {
  const visibleChips = chips.filter(Boolean).slice(0, 4);

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
            "linear-gradient(180deg, rgba(5,9,18,1) 0%, rgba(7,12,24,1) 100%)",
          color: "white",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at 16% 20%, ${accent}44, transparent 28%), radial-gradient(circle at 84% 16%, rgba(244,132,255,0.2), transparent 24%), linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0))`,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -120,
            bottom: -120,
            display: "flex",
            height: 360,
            width: 360,
            borderRadius: 9999,
            background: `${accent}22`,
            filter: "blur(12px)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            width: "100%",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 64px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 24,
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
                gap: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  height: 56,
                  width: 56,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 9999,
                  border: `1px solid ${accent}55`,
                  background: `${accent}22`,
                  color: "white",
                  fontSize: 28,
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
                    fontSize: 16,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "rgba(148,163,184,0.82)",
                  }}
                >
                  MLBB portal
                </div>
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              maxWidth: 860,
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
                fontSize: 70,
                lineHeight: 1.02,
                fontWeight: 800,
                letterSpacing: "-0.04em",
              }}
            >
              {truncate(title, 94)}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 28,
                lineHeight: 1.35,
                color: "rgba(226,232,240,0.86)",
                maxWidth: 920,
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
            <div style={{ display: "flex" }}>{truncate(footerLeft, 72)}</div>
            <div style={{ display: "flex", textAlign: "right" }}>
              {truncate(footerRight, 72)}
            </div>
          </div>
        </div>
      </div>
    ),
    OG_IMAGE_SIZE,
  );
}
