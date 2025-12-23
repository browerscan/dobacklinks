import { anthropic } from "@ai-sdk/anthropic";
import { deepseek } from "@ai-sdk/deepseek";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { xai } from "@ai-sdk/xai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { LanguageModel } from "ai";

/**
 * Create AI model based on provider and model ID
 * @param provider - The AI provider name
 * @param modelId - The model ID to use
 * @returns LanguageModel instance
 * @throws Error if provider is invalid or API key is missing
 */
export function createAIModel(
  provider: string,
  modelId: string,
): LanguageModel {
  switch (provider) {
    case "openai":
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("Server configuration error: Missing OpenAI API Key.");
      }
      return openai(modelId);

    case "anthropic":
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error(
          "Server configuration error: Missing Anthropic API Key.",
        );
      }
      return anthropic(modelId);

    case "google":
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        throw new Error("Server configuration error: Missing Google API Key.");
      }
      return google(modelId);

    case "deepseek":
      if (!process.env.DEEPSEEK_API_KEY) {
        throw new Error(
          "Server configuration error: Missing DeepSeek API Key.",
        );
      }
      return deepseek(modelId);

    case "xai":
      if (!process.env.XAI_API_KEY) {
        throw new Error("Server configuration error: Missing XAI API Key.");
      }
      return xai(modelId);

    case "openrouter":
      if (!process.env.OPENROUTER_API_KEY) {
        throw new Error(
          "Server configuration error: Missing OpenRouter API Key.",
        );
      }
      const openrouterProvider = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
      });
      return openrouterProvider.chat(modelId);

    default:
      throw new Error(`Invalid provider: ${provider}`);
  }
}
