import { getPostBySlug } from "@/lib/getBlogs";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Blog Post";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { post } = await getPostBySlug(slug);

  const title = post?.title || "Blog Post";
  const description = post?.description || "";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          backgroundImage: "linear-gradient(to bottom right, #1e3a5f, #0f172a)",
          padding: "60px",
        }}
      >
        {/* Logo and site name */}
        <div
          style={{
            position: "absolute",
            top: "40px",
            left: "60px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "8px",
              background: "#3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: "bold",
              color: "white",
            }}
          >
            D
          </div>
          <span
            style={{
              fontSize: "28px",
              fontWeight: "600",
              color: "white",
            }}
          >
            Dobacklinks
          </span>
        </div>

        {/* Category badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              background: "rgba(59, 130, 246, 0.8)",
              color: "white",
              padding: "8px 20px",
              borderRadius: "20px",
              fontSize: "18px",
              fontWeight: "500",
            }}
          >
            Blog
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: title.length > 60 ? "42px" : "56px",
            fontWeight: "bold",
            color: "white",
            lineHeight: 1.2,
            marginBottom: "20px",
            maxWidth: "90%",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </div>

        {/* Description */}
        {description && (
          <div
            style={{
              fontSize: "24px",
              color: "rgba(255, 255, 255, 0.8)",
              lineHeight: 1.4,
              maxWidth: "80%",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {description}
          </div>
        )}

        {/* Bottom decoration line */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            right: "0",
            height: "8px",
            background: "linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899)",
          }}
        />
      </div>
    ),
    {
      ...size,
    },
  );
}
