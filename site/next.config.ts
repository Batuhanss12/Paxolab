import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: {
    root: import.meta.dirname,
  },
  async redirects() {
    return [
      {
        source: "/forma-vektor-motoru-nasil-calisir",
        destination: "/grapxor-vektor-motoru-nasil-calisir",
        permanent: true,
      },
      {
        source: "/en/how-forma-vector-engine-works",
        destination: "/en/how-grapxor-vector-engine-works",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
