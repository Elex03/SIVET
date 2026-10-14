import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: { '/api': {target:'https://sivet-backend-n8fv.onrender.com',changeOrigin:true} } },
  preview: { proxy: { '/api': {target:'https://sivet-backend-n8fv.onrender.com',changeOrigin:true} } },
});
