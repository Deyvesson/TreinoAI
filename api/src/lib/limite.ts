import type { HttpRequest } from "@azure/functions";

// Limite por IP em memória. Vale por instância da Function (não é global), mas já barra
// repetição em massa de um mesmo cliente; o teto real de custo é a cota de tokens do Foundry.
export function criarLimite(maximo: number, janelaMs: number) {
  const chamadas = new Map<string, number[]>();
  return function permitir(ip: string): boolean {
    const agora = Date.now();
    const recentes = (chamadas.get(ip) ?? []).filter((t) => agora - t < janelaMs);
    if (recentes.length >= maximo) {
      chamadas.set(ip, recentes);
      return false;
    }
    recentes.push(agora);
    chamadas.set(ip, recentes);
    if (chamadas.size > 10_000) chamadas.clear();
    return true;
  };
}

export function ipDoCliente(request: HttpRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconhecido";
}
