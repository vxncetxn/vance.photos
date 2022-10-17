import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import tailwind from "@astrojs/tailwind";
import glsl from "vite-plugin-glsl";

// https://astro.build/config
export default defineConfig({
  integrations: [
    svelte(),
    tailwind({
      config: { applyBaseStyles: false },
    }),
  ],
  vite: {
    ssr: {
      noExternal: [],
    },
    plugins: [glsl.default()],
  },
});
