import { z } from "zod";
import { MEDIDAS, NIVEIS } from "../../../shared/exercicios";
import { LIMITES_PERFIL, OBJETIVOS } from "../../../shared/plano";
import { LIMITES_RESUMO, MINIMO_TREINOS_ANALISE, type AnaliseProgresso, type ResumoProgresso } from "../../../shared/progresso";

const data = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const texto = z.string().trim().min(1).max(LIMITES_RESUMO.texto);

export const resumoSchema = z.strictObject({
  perfil: z.strictObject({
    objetivo: z.enum(OBJETIVOS),
    nivel: z.enum(NIVEIS),
    diasPorSemana: z.number().int().min(LIMITES_PERFIL.diasPorSemana.min).max(LIMITES_PERFIL.diasPorSemana.max),
  }),
  plano: z.strictObject({ nome: texto, duracaoSemanas: z.number().int().min(1).max(52) }),
  treinos: z.number().int().min(MINIMO_TREINOS_ANALISE).max(1000),
  primeiroTreino: data,
  ultimoTreino: data,
  frequencia: z.array(z.strictObject({ semana: data, treinos: z.number().int().min(0).max(14) })).max(LIMITES_RESUMO.semanas),
  exercicios: z
    .array(
      z.strictObject({
        id: z.string().regex(/^[a-z0-9-]{2,60}$/),
        nome: texto,
        medida: z.enum(MEDIDAS),
        sessoes: z
          .array(
            z.strictObject({
              data,
              melhor: texto,
              valor: z.number().min(0).max(100000),
              metaCumprida: z.boolean(),
            }),
          )
          .min(1)
          .max(LIMITES_RESUMO.sessoesPorExercicio),
      }),
    )
    .min(1)
    .max(LIMITES_RESUMO.exercicios),
});

export function analiseSchema(ids: readonly string[]) {
  return z.strictObject({
    resumo: z.string(),
    destaques: z.array(z.string()),
    estagnados: z.array(
      z.strictObject({ exercicioId: z.enum(ids as [string, ...string[]]), explicacao: z.string(), sugestao: z.string() }),
    ),
    proximosPassos: z.array(z.string()),
    frequencia: z.string(),
    limitacoes: z.string().nullable(),
  });
}

// Garante em tempo de compilação que os schemas não se afastam dos tipos compartilhados.
type Igual<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const resumoConfere: Igual<z.infer<typeof resumoSchema>, ResumoProgresso> = true;
const analiseConfere: Igual<z.infer<ReturnType<typeof analiseSchema>>, AnaliseProgresso> = true;
void resumoConfere;
void analiseConfere;

export function verificarAnalise(analise: AnaliseProgresso): string[] {
  const problemas: string[] = [];
  if (analise.resumo.trim().length < 20) problemas.push("O resumo está vazio ou curto demais.");
  if (analise.destaques.length > 4) problemas.push("Use no máximo 4 destaques.");
  if (analise.estagnados.length > 3) problemas.push("Liste no máximo 3 exercícios estagnados.");
  if (analise.proximosPassos.length < 1 || analise.proximosPassos.length > 4) problemas.push("Dê entre 1 e 4 próximos passos.");
  const repetidos = analise.estagnados.map((e) => e.exercicioId).filter((id, i, todos) => todos.indexOf(id) !== i);
  if (repetidos.length) problemas.push(`Exercício estagnado repetido: ${repetidos.join(", ")}.`);
  return problemas;
}
