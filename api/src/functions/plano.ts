import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { APIConnectionTimeoutError } from "openai";
import { ConfigError } from "../lib/foundry";
import { gerarPlano, PlanoInvalidoError } from "../lib/gerarPlano";
import { criarLimite, ipDoCliente } from "../lib/limite";
import { perfilSchema } from "../lib/planoSchema";

const TAMANHO_MAXIMO_BYTES = 4096;
const permitir = criarLimite(5, 10 * 60_000);

const erro = (status: number, mensagem: string): HttpResponseInit => ({ status, jsonBody: { ok: false, erro: mensagem } });

export async function plano(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (!permitir(ipDoCliente(request))) {
    return erro(429, "Muitos planos gerados em pouco tempo. Tente de novo em alguns minutos.");
  }

  const texto = await request.text();
  if (texto.length > TAMANHO_MAXIMO_BYTES) return erro(413, "Perfil grande demais.");

  let corpo: unknown;
  try {
    corpo = JSON.parse(texto);
  } catch {
    return erro(400, "O perfil precisa ser um JSON válido.");
  }
  const perfil = perfilSchema.safeParse(corpo);
  if (!perfil.success) {
    const campos = [...new Set(perfil.error.issues.map((issue) => issue.path.join(".") || "perfil"))];
    return erro(400, `Perfil inválido: confira ${campos.join(", ")}.`);
  }

  try {
    return { status: 200, jsonBody: { ok: true, ...(await gerarPlano(perfil.data, context)) } };
  } catch (falha) {
    context.error("plano failed", falha);
    if (falha instanceof ConfigError) return erro(500, falha.message);
    if (falha instanceof PlanoInvalidoError) return erro(502, "A IA devolveu um plano incompleto. Tente gerar de novo.");
    if (falha instanceof APIConnectionTimeoutError) return erro(504, "A IA demorou demais para responder. Tente de novo.");
    return erro(502, "Não foi possível gerar o plano agora. Tente de novo em instantes.");
  }
}

app.http("plano", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "plano",
  handler: plano,
});
