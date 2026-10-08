// Divisões de treino: o servidor escolhe a divisão pelo nível e pelos dias por semana, e a IA só monta
// os exercícios dentro dela. Assim os grupos musculares de cada dia são previsíveis e verificáveis.
import type { Grupo } from "../../../shared/exercicios";
import type { PerfilTreino } from "../../../shared/plano";

export interface DiaDaDivisao {
  nome: string;
  /** O que o treino trabalha, em texto para o prompt. */
  descricao: string;
  /** Grupos (campo `grupo` do catálogo) que podem aparecer neste dia. */
  grupos: readonly Grupo[];
}

export interface Divisao {
  nome: string;
  dias: readonly DiaDaDivisao[];
  /** Mais dias por semana que treinos: os treinos se repetem em sequência (A, B, C, A, B...). */
  rotativa: boolean;
  porque: string;
}

const PERNAS: readonly Grupo[] = ["quadriceps", "posteriores", "gluteos", "panturrilhas", "adutores", "lombar", "corpo-inteiro"];

const SUPERIORES: DiaDaDivisao = {
  nome: "Superiores",
  descricao: "peito, costas, ombros, bíceps e tríceps",
  grupos: ["peito", "costas", "ombros", "biceps", "triceps", "trapezio", "antebracos"],
};
const INFERIORES: DiaDaDivisao = {
  nome: "Inferiores e core",
  descricao: "quadríceps, posteriores de coxa, glúteos, panturrilhas e abdômen",
  grupos: [...PERNAS, "abdomen"],
};
const EMPURRAR: DiaDaDivisao = {
  nome: "Empurrar",
  descricao: "peito, ombros (deltoide anterior e lateral) e tríceps",
  grupos: ["peito", "ombros", "triceps"],
};
const PUXAR: DiaDaDivisao = {
  nome: "Puxar",
  descricao: "costas, deltoide posterior, trapézio e bíceps (de ombros, só exercícios para o deltoide posterior)",
  grupos: ["costas", "ombros", "trapezio", "biceps", "antebracos", "lombar"],
};
const PERNAS_E_CORE: DiaDaDivisao = {
  nome: "Pernas",
  descricao: "quadríceps, posteriores de coxa, glúteos, panturrilhas e abdômen",
  grupos: [...PERNAS, "abdomen"],
};
const PERNAS_COMPLETAS: DiaDaDivisao = {
  nome: "Pernas",
  descricao: "quadríceps, posteriores de coxa, glúteos e panturrilhas",
  grupos: PERNAS,
};

const AB: Omit<Divisao, "rotativa"> = {
  nome: "AB (superiores e inferiores)",
  dias: [SUPERIORES, INFERIORES],
  porque: "treina cada músculo com frequência alta sem acumular cansaço, bom para construir base e aprender os movimentos",
};
const ABC: Omit<Divisao, "rotativa"> = {
  nome: "ABC (empurrar, puxar, pernas)",
  dias: [EMPURRAR, PUXAR, PERNAS_E_CORE],
  porque: "separa os músculos por função, sem sobreposição, e deixa bom tempo de recuperação entre os treinos",
};
const ABCD: Omit<Divisao, "rotativa"> = {
  nome: "ABCD",
  dias: [
    { nome: "Peito e tríceps", descricao: "peito e tríceps", grupos: ["peito", "triceps"] },
    { nome: "Costas e bíceps", descricao: "costas e bíceps", grupos: ["costas", "biceps", "antebracos", "lombar", "trapezio"] },
    PERNAS_COMPLETAS,
    { nome: "Ombros e abdômen", descricao: "ombros completos, trapézio e abdômen", grupos: ["ombros", "trapezio", "abdomen"] },
  ],
  porque: "concentra mais séries em cada grupo por sessão, para quem já aguenta treinos mais intensos",
};
const ABCDE: Omit<Divisao, "rotativa"> = {
  nome: "ABCDE",
  dias: [
    { nome: "Peito e abdômen", descricao: "peito e abdômen", grupos: ["peito", "abdomen"] },
    { nome: "Costas e trapézio", descricao: "costas e trapézio", grupos: ["costas", "trapezio", "lombar"] },
    PERNAS_COMPLETAS,
    { nome: "Ombros e abdômen", descricao: "ombros e abdômen", grupos: ["ombros", "abdomen"] },
    { nome: "Braços", descricao: "bíceps, tríceps e antebraços", grupos: ["biceps", "triceps", "antebracos"] },
  ],
  porque: "cada músculo é treinado uma vez por semana com volume alto na sessão, o que pede intensidade máxima",
};

