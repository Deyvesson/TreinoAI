---
version: 1
slug: "app-src-telas-sessao-tsx"
primary_target: "app/src/telas/Sessao.tsx"
related_targets: ["app/src/telas/Hoje.tsx","app/src/telas/Resumo.tsx","app/src/componentes/Torre.tsx"]
---

# Sessão de treino

Modo: Operate. Fluxo completo do treino do dia: abertura, série ativa, descanso, torre aberta (troca livre) e resumo final.

## Público e tarefa
Quem treina, de pé, celular numa mão, entre séries, atenção dividida. Ver a meta e a imagem do exercício, registrar carga e repetições (pré-preenchidas, um toque confirma), descansar no tempo certo e seguir. Sessão guiada na ordem do plano, com troca livre quando o aparelho está ocupado. Na série: meta do plano e imagem; "última vez" e motivo da IA não aparecem na tela da série (o motivo fica na abertura).

## Decisões fechadas
- Incremento de carga: barra 2,5 kg; halteres 2 kg; máquina e polia 5 kg; demais 2,5 kg.
- Recorde: maior carga já registrada no exercício com repetições dentro da faixa; sem histórico não existe recorde.
- Som no fim do descanso: desligado por padrão. Não perguntar repetições em reserva após cada série.
- Fora de escopo: questionário, visão do plano completo, histórico e análise.

## Direction contract
THESIS: O treino do dia é uma prova ao vivo lida numa torre de tempos: cada exercício tem posição e estado, e só a série atual está no ar. Recusa o padrão da categoria: fundo escuro com verde-limão, cartões arredondados e anéis de progresso.
OWN-WORLD: Fundo branco de estúdio, tinta azul-noite, uma única placa invertida em azul ultramar por tela. Estados da cronometragem: verde meta cumprida, roxo recorde, amarelo abaixo da meta, cinza pendente, como faixas finas na torre. Archivo variável: números condensados tabulares enormes, textos em largura normal. Grade de células rígida, fios finos, sem sombras decorativas.
STORY: A pessoa abre o treino do dia, entende a ordem pela torre, começa, registra cada série com um toque, descansa com a contagem gigante, troca de exercício pela torre quando precisa e termina vendo a classificação final do dia.
FIRST VIEWPORT: Série ativa no celular: no topo, a torre recolhida como faixa de posições coloridas com o treino do dia e o tempo decorrido; no centro, a placa ultramar com nome do exercício, série 2 de 4, meta e imagem; carga e repetições em números condensados gigantes com botões − e + grandes; "Registrar série" largo na base, no alcance do polegar. No desktop a torre fica fixa à esquerda, como na transmissão.
FORM: Torre de Tempos (gráficos de transmissão de corrida), posição 7 da lista ordenada; seed key 262c3f97. Raises: ações destrutivas isoladas por espaço (Console Escuro); uma única placa invertida por tela (Tabela de Horários); grade de células rígida (Grade de Crouwel); fim do descanso inverte a tela inteira uma vez, estático com movimento reduzido (Campo de Dados); torre aberta sobe a linha escolhida e esmaece as outras (Parede de Streaming). Assinatura: a torre, com a contagem do descanso na linha do exercício atual como a diferença para o líder.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
