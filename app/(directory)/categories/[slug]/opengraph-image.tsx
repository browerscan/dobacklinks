import { getCategoryBySlug } from "@/actions/categories/user";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Category";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const categoryResponse = await getCategoryBySlug(slug);
  const category = categoryResponse.success ? categoryResponse.data : null;

  const title = category ? `Best ${category.name} Guest Post Sites` : "Category Sites";
  const description = category
    ? `Explore ${category.name.toLowerCase()} guest post opportunities with DR, traffic, and pricing details.`
    : "Discover guest post sites tailored to your niche.";

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
          backgroundImage: "linear-gradient(to bottom right, #0d9488, #0f172a)",
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
              background: "#14b8a6",
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
              background: "rgba(20, 184, 166, 0.8)",
              color: "white",
              padding: "8px 20px",
              borderRadius: "20px",
              fontSize: "18px",
              fontWeight: "500",
            }}
          >
            Category
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: title.length > 50 ? "42px" : "56px",
            fontWeight: "bold",
            color: "white",
            lineHeight: 1.2,
            marginBottom: "20px",
            maxWidth: "90%",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </div>

        {/* Description */}
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

        {/* Bottom decoration line */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            right: "0",
            height: "8px",
            background: "linear-gradient(to right, #14b8a6, #06b6d4, #0ea5e9)",
          }}
        />
      </div>
    ),
    {
      ...size,
    },
  );
}
