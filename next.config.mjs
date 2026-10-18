const nodeRuntime =
  process.env.VERCEL === "1" || process.env.HEAT_RUNTIME === "node";
const nextConfig = {
  ...(nodeRuntime ? {} : { output: "export" }),
  // The .js API entry is Node-only; Sites serves the same API through its Worker.
  pageExtensions: nodeRuntime ? ["jsx", "js"] : ["jsx"],
  images: { unoptimized: true },
  poweredByHeader: false,
};
export default nextConfig;
