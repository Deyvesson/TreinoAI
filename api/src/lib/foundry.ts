import OpenAI from "openai";

export interface FoundryConfig {
  endpoint: string;
  apiKey: string;
  deployment: string;
}

export class ConfigError extends Error {}

export function readConfig(): FoundryConfig {
  const endpoint = process.env.FOUNDRY_ENDPOINT;
  const apiKey = process.env.FOUNDRY_API_KEY;
  const deployment = process.env.FOUNDRY_DEPLOYMENT;
  const missing = Object.entries({ FOUNDRY_ENDPOINT: endpoint, FOUNDRY_API_KEY: apiKey, FOUNDRY_DEPLOYMENT: deployment })
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length > 0) {
    throw new ConfigError(`Configuração ausente: ${missing.join(", ")}`);
  }
  return { endpoint: endpoint!.replace(/\/+$/, ""), apiKey: apiKey!, deployment: deployment! };
}

let cached: { client: OpenAI; deployment: string } | undefined;

// Foundry exposes the OpenAI v1 API, so the official SDK works with only a base URL change.
export function getFoundry(): { client: OpenAI; deployment: string } {
  if (!cached) {
    const config = readConfig();
    cached = {
      client: new OpenAI({
        apiKey: config.apiKey,
        baseURL: `${config.endpoint}/openai/v1/`,
        defaultHeaders: { "api-key": config.apiKey },
        timeout: 30_000,
        maxRetries: 1,
      }),
      deployment: config.deployment,
    };
  }
  return cached;
}
