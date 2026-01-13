import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	serverExternalPackages: ["@noble/hashes", "@noble/post-quantum"],
};

export default nextConfig;
