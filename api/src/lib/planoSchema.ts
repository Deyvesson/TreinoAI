import { z } from "zod";
import { EQUIPAMENTOS, NIVEIS, type Exercicio, type ExercicioId } from "../../../shared/exercicios";
import { LIMITES_PERFIL, OBJETIVOS, type PerfilTreino, type Plano } from "../../../shared/plano";

export const perfilSchema = z.strictObject({
  objetivo: z.enum(OBJETIVOS),
  nivel: z.enum(NIVEIS),
  diasPorSemana: z.number().int().min(LIMITES_PERFIL.diasPorSemana.min).max(LIMITES_PERFIL.diasPorSemana.max),
  minutosPorSessao: z.number().int().min(LIMITES_PERFIL.minutosPorSessao.min).max(LIMITES_PERFIL.minutosPorSessao.max),
  equipamento: z.array(z.enum(EQUIPAMENTOS)).max(EQUIPAMENTOS.length),
  limitacoes: z.string().trim().max(LIMITES_PERFIL.limitacoesCaracteres).nullable(),
});

// O schema de saída não leva limites numéricos: o structured output só garante o formato,
// e as regras de conteúdo ficam em verificarPlano, que devolve mensagens para a IA corrigir.
export function planoSchema(ids: readonly ExercicioId[]) {
  const prescrito = z.strictObject({
    exercicioId: z.enum(ids as [ExercicioId, ...ExercicioId[]]),
    series: z.number(),
    repeticoesMin: z.number().nullable(),
    repeticoesMax: z.number().nullable(),
    duracaoSegundos: z.number().nullable(),
    distanciaKm: z.number().nullable(),
    descansoSegundos: z.number(),
    repeticoesEmReserva: z.number().nullable(),
    motivo: z.string(),
    observacao: z.string().nullable(),
  });
  return z.strictObject({
    nome: z.string(),
    resumo: z.string(),
    duracaoSemanas: z.number(),
    progressao: z.string(),
    dias: z.array(z.strictObject({ nome: z.string(), foco: z.string(), exercicios: z.array(prescrito) })),
    cuidados: z.array(z.string()),
  });
}

// Garante em tempo de compilação que os schemas não se afastam dos tipos compartilhados.
type Igual<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const perfilConfere: Igual<z.infer<typeof perfilSchema>, PerfilTreino> = true;
const planoConfere: Igual<z.infer<ReturnType<typeof planoSchema>>, Plano> = true;
void perfilConfere;
void planoConfere;

export function paraJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const { $schema: _ignorado, ...resto } = z.toJSONSchema(schema) as Record<string, unknown>;
  return resto;
}

const inteiroEntre = (valor: number | null, min: number, max: number) =>
  valor !== null && Number.isInteger(valor) && valor >= min && valor <= max;

// Estimativa grosseira da duração de um dia, para pegar planos que não cabem no tempo do usuário.
function minutosEstimados(dia: Plano["dias"][number], porId: ReadonlyMap<string, Exercicio>): number {
  let segundos = 0;
  for (const p of dia.exercicios) {
    const e = porId.get(p.exercicioId);
    const lados = e?.unilateral ? 2 : 1;
    const execucao =
      p.duracaoSegundos ?? (p.distanciaKm ? p.distanciaKm * 420 : ((p.repeticoesMax ?? p.repeticoesMin ?? 10) * 4));
    segundos += p.series * (execucao * lados + p.descansoSegundos);
  }
  return segundos / 60;
}

export function verificarPlano(plano: Plano, perfil: PerfilTreino, porId: ReadonlyMap<string, Exercicio>): string[] {
  const problemas: string[] = [];
  if (plano.dias.length !== perfil.diasPorSemana) {
    problemas.push(`O plano tem ${plano.dias.length} dias, mas precisa ter exatamente ${perfil.diasPorSemana}.`);
  }
  if (!inteiroEntre(plano.duracaoSemanas, 2, 16)) problemas.push("duracaoSemanas deve ser um inteiro entre 2 e 16.");

  plano.dias.forEach((dia, i) => {
    const rotulo = `Dia ${i + 1} (${dia.nome})`;
    if (dia.exercicios.length < 2 || dia.exercicios.length > 10) {
      problemas.push(`${rotulo}: use entre 2 e 10 exercícios.`);
    }
    const repetidos = dia.exercicios.map((p) => p.exercicioId).filter((id, j, todos) => todos.indexOf(id) !== j);
    if (repetidos.length) problemas.push(`${rotulo}: exercício repetido no mesmo dia (${repetidos.join(", ")}).`);

    for (const p of dia.exercicios) {
      const e = porId.get(p.exercicioId);
      const alvo = `${rotulo}, ${p.exercicioId}`;
      if (!e) {
        problemas.push(`${alvo}: exercício fora da lista disponível.`);
        continue;
      }
      if (!inteiroEntre(p.series, 1, 10)) problemas.push(`${alvo}: series deve ser um inteiro entre 1 e 10.`);
      if (!inteiroEntre(p.descansoSegundos, 0, 600)) problemas.push(`${alvo}: descansoSegundos deve ser um inteiro entre 0 e 600.`);
      if (p.repeticoesEmReserva !== null && !inteiroEntre(p.repeticoesEmReserva, 0, 5)) {
        problemas.push(`${alvo}: repeticoesEmReserva deve ser null ou um inteiro entre 0 e 5.`);
      }
      switch (e.medida) {
        case "carga-reps":
        case "reps":
          if (!inteiroEntre(p.repeticoesMin, 1, 100) || !inteiroEntre(p.repeticoesMax, 1, 100) || p.repeticoesMin! > p.repeticoesMax!) {
            problemas.push(`${alvo}: medido em repetições; preencha repeticoesMin e repeticoesMax (inteiros, min <= max).`);
          }
          break;
        case "tempo":
        case "carga-tempo":
          if (!inteiroEntre(p.duracaoSegundos, 5, 3600)) problemas.push(`${alvo}: medido em tempo; preencha duracaoSegundos (5 a 3600).`);
          break;
        case "distancia-tempo":
          if (!inteiroEntre(p.duracaoSegundos, 60, 14400) && !(p.distanciaKm !== null && p.distanciaKm > 0 && p.distanciaKm <= 50)) {
            problemas.push(`${alvo}: medido em distância e tempo; preencha duracaoSegundos ou distanciaKm.`);
          }
          break;
      }
    }

    const minutos = minutosEstimados(dia, porId);
    if (minutos > perfil.minutosPorSessao * 1.4) {
      problemas.push(
        `${rotulo}: leva cerca de ${Math.round(minutos)} minutos, acima dos ${perfil.minutosPorSessao} disponíveis. Reduza séries, exercícios ou descanso.`,
      );
    }
  });
  return problemas;
}
