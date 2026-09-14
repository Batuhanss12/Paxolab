import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
