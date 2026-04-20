/* eslint-env node */
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const devApiProxyTarget = env.VITE_DEV_API_PROXY_TARGET || "https://www.chingis.dev";

  return {
    plugins: [react()],
    build: {
      target: "esnext",
      minify: "esbuild",
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks: undefined, // Disable chunk splitting
          entryFileNames: "assets/[name].[hash].js",
          assetFileNames: "assets/[name].[hash].[ext]",
        },
      },
      sourcemap: false,
      reportCompressedSize: true,
    },
    assetsInclude: ["**/*.glb"],
    optimizeDeps: {
      include: ["react", "react-dom", "three", "@react-three/fiber", "@react-three/drei"],
    },
    // Proxy API requests in local Vite dev (localhost:5173).
    server: {
      hmr: {
        overlay: true,
      },
      proxy: {
        "/api": {
          target: devApiProxyTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
