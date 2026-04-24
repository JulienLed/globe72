import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ces packages utilisent des APIs Node.js incompatibles avec l'Edge runtime.
  // Vercel les exécute dans le runtime Node.js classique (pas Edge).
  serverExternalPackages: ["@react-pdf/renderer", "pg", "@prisma/client", "@prisma/adapter-pg"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
