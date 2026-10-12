import type { Config } from "@react-router/dev/config";

export default {
  // Local single-page app: login and the flow canvas only run in the browser.
  ssr: false,
} satisfies Config;
