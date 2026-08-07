import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  extractOpportunityDetails,
  type ApifyInstagramPostItem,
  type ApifyInstagramProfileItem,
} from "./extract.ts";

const APIFY_TOKEN = Deno.env.get("APIFY_TOKEN");
const APIFY_ACTOR = "apify~instagram-scraper";
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

async function runApifyActor<T>(input: Record<string, unknown>): Promise<T[]> {
  const response = await fetch(
    `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
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
  const items = await runApifyActor<ApifyInstagramPostItem>({
    directUrls: [instagramUrl],
    resultsLimit: 1,
  });
  if (items.length === 0) {
    throw new Error("No Instagram post data returned for this URL.");
  }
  return items[0];
}

async function scrapeInstagramProfile(username: string): Promise<ApifyInstagramProfileItem> {
  const items = await runApifyActor<ApifyInstagramProfileItem>({
    resultsType: "details",
    directUrls: [`https://www.instagram.com/${username}/`],
    resultsLimit: 1,
  });
  return items[0] ?? {};
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

  let instagramUrl: string;
  try {
    const body = await req.json();
    instagramUrl = body.instagramUrl;
    if (!instagramUrl || typeof instagramUrl !== "string") {
      throw new Error("instagramUrl is required");
    }
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  let post: ApifyInstagramPostItem;
  try {
    post = await scrapeInstagramPost(instagramUrl);
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

  return jsonResponse(extractOpportunityDetails(post, profile, new Date()), 200);
});
