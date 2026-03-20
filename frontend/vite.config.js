// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite"; // Import the plugin

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Add the plugin
  ],
  build: {
    // Code splitting configuration - separate vendor chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Split node_modules into separate chunks to improve caching
          vendor: ["react", "react-dom", "react-router-dom"],
          socket: ["socket.io-client"],
          ui: ["lucide-react", "react-hot-toast"],
          zustand: ["zustand"],
        },
      },
    },
    // Set chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable minification with terser for better compression
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
      },
    },
    // Optimize CSS
    cssCodeSplit: true,
  },
});
