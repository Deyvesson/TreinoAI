import type { InvocationContext } from "@azure/functions";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { AnaliseGerada, AnaliseProgresso, ResumoProgresso } from "../../../shared/progresso";
import { analiseSchema, verificarAnalise } from "./analiseSchema";
import { getFoundry } from "./foundry";
import { paraJsonSchema } from "./planoSchema";

export class AnaliseInvalidaError extends Error {
  constructor(readonly problemas: string[]) {
    super(`Análise inválida após correção: ${problemas.join(" | ")}`);
  }
}

// Mesmo limite de 45 s das Functions gerenciadas do SWA usado na geração do plano.
const PRAZO_TOTAL_MS = 42_000;
const TEMPO_MINIMO_CORRECAO_MS = 15_000;

const INSTRUCOES = `Você é um treinador que lê o histórico de treinos de uma pessoa num app brasileiro e explica a evolução dela. Responda em português do Brasil, com frases curtas, diretas e encorajadoras sem exagero.

Regras:
- Baseie-se só nos dados enviados. Não invente números, datas nem exercícios.
- Cada exercício traz, por sessão, a melhor série ("melhor"), o número acompanhado ("valor": carga em kg, repetições, segundos ou km conforme a "medida") e se a meta foi cumprida.
- Destaque: o valor subiu de forma consistente ou a meta passou a ser cumprida. Cite o exercício pelo nome e o antes e depois.
- Estagnado: três ou mais sessões seguidas sem aumento do valor, ou a meta deixou de ser cumprida. Explique em uma frase e dê uma sugestão prática (aumentar repetições antes da carga, ajustar o descanso, reduzir a carga por uma semana, rever a execução).
- Frequência: compare os treinos por semana com a meta de dias por semana do perfil.
- Próximos passos: de 1 a 4 ações concretas para as próximas semanas.
- Se houver poucos dados para concluir algo, diga isso em "limitacoes"; caso contrário, use null.
- No máximo 4 destaques e 3 estagnados. Use os ids exatos dos exercícios em "exercicioId".
- Não faça afirmações médicas nem promessas de resultado.`;

export async function gerarAnalise(resumo: ResumoProgresso, contexto: InvocationContext): Promise<AnaliseGerada> {
  const inicio = Date.now();
  const schema = analiseSchema(resumo.exercicios.map((e) => e.id));
  const jsonSchema = paraJsonSchema(schema);
  const { client, deployment } = getFoundry();

  const mensagens: ChatCompletionMessageParam[] = [
    { role: "system", content: INSTRUCOES },
    { role: "user", content: `Histórico resumido (JSON):\n${JSON.stringify(resumo)}` },
  ];

  let problemas: string[] = [];
  for (let tentativa = 1; tentativa <= 2; tentativa++) {
    const restante = PRAZO_TOTAL_MS - (Date.now() - inicio);
    const resposta = await client.chat.completions.create(
      {
        model: deployment,
        messages: mensagens,
        response_format: { type: "json_schema", json_schema: { name: "analise", strict: true, schema: jsonSchema } },
        max_completion_tokens: 4000,
      },
      { timeout: restante, maxRetries: 0 },
    );
    const conteudo = resposta.choices[0]?.message?.content ?? "";
    contexto.log(`analise: tentativa ${tentativa} em ${Date.now() - inicio} ms, ${resposta.usage?.completion_tokens} tokens`);

    const lido = schema.safeParse(JSON.parse(conteudo));
    problemas = lido.success ? verificarAnalise(lido.data as AnaliseProgresso) : ["O JSON não segue o formato pedido."];
    if (lido.success && problemas.length === 0) {
      return {
        analise: lido.data as AnaliseProgresso,
        geradaEm: new Date().toISOString(),
        modelo: resposta.model,
        treinosAnalisados: resumo.treinos,
      };
    }

    contexto.warn(`analise: tentativa ${tentativa} com problemas: ${problemas.join(" | ")}`);
    if (PRAZO_TOTAL_MS - (Date.now() - inicio) < TEMPO_MINIMO_CORRECAO_MS) break;
    mensagens.push(
      { role: "assistant", content: conteudo },
      { role: "user", content: `Corrija estes problemas e devolva a análise completa:\n- ${problemas.join("\n- ")}` },
    );
  }
  throw new AnaliseInvalidaError(problemas);
}
