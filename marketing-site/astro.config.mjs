import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { site } from "./src/config/site";

export default defineConfig({
  output: "static",
  site: site.url,
  integrations: [sitemap()],
});
