/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Supabase project URLs are public configuration. This keeps local setups
  // using NEXT_SUPABASE_URL working while allowing NEXT_PUBLIC_SUPABASE_URL.
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_SUPABASE_URL,
  },
  compiler: {
    styledComponents: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.buymeacoffee.com",
      },
    ],
  },
};

module.exports = nextConfig;
