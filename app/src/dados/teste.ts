// Histórico de teste (tela de diagnóstico): treinos de exemplo marcados com `teste`, removíveis sem tocar nos reais.
// Seis semanas a partir do plano ativo: cargas sobem a cada três treinos, um exercício fica estagnado de propósito
// e uma semana fica sem treino, para a análise da IA e os gráficos terem o que mostrar.
import type { Exercicio } from '../../../shared/exercicios'
import type { ExercicioPrescrito } from '../../../shared/plano'
import { db, planoAtivo, lerPerfil, type SerieSalva } from './db'
import { exercicioDe, incrementoDeCarga } from './sessao'

function cargaInicial(e: Exercicio): number {
  if (e.equipamento.includes('barra')) return 40
  if (e.equipamento.includes('maquina') || e.equipamento.includes('smith')) return 30
  if (e.equipamento.includes('polia')) return 20
  if (e.equipamento.includes('kettlebell')) return 12
  if (e.equipamento.includes('halteres')) return 10
  return 0
}

function valoresDaSerie(p: ExercicioPrescrito, e: Exercicio, treino: number, estagnado: boolean): Omit<SerieSalva, 'id' | 'sessaoId' | 'exercicioId' | 'numero' | 'registradaEm'> {
  const repsMax = p.repeticoesMax ?? p.repeticoesMin ?? 10
  const repsMin = p.repeticoesMin ?? repsMax
  switch (e.medida) {
    case 'carga-reps':
      return {
        carga: estagnado ? cargaInicial(e) : cargaInicial(e) + Math.floor(treino / 3) * incrementoDeCarga(e),
        repeticoes: estagnado ? Math.max(1, repsMin - (treino > 6 ? 2 : 0)) : repsMax,
        duracaoSegundos: null,
        distanciaKm: null,
      }
    case 'reps':
      return { carga: null, repeticoes: Math.min(repsMax, repsMin + Math.floor(treino / 3)), duracaoSegundos: null, distanciaKm: null }
    case 'tempo':
    case 'carga-tempo':
      return {
        carga: e.medida === 'carga-tempo' ? cargaInicial(e) + Math.floor(treino / 3) * 2 : null,
        repeticoes: null,
        duracaoSegundos: (p.duracaoSegundos ?? 30) + Math.floor(treino / 3) * 5,
        distanciaKm: null,
      }
    case 'distancia-tempo':
      return { carga: null, repeticoes: null, duracaoSegundos: p.duracaoSegundos ?? 1200, distanciaKm: p.distanciaKm ?? 3 }
  }
}

export async function gerarHistoricoDeTeste(): Promise<number> {
  const [plano, perfil] = await Promise.all([planoAtivo(), lerPerfil()])
  if (!plano) throw new Error('Gere um plano antes de criar o histórico de teste.')
  const meta = perfil?.diasPorSemana ?? plano.plano.dias.length
  const semanas = [meta - 1, meta - 1, meta, 0, meta - 1, Math.max(1, meta - 2)].map((n) => Math.max(0, n))
  const agora = new Date()
  const segunda = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - ((agora.getDay() + 6) % 7))
  const dias = plano.plano.dias
  const estagnadoId = dias.flatMap((d) => d.exercicios).find((p) => exercicioDe(p.exercicioId).medida === 'carga-reps')?.exercicioId

  let diaIndice = 0
  let treino = 0
  await db.transaction('rw', db.sessoes, db.series, async () => {
    for (let s = 0; s < semanas.length; s++) {
      for (let k = 0; k < semanas[s]; k++) {
        const inicio = new Date(segunda)
        inicio.setDate(segunda.getDate() - (semanas.length - 1 - s) * 7 + k * 2)
        inicio.setHours(7, 0, 0, 0)
        if (inicio >= agora) inicio.setTime(agora.getTime() - (semanas[s] - k) * 6 * 3600_000)
        const dia = dias[diaIndice]
        let instante = inicio.getTime()
        const sessaoId = (await db.sessoes.add({
          planoId: plano.id!,
          diaIndice,
          iniciadaEm: inicio.toISOString(),
          encerradaEm: null,
          estado: 'concluida',
          atual: null,
          descansoAte: null,
          teste: true,
        })) as number
        for (const p of dia.exercicios) {
          const e = exercicioDe(p.exercicioId)
          for (let numero = 1; numero <= p.series; numero++) {
            instante += (p.descansoSegundos + 45) * 1000
            await db.series.add({
              sessaoId,
              exercicioId: p.exercicioId,
              numero,
              ...valoresDaSerie(p, e, treino, p.exercicioId === estagnadoId),
              registradaEm: new Date(instante).toISOString(),
            })
          }
        }
        await db.sessoes.update(sessaoId, { encerradaEm: new Date(instante).toISOString() })
        diaIndice = (diaIndice + 1) % dias.length
        treino++
      }
    }
  })
  return treino
}

/** Remove só os treinos de teste (e as análises, que podem tê-los considerado). */
export async function apagarHistoricoDeTeste(): Promise<number> {
  return db.transaction('rw', db.sessoes, db.series, db.analises, async () => {
    const sessoes = await db.sessoes.filter((s) => s.teste === true).toArray()
    for (const s of sessoes) await db.series.where('sessaoId').equals(s.id!).delete()
    await db.sessoes.bulkDelete(sessoes.map((s) => s.id!))
    if (sessoes.length) await db.analises.clear()
    return sessoes.length
  })
}

export async function contarTreinosDeTeste(): Promise<number> {
  return db.sessoes.filter((s) => s.teste === true).count()
}
