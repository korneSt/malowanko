import type { NextConfig } from "next";

// Extract Supabase hostname from environment variable
const getSupabaseConfig = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return [];

  try {
    const url = new URL(supabaseUrl);
    return [
      {
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
        port: url.port || undefined,
        pathname: "/storage/v1/object/public/**",
      },
    ];
  } catch {
    return [];
  }
};

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage (local development - 127.0.0.1)
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
      // Supabase Storage (from environment variable)
      ...getSupabaseConfig(),
    ],
  },
};

export default nextConfig;
