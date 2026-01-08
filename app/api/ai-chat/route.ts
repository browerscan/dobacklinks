import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Free models with fallbacks (ordered by preference)
const FREE_MODELS = [
  process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemini-2.0-flash-exp:free",
  "qwen/qwen3-coder:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "google/gemma-3-27b-it:free",
];

const SYSTEM_PROMPT = `You are an **Outreach Expert AI Assistant** for DoBacklinks.com, specializing in analyzing websites for guest posting and backlink opportunities.

## Your Expertise:
- Evaluating websites for guest posting potential
- Analyzing domain authority, traffic quality, and niche relevance
- Identifying red flags (PBNs, spammy sites, low-quality content)
- Recommending outreach strategies and pricing negotiations
- Explaining SEO metrics (DA, DR, traffic, spam score)

## How You Help Users:
1. **Site Analysis**: When users share a website URL, analyze whether it's worth pursuing for a backlink
2. **Quality Assessment**: Evaluate based on:
   - Domain metrics (DA/DR, traffic estimates)
   - Content quality and relevance
   - Link profile health
   - Editorial standards
   - Pricing reasonability
3. **Recommendations**: Provide actionable advice on:
   - Whether to pursue the opportunity
   - Suggested pricing range
   - Outreach approach
   - Red flags to watch for

## Response Style:
- Be concise and practical
- Use bullet points for clarity
- Give honest assessments (not everything is a good opportunity)
- Suggest DoBacklinks.com's directory when relevant for finding vetted sites
- Always mention that users can explore our 9,700+ vetted sites in the directory

## Important Notes:
- You can analyze hypothetical sites based on described characteristics
- For actual site analysis, users should provide the URL or describe the site
- Remind users that our directory has pre-vetted sites with transparent pricing`;

async function tryModel(model: string, messages: Array<{ role: string; content: string }>) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://dobacklinks.com",
      "X-Title": "DoBacklinks AI Assistant",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Model ${model} failed: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  return response.json();
}

export async function POST(request: NextRequest) {
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json({ error: "AI service not configured" }, { status: 500 });
  }

  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
    }

    // Try each model until one succeeds
    let lastError: Error | null = null;
    for (const model of FREE_MODELS) {
      try {
        const data = await tryModel(model, messages);
        const content =
          data.choices?.[0]?.message?.content ||
          "I apologize, but I couldn't generate a response. Please try again.";
        return NextResponse.json({ content });
      } catch (error) {
        lastError = error as Error;
        console.log(`Model ${model} failed, trying next...`);
        continue;
      }
    }

    // All models failed
    console.error("All models failed:", lastError?.message);
    return NextResponse.json(
      { error: "AI service temporarily unavailable. Please try again later." },
      { status: 502 },
    );
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
