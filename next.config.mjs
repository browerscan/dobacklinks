import withBundleAnalyzer from "@next/bundle-analyzer";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages deployment - no standalone needed
  // output: "standalone",

  // Performance optimizations
  swcMinify: true,
  reactStrictMode: true,
  poweredByHeader: false,

  // Optimize package imports for better tree-shaking
  optimizePackageImports: [
    "lucide-react",
    "@radix-ui/react-icons",
    "recharts",
    "framer-motion",
    "@tanstack/react-table",
  ],

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://challenges.cloudflare.com https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://accounts.google.com https://*.google.com https://challenges.cloudflare.com https://region1.google-analytics.com",
              "frame-src 'self' https://accounts.google.com https://challenges.cloudflare.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
  redirects: async () => [
    // fix: correct typo
    {
      source: "/categories/directiory",
      destination: "/categories/directory",
      permanent: true,
    },
  ],
  images: {
    // Vercel handles image optimization
    unoptimized: process.env.NEXT_PUBLIC_OPTIMIZED_IMAGES === "false",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.google.com",
      },
      {
        protocol: "https",
        hostname: "cdn.dobacklinks.com",
      },
      ...(process.env.R2_PUBLIC_URL
        ? [
            {
              hostname: process.env.R2_PUBLIC_URL.replace("https://", ""),
            },
          ]
        : []),
    ],
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error"],
          }
        : false,
  },
};

const withBundleAnalyzerWrapper = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

if (
  process.env.NODE_ENV === "development" &&
  !process.env.NEXTY_WELCOME_SHOWN
) {
  console.log("\n🎉 Welcome to Nexty Boilerplate!");
  console.log("💬 Join our Discord community: https://discord.gg/VRDxBgXUZ8");
  console.log("📚 Documentation: https://nexty.dev/docs\n\n");
  process.env.NEXTY_WELCOME_SHOWN = "true";
}

export default withBundleAnalyzerWrapper(nextConfig);
