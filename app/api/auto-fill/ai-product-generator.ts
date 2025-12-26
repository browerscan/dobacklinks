import { createAIModel } from "@/lib/ai-model-factory";
import { generateText } from "ai";

export interface ProductGenerationResult {
  name: string;
  tagline: string;
  description: string;
  categoryIds: string[];
  niche?: string;
  dr?: number;
  da?: number;
  traffic?: string;
  priceRange?: string;
  linkType?: string;
  turnaroundTime?: string;
  contactEmail?: string;
}

function buildPrompt(url: string, scrapedData: any, categoriesString: string): string {
  return `You are preparing a guest-post directory entry. Extract concise, structured data from the site.

Website URL: ${url}
Scraped Content: ${JSON.stringify(scrapedData, null, 2)}

Available Categories (select up to 3 most relevant by ID):
${categoriesString}

Return JSON ONLY:
{
  "name": "Site or publication name (<=80 chars)",
  "tagline": "One-line pitch (<=160 chars)",
  "description": "200-800 chars markdown: topics accepted, link rules, word count, contact notes",
  "niche": "Primary niche (e.g. Tech, Crypto, Health)",
  "dr": 0-100,
  "da": 0-100,
  "traffic": "traffic range like 10k-50k or 50k+",
  "priceRange": "Free | $80 | Sponsored | Exchange",
  "linkType": "dofollow or nofollow",
  "turnaroundTime": "e.g. 2-3 days, 1 week",
  "contactEmail": "editor or submissions email if found",
  "categoryIds": ["id1","id2"]
}

Rules:
- If DR/DA not found, set to 0.
- If price is unclear, set priceRange to "Contact".
- Keep description informational, no marketing fluff.
Only return the JSON object, nothing else.`;
}

export async function generateProductInfo(
  scrapedData: any,
  url: string,
  categories: any[],
): Promise<ProductGenerationResult> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key not configured");
  }

  const provider = process.env.NEXT_PUBLIC_AUTO_FILL_AI_PROVIDER!;
  const modelId = process.env.NEXT_PUBLIC_AUTO_FILL_AI_MODEL_ID!;

  const model = createAIModel(provider, modelId);

  const categoriesString = categories.map((cat) => `${cat.id}: ${cat.name}`).join("\n");

  const prompt = buildPrompt(url, scrapedData, categoriesString);

  const result = await generateText({
    model,
    prompt,
    temperature: 0.6,
  });

  try {
    return JSON.parse(result.text);
  } catch {
    throw new Error("Failed to parse AI response");
  }
}
