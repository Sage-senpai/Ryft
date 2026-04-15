const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@ryft/types", "@ryft/game", "@ryft/server"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
};
module.exports = nextConfig;
