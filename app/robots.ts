import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/tools";

/**
 * AI crawlers are allowed deliberately.
 *
 * There are two distinct families and they are worth separating: training
 * crawlers (GPTBot, ClaudeBot, Google-Extended, CCBot) and retrieval crawlers
 * that fetch a page to cite it in an answer (OAI-SearchBot, ChatGPT-User,
 * Claude-SearchBot, Claude-User, PerplexityBot). Blocking a retrieval bot
 * removes the site from that engine's answers entirely.
 *
 * A free, open-source developer tool has nothing to protect by opting out of
 * training and everything to gain from being the cited answer to "how do I view
 * a large JSON file", so both families are allowed.
 */
const AI_CRAWLERS = [
    "GPTBot",            // OpenAI training
    "OAI-SearchBot",     // OpenAI retrieval for ChatGPT search
    "ChatGPT-User",      // OpenAI, user-initiated fetch
    "ClaudeBot",         // Anthropic training
    "Claude-SearchBot",  // Anthropic retrieval
    "Claude-User",       // Anthropic, user-initiated fetch
    "PerplexityBot",     // Perplexity index
    "Perplexity-User",   // Perplexity, user-initiated fetch
    "Google-Extended",   // Gemini / AI Overviews grounding
    "Applebot-Extended", // Apple Intelligence
    "meta-externalagent",
    "Bytespider",
    "cohere-ai",
];

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                // _next must stay crawlable or Google renders the page unstyled
                disallow: ["/api/"],
            },
            ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/" })),
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
        host: SITE_URL,
    };
}
