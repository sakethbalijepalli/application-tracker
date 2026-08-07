import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  extractOpportunityDetails,
  extractOpportunityDetailsFromWebpage,
  type ApifyInstagramPostItem,
  type ApifyInstagramProfileItem,
  type ApifyWebsiteCrawlItem,
} from "./extract.ts";
import { detectTextInImage } from "./ocr.ts";

const APIFY_TOKEN = Deno.env.get("APIFY_TOKEN");
const INSTAGRAM_ACTOR = "apify~instagram-scraper";
const WEBSITE_ACTOR = "apify~website-content-crawler";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

async function runApifyActor<T>(actor: string, input: Record<string, unknown>): Promise<T[]> {
  const response = await fetch(
    `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    throw new Error(`Apify request failed: ${response.status} ${await response.text()}`);
  }

  return (await response.json()) as T[];
}

async function scrapeInstagramPost(instagramUrl: string): Promise<ApifyInstagramPostItem> {
  const items = await runApifyActor<ApifyInstagramPostItem>(INSTAGRAM_ACTOR, {
    directUrls: [instagramUrl],
    resultsLimit: 1,
  });
  if (items.length === 0) {
    throw new Error("No Instagram post data returned for this URL.");
  }
  return items[0];
}

async function scrapeInstagramProfile(username: string): Promise<ApifyInstagramProfileItem> {
  const items = await runApifyActor<ApifyInstagramProfileItem>(INSTAGRAM_ACTOR, {
    resultsType: "details",
    directUrls: [`https://www.instagram.com/${username}/`],
    resultsLimit: 1,
  });
  return items[0] ?? {};
}

function isInstagramUrl(url: string): boolean {
  return url.includes("instagram.com");
}

// crawlerType: "playwright:firefox" renders client-side JS before extracting text — a plain
// fetch() returns almost nothing useful for pages whose content (often the whole application
// form/details) only appears after the page's own JS runs.
async function scrapeWebpage(url: string): Promise<ApifyWebsiteCrawlItem> {
  const items = await runApifyActor<ApifyWebsiteCrawlItem>(WEBSITE_ACTOR, {
    startUrls: [{ url }],
    maxCrawlPages: 1,
    crawlerType: "playwright:firefox",
  });
  if (items.length === 0) {
    throw new Error("No content could be crawled from this URL.");
  }
  return items[0];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Missing Authorization header" }, 401);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return jsonResponse({ error: "Not authenticated" }, 401);
  }

  let sourceUrl: string;
  try {
    const body = await req.json();
    sourceUrl = body.sourceUrl;
    if (!sourceUrl || typeof sourceUrl !== "string") {
      throw new Error("sourceUrl is required");
    }
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  if (!isInstagramUrl(sourceUrl)) {
    try {
      const item = await scrapeWebpage(sourceUrl);
      return jsonResponse(extractOpportunityDetailsFromWebpage(item, sourceUrl, new Date()), 200);
    } catch (err) {
      return jsonResponse({ error: err instanceof Error ? err.message : "Scrape failed" }, 502);
    }
  }

  let post: ApifyInstagramPostItem;
  try {
    post = await scrapeInstagramPost(sourceUrl);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Scrape failed" }, 502);
  }

  let profile: ApifyInstagramProfileItem = {};
  if (post.ownerUsername) {
    try {
      profile = await scrapeInstagramProfile(post.ownerUsername);
    } catch {
      // Bio link is a nice-to-have — fall back to no application link rather than
      // failing the whole request when caption/organization already succeeded.
    }
  }

  let imageText = "";
  const imageUrl = post.carouselImages?.[0] ?? post.displayUrl;
  if (imageUrl) {
    try {
      imageText = await detectTextInImage(imageUrl);
    } catch {
      // OCR is a nice-to-have — a flyer that can't be read shouldn't fail a scrape that
      // otherwise succeeded from the caption/profile alone.
    }
  }

  return jsonResponse(extractOpportunityDetails(post, profile, new Date(), imageText), 200);
});
