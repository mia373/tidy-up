// Supabase Edge Function — generate-tasks
// Uses plain fetch() to call the Gemini API — no npm imports needed.
// Secrets required (Edge Functions → Manage secrets):
//   GEMINI_API_KEY  — your Google AI Studio API key
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a household chore assistant. Return ONLY a valid JSON array of chore objects — no markdown, no explanation, no code blocks.
Each object must have exactly these fields:
- "title": string (concise, actionable chore name, e.g. "Wipe kitchen counters")
- "points": number (5 = quick task under 5 min, 10 = medium task ~15 min, 20 = deep clean ~30 min, 30 = heavy effort over 45 min)
- "room": string (which room the task belongs to, matching one of the provided rooms where possible)`;

function buildUserPrompt(profile: {
  homeType: string | null;
  rooms: string[];
  memberCount: number;
  hasPets: boolean;
}): string {
  const parts: string[] = [];
  if (profile.homeType) parts.push(`Home type: ${profile.homeType}`);
  const memberWord = profile.memberCount === 1 ? "person" : "people";
  parts.push(`${profile.memberCount} ${memberWord} living there`);
  if (profile.rooms.length > 0) parts.push(`Rooms: ${profile.rooms.join(", ")}`);
  if (profile.hasPets) parts.push("Has pets");
  return (
    `Generate a weekly chore list of 15–25 tasks for a household with the following details:\n` +
    `${parts.join("\n")}\n\nReturn only a JSON array.`
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    console.log("generate-tasks invoked");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const geminiKey = Deno.env.get("GEMINI_API_KEY");

    console.log("env check", {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!serviceKey,
      hasGeminiKey: !!geminiKey,
    });

    if (!supabaseUrl || !serviceKey || !geminiKey) {
      throw new Error(`Missing env vars: supabaseUrl=${!!supabaseUrl} serviceKey=${!!serviceKey} geminiKey=${!!geminiKey}`);
    }

    const body = await req.json() as { homeId?: string };
    const homeId = body.homeId;
    console.log("homeId:", homeId);
    if (!homeId) throw new Error("homeId is required");

    // Fetch home profile + rate limit state via Supabase REST API
    console.log("fetching home from DB");
    const homeRes = await fetch(
      `${supabaseUrl}/rest/v1/homes?id=eq.${homeId}&select=home_type,rooms,has_pets,member_count,ai_requests_today,ai_requests_reset_at`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    const homes = await homeRes.json() as Record<string, unknown>[];
    console.log("home fetch status:", homeRes.status, "result:", JSON.stringify(homes));
    if (!Array.isArray(homes) || homes.length === 0) throw new Error(`Home not found. DB response: ${JSON.stringify(homes)}`);
    const home = homes[0];

    // Rate limiting: max 3 generations per home per day
    const today = new Date().toISOString().split("T")[0];
    const requestsToday =
      home.ai_requests_reset_at === today ? (home.ai_requests_today as number) : 0;
    if (requestsToday >= 3) {
      return new Response(
        JSON.stringify({ error: "Daily generation limit reached. Try again tomorrow." }),
        { status: 429, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Increment rate limit counter
    await fetch(`${supabaseUrl}/rest/v1/homes?id=eq.${homeId}`, {
      method: "PATCH",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ ai_requests_today: requestsToday + 1, ai_requests_reset_at: today }),
    });

    // Call Gemini via Google AI REST API
    const userPrompt = buildUserPrompt({
      homeType: home.home_type as string | null,
      rooms: (home.rooms as string[]) ?? [],
      memberCount: (home.member_count as number) ?? 1,
      hasPets: (home.has_pets as boolean) ?? false,
    });

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.json() as { error?: { message?: string } };
      throw new Error(err.error?.message ?? `Gemini API error ${geminiRes.status}`);
    }

    const geminiData = await geminiRes.json() as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    };
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Unexpected Gemini response structure");

    // Strip accidental markdown code fences
    const raw = text.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const tasks = JSON.parse(raw);
    if (!Array.isArray(tasks)) throw new Error("AI response is not a JSON array");

    return new Response(JSON.stringify(tasks), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error("generate-tasks error:", message);
    const status = message.includes("limit") ? 429 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
