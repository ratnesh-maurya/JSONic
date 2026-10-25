import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// every route is prerendered static, so the default (no incremental cache) is enough
export default defineCloudflareConfig();