/**
 * 2 dias: AB. 3 dias: ABC. 4 dias: ABCD no avançado, AB repetido nos demais. 5 dias: ABCDE no avançado,
 * ABC em rotação nos demais. 6 dias: ABC duas vezes. Quando há mais dias que treinos, a divisão é rotativa.
 */
export function divisaoPara(perfil: Pick<PerfilTreino, "diasPorSemana" | "nivel">): Divisao {
  const avancado = perfil.nivel === "avancado";
  const base =
    perfil.diasPorSemana <= 2 ? AB
    : perfil.diasPorSemana === 3 ? ABC
    : perfil.diasPorSemana === 4 ? (avancado ? ABCD : AB)
    : perfil.diasPorSemana === 5 ? (avancado ? ABCDE : ABC)
    : ABC;
  return { ...base, rotativa: perfil.diasPorSemana > base.dias.length };
}

/** Texto da divisão para o prompt. */
export function textoDaDivisao(divisao: Divisao, diasPorSemana: number): string {
  const linhas = divisao.dias.map(
    (d, i) => `- Treino ${String.fromCharCode(65 + i)}, nome "${d.nome}": ${d.descricao}. Grupos permitidos: ${d.grupos.join(", ")}.`,
  );
  const repeticao = divisao.rotativa
    ? `A pessoa treina ${diasPorSemana} dias por semana e os ${divisao.dias.length} treinos se repetem em sequência (A, B${divisao.dias.length > 2 ? ", C" : ""}, A...). Explique isso no "resumo".`
    : `Um treino para cada um dos ${diasPorSemana} dias da semana.`;
  return [
    `Divisão obrigatória: ${divisao.nome}. Monte exatamente ${divisao.dias.length} treinos, nesta ordem:`,
    ...linhas,
    repeticao,
    `No "resumo", diga em linguagem simples por que essa divisão: ${divisao.porque}.`,
  ].join("\n");
}

/** Exercícios fora dos grupos do dia. Cardio pode entrar em qualquer dia, no máximo um e no fim. */
export function problemasDeDivisao(
  dias: readonly { nome: string; exercicios: readonly { exercicioId: string }[] }[],
  divisao: Divisao,
  grupoDe: (id: string) => Grupo | undefined,
): string[] {
  const problemas: string[] = [];
  if (dias.length !== divisao.dias.length) {
    problemas.push(`O plano precisa ter exatamente ${divisao.dias.length} treinos (divisão ${divisao.nome}), mas tem ${dias.length}.`);
    return problemas;
  }
  dias.forEach((dia, i) => {
    const esperado = divisao.dias[i];
    const rotulo = `Treino ${String.fromCharCode(65 + i)} (${esperado.nome})`;
    const fora: string[] = [];
    let cardios = 0;
    dia.exercicios.forEach((p, j) => {
      const grupo = grupoDe(p.exercicioId);
      if (!grupo) return;
      if (grupo === "cardio") {
        cardios++;
        if (j !== dia.exercicios.length - 1) problemas.push(`${rotulo}: o cardio (${p.exercicioId}) deve ser o último exercício.`);
        return;
      }
      if (!esperado.grupos.includes(grupo)) fora.push(`${p.exercicioId} (${grupo})`);
    });
    if (cardios > 1) problemas.push(`${rotulo}: use no máximo um exercício de cardio.`);
    if (fora.length) {
      problemas.push(`${rotulo}: exercícios fora dos grupos do dia (${esperado.grupos.join(", ")}): ${fora.join(", ")}. Troque por exercícios desses grupos.`);
    }
  });
  return problemas;
}
