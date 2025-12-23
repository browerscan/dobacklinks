import { getProductBySlug } from "@/actions/products/user";
import { siteConfig } from "@/config/site";
import { smartImageConverter } from "@/lib/smartImageConverter";
import { ImageResponse } from "next/og";

export const alt = "Product";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getProductBySlug(slug);

  if (!result.success || !result.data) {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fafafa",
          }}
        >
          <h1 style={{ fontSize: "72px", color: "#0f172a" }}>
            Product Not Found
          </h1>
        </div>
      ),
      { ...size },
    );
  }

  const product = result.data;
  const logoUrl = await smartImageConverter(product.logoUrl || "/logo.png");

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
          backgroundColor: "#fafafa",
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          padding: "80px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "40px",
            right: "40px",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background:
              "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)",
            filter: "blur(40px)",
          }}
        />

        <div
          style={{
            position: "absolute",
            bottom: "40px",
            left: "40px",
            width: "150px",
            height: "150px",
            borderRadius: "50%",
            background:
              "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)",
            filter: "blur(30px)",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "140px",
            height: "140px",
            marginBottom: "48px",
            borderRadius: "32px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
          }}
        >
          <img src={logoUrl} alt={product.name} width={140} height={140} />
        </div>

        <h1
          style={{
            fontSize: "72px",
            fontWeight: "800",
            color: "#0f172a",
            margin: "0 0 60px 0",
            textAlign: "center",
            lineHeight: 1.1,
            maxWidth: "900px",
            letterSpacing: "-0.02em",
            textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          }}
        >
          {product.name}
        </h1>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "16px",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(10px)",
            padding: "16px 32px",
            borderRadius: "50px",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
            }}
          />
          <span
            style={{
              fontSize: "28px",
              color: "#334155",
              fontWeight: "700",
              letterSpacing: "0.01em",
              textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
            }}
          >
            Listing on {siteConfig.name}
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
