/** @type {import('next').NextConfig} */
if (process.env.NODE_ENV === "production") {
  const requiredPublicEnv = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ];
  const missingPublicEnv = requiredPublicEnv.filter((name) => !process.env[name]);

  if (missingPublicEnv.length > 0) {
    throw new Error(
      `Build interrompido: configure ${missingPublicEnv.join(", ")} antes de publicar.`,
    );
  }
}

const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    "127.0.0.1",
    "*.trycloudflare.com",
  ],
};

module.exports = nextConfig;
