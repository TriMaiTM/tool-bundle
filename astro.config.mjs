import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  integrations: [preact(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ["preact", "preact/hooks", "preact/compat", "marked", "js-yaml"],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-preact": ["preact", "preact/hooks", "preact/compat"],
            "vendor-pdf": ["pdf-lib"],
            "vendor-marked": ["marked"],
            "vendor-yaml": ["js-yaml"],
          },
        },
      },
    },
  },
  output: "static",
  site: "https://toolbundle.app",
  compressHTML: true,
});
