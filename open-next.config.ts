import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default {
    // every route is prerendered static, so the default (no incremental cache) is enough
    ...defineCloudflareConfig(),
    // `npm run build` is the OpenNext build, so the adapter must call plain Next here
    // rather than recurse into it
    buildCommand: "npm run build:next",
};
