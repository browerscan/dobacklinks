import { ImageResponse } from "next/og";

// Removed edge runtime for Cloudflare Workers compatibility
// export const runtime = 'edge';

export const alt = "Done-For-You Guest Posting Services";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OgImage() {
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
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Main Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px",
          }}
        >
          {/* Title */}
          <div
            style={{
              fontSize: 72,
              fontWeight: "bold",
              color: "white",
              textAlign: "center",
              marginBottom: 24,
              lineHeight: 1.2,
            }}
          >
            Done-For-You Guest Posting
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 42,
              color: "rgba(255, 255, 255, 0.9)",
              textAlign: "center",
              marginBottom: 32,
            }}
          >
            Outreach • Writing • Publication
          </div>

          {/* Bottom URL */}
          <div
            style={{
              fontSize: 28,
              color: "rgba(255, 255, 255, 0.8)",
              textAlign: "center",
            }}
          >
            dobacklinks.com/services
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
