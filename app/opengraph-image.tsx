import { ImageResponse } from "next/og";

export const alt = "VOII — Notes that show their work";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Dusk sky, serif headline — the same language as the site (DESIGN.md). */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between",
          background: "linear-gradient(180deg, #3b4152 0%, #7a6a78 45%, #d9a58c 75%, #13110f 100%)",
          color: "#ffffff", padding: 72, fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
          <div style={{ width: 6, height: 14, background: "#ffffff", borderRadius: 3 }} />
          <div style={{ width: 6, height: 32, background: "#ffffff", borderRadius: 3 }} />
          <div style={{ width: 6, height: 22, background: "#ffffff", borderRadius: 3 }} />
          <div style={{ marginLeft: 16, fontSize: 40 }}>VOII</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 88, lineHeight: 1, letterSpacing: -3 }}>The notes that show</div>
          <div style={{ fontSize: 88, lineHeight: 1.05, letterSpacing: -3, fontStyle: "italic" }}>their work.</div>
        </div>
        <div style={{ fontSize: 26, color: "rgba(255,255,255,0.8)", display: "flex", fontFamily: "Helvetica, Arial, sans-serif" }}>
          Meetings, client calls and lectures — every line linked to the moment it was said.
        </div>
      </div>
    ),
    size,
  );
}
