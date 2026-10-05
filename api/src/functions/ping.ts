import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { ConfigError, getFoundry } from "../lib/foundry";

// Fixed prompt, no user input: this endpoint is public and must not work as an open proxy.
export async function ping(_request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const started = Date.now();
  try {
    const { client, deployment } = getFoundry();
    const completion = await client.chat.completions.create({
      model: deployment,
      messages: [{ role: "user", content: "Responda apenas: ok" }],
      max_completion_tokens: 16,
    });
    return {
      status: 200,
      jsonBody: {
        ok: true,
        model: completion.model,
        reply: completion.choices[0]?.message?.content ?? "",
        latencyMs: Date.now() - started,
      },
    };
  } catch (error) {
    context.error("ping failed", error);
    const message =
      error instanceof ConfigError ? error.message : "Não foi possível falar com o modelo no Azure AI Foundry.";
    return { status: 502, jsonBody: { ok: false, error: message, latencyMs: Date.now() - started } };
  }
}

app.http("ping", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "ping",
  handler: ping,
});
