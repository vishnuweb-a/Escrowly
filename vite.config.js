import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { apiMiddleware } from "./server/api.js";
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
  const api = apiMiddleware(env);
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "escrow-api",
        configureServer(server) {
          server.middlewares.use(api);
        },
        configurePreviewServer(server) {
          server.middlewares.use(api);
        },
      },
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            web3: ["ethers"],
            react: ["react", "react-dom", "react-router-dom"],
          },
        },
      },
    },
    server: {
      fs: {
        deny: [".env", ".env.*", "**/.git/**", "**/server/**", "**/.data/**"],
      },
    },
  };
});
