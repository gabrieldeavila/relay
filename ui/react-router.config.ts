import type { Config } from "@react-router/dev/config";

export default {
  // Local single-page app: everything is read live from the local API.
  ssr: false,
} satisfies Config;
