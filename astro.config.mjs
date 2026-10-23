import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://www.couplecalendar.online",
  // Serve /day-1 rather than /day-1/ so QR URLs never redirect.
  trailingSlash: "never",
  build: { format: "file" },
});
