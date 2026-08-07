import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

  let refreshToken: string;
  try {
    const body = await req.json();
    refreshToken = body.refreshToken;
    if (!refreshToken || typeof refreshToken !== "string") {
      throw new Error("refreshToken is required");
    }
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  // service_role client: this table has no RLS policies, so only service_role can write to it.
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { error } = await adminClient
    .from("calendar_credentials")
    .upsert({ user_id: user.id, refresh_token: refreshToken, updated_at: new Date().toISOString() });
  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({ success: true }, 200);
});
