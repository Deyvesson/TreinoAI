import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { APIConnectionTimeoutError } from "openai";
import { MINIMO_TREINOS_ANALISE } from "../../../shared/progresso";
import { resumoSchema } from "../lib/analiseSchema";
import { ConfigError } from "../lib/foundry";
import { AnaliseInvalidaError, gerarAnalise } from "../lib/gerarAnalise";
import { criarLimite, ipDoCliente } from "../lib/limite";

const TAMANHO_MAXIMO_BYTES = 48 * 1024;
const permitir = criarLimite(5, 10 * 60_000);

const erro = (status: number, mensagem: string): HttpResponseInit => ({ status, jsonBody: { ok: false, erro: mensagem } });

export async function analise(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (!permitir(ipDoCliente(request))) {
    return erro(429, "Muitas análises em pouco tempo. Tente de novo em alguns minutos.");
  }

  const texto = await request.text();
  if (texto.length > TAMANHO_MAXIMO_BYTES) return erro(413, "Histórico grande demais para analisar.");

  let corpo: unknown;
  try {
    corpo = JSON.parse(texto);
  } catch {
    return erro(400, "O histórico precisa ser um JSON válido.");
  }
  const resumo = resumoSchema.safeParse(corpo);
  if (!resumo.success) {
    const campos = [...new Set(resumo.error.issues.map((issue) => issue.path.join(".") || "historico"))];
    if (campos.includes("treinos")) {
      return erro(400, `A análise precisa de pelo menos ${MINIMO_TREINOS_ANALISE} treinos registrados.`);
    }
    return erro(400, `Histórico inválido: confira ${campos.slice(0, 5).join(", ")}.`);
  }

  try {
    return { status: 200, jsonBody: { ok: true, ...(await gerarAnalise(resumo.data, context)) } };
  } catch (falha) {
    context.error("analise failed", falha);
    if (falha instanceof ConfigError) return erro(500, falha.message);
    if (falha instanceof AnaliseInvalidaError) return erro(502, "A IA devolveu uma análise incompleta. Tente de novo.");
    if (falha instanceof APIConnectionTimeoutError) return erro(504, "A IA demorou demais para responder. Tente de novo.");
    return erro(502, "Não foi possível analisar agora. Tente de novo em instantes.");
  }
}

app.http("analise", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "analise",
  handler: analise,
});
