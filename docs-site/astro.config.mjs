import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://carteplugin.dev",
  integrations: [
    starlight({
      title: "Carte Docs",
      description: "Public documentation for the Carte EmDash restaurant plugin family.",
      sidebar: [
        { label: "Overview", link: "/" },
        {
          label: "v0.1 Plugins",
          items: [
            { label: "@carte/core", slug: "plugins/carte-core" },
            { label: "@carte/reservations", slug: "plugins/carte-reservations" },
            {
              label: "@carte/orders-backend",
              slug: "plugins/carte-orders-backend",
            },
            {
              label: "@carte/orders-admin",
              slug: "plugins/carte-orders-admin",
            },
            { label: "@carte/views", slug: "plugins/carte-views" },
            { label: "@carte/ai", slug: "plugins/carte-ai" },
          ],
        },
      ],
    }),
  ],
});
