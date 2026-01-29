/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /** 静态导出，用于部署到单进程环境（FastAPI 托管） */
  output: "export",
};

module.exports = nextConfig;
