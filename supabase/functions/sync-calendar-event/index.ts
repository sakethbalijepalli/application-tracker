import { createClient } from "jsr:@supabase/supabase-js@2";
import { buildGoogleEventResource, type SaveEventRequest } from "./eventPayload.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

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

async function getStoredRefreshToken(userId: string): Promise<string> {
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await adminClient
    .from("calendar_credentials")
    .select("refresh_token")
    .eq("user_id", userId)
    .single();
  if (error || !data) {
    throw new Error("No stored calendar access. Sign out and back in to reconnect your calendar.");
  }
  return data.refresh_token as string;
}

async function exchangeForAccessToken(refreshToken: string): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) {
    throw new Error(`Google token exchange failed: ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  return data.access_token as string;
}

async function createEvent(accessToken: string, resource: unknown): Promise<string> {
  const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(resource),
  });
  if (!response.ok) {
    throw new Error(`Google Calendar create failed: ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  return data.id as string;
}

/** Returns the updated event's id, or null if the event no longer exists (404/410) so the
 * caller can fall back to creating a new one instead of failing forever on a stale id. */
async function updateEvent(accessToken: string, eventId: string, resource: unknown): Promise<string | null> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(resource),
    },
  );
  if (response.status === 404 || response.status === 410) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Google Calendar update failed: ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  return data.id as string;
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

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) {
    return jsonResponse({ error: "Not authenticated" }, 401);
  }

  let input: SaveEventRequest;
  try {
    input = await req.json();
    if (!input.title || !input.startDate || !input.endDate) {
      throw new Error("title, startDate, and endDate are required");
    }
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  try {
    const refreshToken = await getStoredRefreshToken(user.id);
    const accessToken = await exchangeForAccessToken(refreshToken);
    const resource = buildGoogleEventResource(input);

    let eventId: string | null = null;
    if (input.identifier) {
      eventId = await updateEvent(accessToken, input.identifier, resource);
    }
    if (!eventId) {
      eventId = await createEvent(accessToken, resource);
    }

    return jsonResponse({ eventId }, 200);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Calendar sync failed" }, 502);
  }
});
