import { ImageResponse } from "next/og";

export const alt = "VOII — You had the conversation. VOII remembers what matters.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Generated from code, so there is no binary asset to keep in sync with
 *  the brand — and nothing invented. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          justifyContent: "space-between", background: "#000000", color: "#ffffff",
          padding: 72, fontFamily: "Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
          <div style={{ width: 8, height: 26, background: "#ffffff" }} />
          <div style={{ width: 8, height: 40, background: "#1da759" }} />
          <div style={{ width: 8, height: 26, background: "#ffffff" }} />
          <div style={{ marginLeft: 18, fontSize: 30, letterSpacing: 8, fontWeight: 700 }}>VOII</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 74, lineHeight: 1.04, letterSpacing: -2.5, fontWeight: 700 }}>
            You had the conversation.
          </div>
          <div style={{ fontSize: 74, lineHeight: 1.04, letterSpacing: -2.5, fontWeight: 700, color: "#47bd6e" }}>
            VOII remembers what matters.
          </div>
        </div>

        <div style={{ fontSize: 27, color: "#b3b3b3", display: "flex" }}>
          Notes, tasks, knowledge and follow-ups — from the call you already had.
        </div>
      </div>
    ),
    size,
  );
}
