import { definePlugin } from "emdash";

import { afterSave, beforeSave } from "./hooks.js";
import { routes } from "./routes.js";

export default definePlugin({
  hooks: {
    "content:beforeSave": beforeSave,
    "content:afterSave": afterSave,
  },
  routes,
});
