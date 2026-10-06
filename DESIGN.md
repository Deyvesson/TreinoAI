---
name: TreinoAI
description: Treino do dia lido como uma torre de tempos de transmissão: fundo branco de estúdio, uma placa ultramar no ar.
colors:
  ultramar: "#2433d6"
  ultramar-forte: "#1b27b0"
  na-placa: "#ffffff"
  na-placa-2: "#cdd1fa"
  fundo: "#ffffff"
  superficie: "#ffffff"
  tinta: "#0b1020"
  tinta-2: "#3f4659"
  tinta-3: "#5f6578"
  fio: "#dcdfe6"
  fio-forte: "#b4bac7"
  verde: "#12a150"
  roxo: "#7b2ff7"
  amarelo: "#f5b700"
  pendente: "#c5cad4"
  verde-texto: "#0b7a3c"
  roxo-texto: "#6320d4"
  amarelo-texto: "#7a5800"
  perigo: "#b42318"
typography:
  display:
    fontFamily: "'Archivo Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "clamp(7rem, 46vw, 15rem)"
    fontWeight: 800
    lineHeight: 0.82
    letterSpacing: "-0.02em"
    fontFeature: "'tnum', 'lnum'"
    fontVariation: "'wdth' 62"
  numero:
    fontFamily: "'Archivo Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "clamp(3.25rem, 16vw, 5.5rem)"
    fontWeight: 800
    lineHeight: 1
    fontFeature: "'tnum', 'lnum'"
    fontVariation: "'wdth' 62"
  headline:
    fontFamily: "'Archivo Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "clamp(2rem, 9vw, 3rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 72"
  title:
    fontFamily: "'Archivo Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "clamp(1.5rem, 6.4vw, 2.125rem)"
    fontWeight: 750
    lineHeight: 1.05
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 85"
  torre:
    fontFamily: "'Archivo Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "'Archivo Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "'Archivo Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    letterSpacing: "0.08em"
    fontVariation: "'wdth' 85"
  botao:
    fontFamily: "'Archivo Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 700
    fontVariation: "'wdth' 85"
rounded:
  celula: "2px"
  raio: "3px"
  placa: "6px"
spacing:
  costura: "3px"
  c: "8px"
  c-1-5: "12px"
  c-2: "16px"
  margem: "20px"
  c-3: "24px"
  c-4: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ultramar}"
    textColor: "{colors.na-placa}"
    typography: "{typography.botao}"
    rounded: "{rounded.raio}"
    padding: "0 20px"
    height: "56px"
  button-primary-hover:
    backgroundColor: "{colors.ultramar-forte}"
  button-primary-wide:
    backgroundColor: "{colors.ultramar}"
    textColor: "{colors.na-placa}"
    rounded: "{rounded.raio}"
    height: "64px"
    width: "100%"
  button-plate:
    backgroundColor: "{colors.na-placa}"
    textColor: "{colors.ultramar}"
    typography: "{typography.botao}"
    rounded: "{rounded.raio}"
    height: "64px"
  button-plate-outline:
    backgroundColor: "transparent"
    textColor: "{colors.na-placa}"
    rounded: "{rounded.raio}"
    height: "64px"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.tinta-2}"
    height: "48px"
    padding: "0"
  button-text-danger:
    backgroundColor: "transparent"
    textColor: "{colors.perigo}"
    height: "48px"
    padding: "0"
  button-danger:
    backgroundColor: "{colors.perigo}"
    textColor: "{colors.na-placa}"
    rounded: "{rounded.raio}"
    height: "56px"
  button-icon:
    backgroundColor: "transparent"
    rounded: "{rounded.raio}"
    size: "48px"
  chip-dia:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.raio}"
    padding: "0 14px"
    height: "44px"
  chip-dia-selected:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.ultramar}"
  plate:
    backgroundColor: "{colors.ultramar}"
    textColor: "{colors.na-placa}"
    padding: "20px"
  plate-desktop:
    backgroundColor: "{colors.ultramar}"
    textColor: "{colors.na-placa}"
    rounded: "{rounded.placa}"
    padding: "32px 36px"
    width: "760px"
  tower-row:
    backgroundColor: "{colors.fundo}"
    textColor: "{colors.tinta}"
    typography: "{typography.torre}"
    height: "56px"
  tower-row-current:
    backgroundColor: "{colors.fundo}"
    textColor: "{colors.ultramar}"
  tower-row-current-panel:
    backgroundColor: "{colors.ultramar}"
    textColor: "{colors.na-placa}"
  tower-cell:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta-3}"
    rounded: "{rounded.celula}"
    height: "40px"
  tower-cell-current:
    backgroundColor: "{colors.ultramar}"
    textColor: "{colors.na-placa}"
    rounded: "{rounded.celula}"
    height: "40px"
  image-cell:
    backgroundColor: "{colors.superficie}"
    rounded: "{rounded.raio}"
    height: "23dvh"
    width: "100%"
  field-value:
    backgroundColor: "transparent"
    textColor: "{colors.na-placa}"
    typography: "{typography.numero}"
---

# Design System: TreinoAI

## Overview

**Creative North Star: "Torre de Tempos"**

O treino do dia é uma prova ao vivo lida numa torre de tempos de transmissão de corrida. Cada exercício tem posição e estado; só a série atual está no ar. O sistema vive em fundo branco de estúdio, com tinta azul-noite, fios finos de 1px e uma única placa invertida em ultramar por tela, que é a coisa que a pessoa está fazendo agora. Tudo o mais é tabela: linhas, posições, faixas de estado.

A densidade é de gráfico de transmissão: números condensados, tabulares e enormes onde a pessoa precisa ler de longe com o celular numa mão (carga, repetições, contagem do descanso), texto em largura normal onde precisa ler de perto. A grade é rígida, em células de 8px, e a separação é feita por fios, nunca por campos cinza ou cartões. O movimento imita grafismo de TV: a placa entra varrendo da esquerda para a direita, a torre aberta desce de cima para baixo, e o fim do descanso inverte a tela inteira uma vez.

O mundo recusa o padrão da categoria fitness: fundo escuro com verde-limão, cartões arredondados e anéis de progresso.

**Key Characteristics:**
- Fundo branco de estúdio, separação por fios de 1px.
- Uma única placa ultramar preenchida por tela.
- Estados da cronometragem como faixas finas: verde, roxo, amarelo, cinza.
- Archivo variável: números condensados (62%) tabulares, texto em largura normal.
- Grade de células de 8px; costuras de 3px entre células irmãs.
- Movimento de grafismo de transmissão, estático com movimento reduzido.

## Colors

Uma paleta de estúdio: branco puro, tinta azul-noite, um único azul ultramar para o que está no ar e quatro cores de cronometragem usadas só em traços finos.

### Primary
- **Ultramar da Transmissão** (ultramar): a placa no ar (série ativa e descanso), o CTA principal fora da sessão, a linha atual da torre como tinta e faixa, o anel de foco, a seleção de texto, o cursor e o interruptor ligado.
- **Ultramar Profundo** (ultramar-forte): somente hover do botão primário.

### Secondary
- **Branco na Placa** (na-placa): texto, números e botão principal sobre a placa ultramar; também o texto do CTA ultramar.
- **Lavanda na Placa** (na-placa-2): texto secundário sobre ultramar (meta, posição gigante, rótulos de campo, "desfazer"). Fios sobre a placa são branco a 30% (`rgb(255 255 255 / 0.3)`, `--na-placa-fio`).

### Tertiary (estados da cronometragem)
- **Verde Meta** (verde): meta cumprida.
- **Roxo Recorde** (roxo): recorde pessoal; vence o amarelo quando os dois se aplicam.
- **Amarelo Abaixo** (amarelo): abaixo da meta.
- **Cinza Pendente** (pendente): ainda sem registro.
- **Variantes de texto** (verde-texto, roxo-texto, amarelo-texto): a mesma família escurecida para o valor da linha em texto sobre branco, onde o tom puro não teria contraste.
- **Perigo** (perigo): apenas ações destrutivas (encerrar, apagar).

### Neutral
- **Branco de Estúdio** (fundo, superficie): o chão de toda página e a célula da imagem do exercício. Os dois são branco puro de propósito: a imagem funde com a célula.
- **Tinta Azul-Noite** (tinta): texto principal.
- **Tinta Média** (tinta-2): texto de apoio, detalhe da torre, botões de texto.
- **Tinta Clara** (tinta-3): posições, contagens de séries, relógio, datas.
- **Fio** (fio): todos os divisores de 1px, contorno das células da torre recolhida.
- **Fio Forte** (fio-forte): contorno do chip de dia, trilho do interruptor desligado, barra de rolagem.

### Named Rules
**The Uma Placa Rule.** Exatamente uma superfície preenchida (invertida) por tela: na sessão, a placa da série ou do descanso; em Hoje, o CTA de começar/retomar ou a placa de retomar; no Resumo, o CTA. A linha atual da torre é tinta ultramar com faixa sobre branco em todo lugar, e só vira preenchida dentro do painel da torre aberta no celular, onde ela é a única placa.

**The Faixa Fina Rule.** As cores de estado aparecem como faixas de 4px na linha da torre, barras inferiores de 4px nas células recolhidas e quadradinhos de 12px na legenda. Nunca como fundo de área grande.

**The Estúdio Branco Rule.** O chão é sempre branco puro; a separação é feita por fios de 1px, nunca por campos cinza.

## Typography

**Display Font:** Archivo Variable (com system-ui, -apple-system, Segoe UI)
**Body Font:** Archivo Variable
**Label/Mono Font:** a mesma família; os números usam `tabular-nums lining-nums` (classe `.num`).

**Character:** uma única família variável em dois registros. O eixo de largura faz o trabalho: números condensados a 62% como num placar, títulos a 72–85%, texto corrido na largura normal.

### Hierarchy
- **Display** (800, clamp(7rem, 46vw, 15rem), 0.82, largura 62%): só a contagem do descanso.
- **Número** (800, clamp(3.25rem, 16vw, 5.5rem), 1, largura 62%): carga e repetições na placa; cresce até clamp(3.25rem, 22vw, 7rem) quando não há imagem. O cronômetro de série usa a mesma voz em clamp(4rem, 22vw, 7rem). A posição na placa usa 3.5rem/0.85 em lavanda.
- **Headline** (800, clamp(2rem, 9vw, 3rem), 1, largura 72%): o nome do treino do dia em Hoje e no Resumo; 1.75rem no título lateral da torre no desktop.
- **Title** (750, clamp(1.5rem, 6.4vw, 2.125rem), 1.05, largura 85%, text-wrap balance): o nome do exercício na placa.
- **Torre** (600, 1rem, 1.2): nome do exercício na linha; posição em 800/1.375rem/62%; valor em 700/1rem/75%, alinhado à direita.
- **Body** (400, 1rem, 1.45): texto corrido, até 60–68ch.
- **Label** (700, 0.75rem, 0.08em, maiúsculas, largura 85%): rótulo de campo do ajuste ("Carga · kg", "Reps", "Faltam"), sempre colado ao valor que nomeia.
- **Linha de resultado** (800, 1.75rem, 1, largura 62%): a linha única tabular do Resumo (tempo · séries · volume).

### Named Rules
**The Número Condensado Rule.** Todo número lido em movimento é Archivo a 800 e largura 62%, tabular. Texto para ler de perto fica na largura normal.

**The Sem Sobretítulo Rule.** Nada de rótulo pequeno acima de título. Estado e contexto entram na própria linha ("Próximo treino · 6 exercícios · cerca de 50 min").

**The Uma Linha Rule.** Resultados são uma linha tabular, não células de métrica com número gigante e legenda.

## Layout

Grade rígida de células de 8px (`--c`); todo espaçamento é múltiplo dela, com margem lateral de 2,5 células (20px, `--margem`). Células irmãs (células da torre recolhida, séries na placa, botões − e + lado a lado) ficam separadas por uma costura de 3px.

**Celular (padrão):** a sessão é uma coluna de altura cheia: topo com o nome do dia, relógio e a torre recolhida como faixa de células por posição; abaixo, a placa ocupa o resto da tela até a base, com os controles no alcance do polegar. Hoje e Resumo usam coluna de até 680px com o CTA fixo numa base branca com fio superior.

**Imagem do exercício:** ocupa uma célula da largura do conteúdo (23dvh de altura), mostrada inteira (`object-fit: contain`). Sem imagem publicada, a célula desaparece; a placa então empurra cabeçalho, séries e registro para baixo, junto do polegar, e os números crescem.

**Desktop (≥ 960px):** a torre fica fixa à esquerda numa coluna de 380px com fio à direita, como na transmissão; a placa vira um bloco de até 760px centralizado na coluna principal. A torre recolhida e o nome do dia no topo somem.

### Named Rules
**The Grade de Células Rule.** Espaçamento em múltiplos de 8px; a costura de 3px é a única exceção sistemática.

**The Polegar Rule.** Na placa, a ação principal fica na base; desfazer fica no topo da placa, longe dela; ações destrutivas ficam isoladas por espaço e fio.

## Elevation & Depth

Plano por padrão. Profundidade vem da inversão (a placa ultramar) e de fios, não de sombras. Sombras existem só onde algo literalmente sai do plano: a linha da torre escolhida para troca, que sobe enquanto as outras esmaecem a 32%; o menu da sessão sobre um véu de tinta a 32%; e o botão do interruptor.

### Shadow Vocabulary
- **Linha erguida** (`box-shadow: 0 10px 24px rgb(11 16 32 / 0.14), 0 2px 6px rgb(11 16 32 / 0.08)`, com `translateY(-4px)`): linha da torre aberta para "Fazer agora".
- **Menu** (`box-shadow: 0 14px 36px rgb(11 16 32 / 0.2), 0 2px 6px rgb(11 16 32 / 0.1)`): menu flutuante da sessão.
- **Botão do interruptor** (`box-shadow: 0 1px 3px rgb(11 16 32 / 0.25)`).

### Named Rules
**The Sombra Funcional Rule.** Sombra só para algo que sai do plano por estado ou sobreposição. Nunca decorativa, nunca em repouso.

## Shapes

Formas retas com cantos quase vivos. Raio padrão de 3px (`--raio`) em botões, chips, imagem e avisos; 2px nas células da torre e das séries; 6px apenas para a placa no desktop e o menu flutuante. A única forma redonda é o interruptor (trilho de 14px, botão circular), mantido como controle nativo reconhecível. Faixas de estado são retângulos sem raio.

## Components

### Buttons
Diretos e altos, feitos para o polegar.
- **Shape:** cantos de 3px; altura mínima de 56px, 64px na base da placa e no CTA largo.
- **Primary:** ultramar com texto branco, 700, largura 85%, 1.0625rem. A versão larga vai a 100% (máx. 600px) e 1.125rem.
- **Hover / Focus:** hover escurece para ultramar profundo; pressionar desce 1px; foco é anel ultramar de 3px com afastamento de 2px (branco sobre a placa e a placa de retomar). Desabilitado a 45% de opacidade.
- **Na placa:** botão branco com texto ultramar (a ação principal da placa) e botão contorno com anel interno de 2px branco a 30% para ações secundárias (+15s, pular).
- **Texto:** sublinhado de 1px com afastamento de 4px, tinta média; a variante de perigo usa vermelho. Perigo preenchido só em confirmação destrutiva.
- **Ícone:** 48px, transparente, hover com tinta a 6%. Ícones são SVG de traço (lucide).

### Chips
- **Style:** chip de dia com fio forte de 1px, fundo branco, número condensado em tinta clara.
- **State:** selecionado ganha contorno ultramar dobrado (fio + anel interno de 1px) e texto ultramar; nunca preenchido.

### Inputs / Fields
- **Ajuste:** rótulo em maiúsculas acima de uma linha entre fios brancos a 30%, com − e + nas pontas (72px com um campo) e o valor no meio em Número. Com dois campos lado a lado, o número ocupa a coluna inteira e − e + descem para baixo, largos, em branco a 10%.
- **Focus:** anel de foco recolhido para dentro (afastamento −2px).
- **Interruptor:** trilho de 48×28px, fio forte desligado, ultramar ligado.

### Navigation
Sem barra de navegação. A torre é a navegação da sessão: recolhida no topo (celular), aberta num painel de tela cheia que desce com varredura de cima para baixo, ou fixa à esquerda (desktop).

### Torre (componente assinatura)
Lista ordenada com fio superior e fio entre linhas. Cada linha: posição condensada (44px), faixa de estado de 4px, nome, séries feitas/total, valor tabular à direita. A linha atual é tinta ultramar com faixa ultramar. Durante o descanso, o valor da linha atual vira a contagem regressiva no formato "+0:45", como a diferença para o líder. Ao tocar uma linha pendente, ela sobe (linha erguida) e as outras esmaecem, com "Fazer agora" e "Manter a ordem". Recolhida: uma célula de 40px por exercício com barra inferior de 4px da cor de estado; a célula atual é ultramar preenchida e alarga para 2,6 frações no descanso para mostrar a diferença. Acompanhada da legenda de quadradinhos de 12px.

### Placa
A série no ar. Fundo ultramar, entra com varredura da esquerda para a direita (420ms). Contém posição gigante em lavanda, nome do exercício, "Série n de N" e a meta, a célula da imagem, a fileira de séries (células translúcidas, a atual com anel branco de 2px), o registro e a ação principal na base. No descanso: contagem Display, "registrada" em lavanda, a próxima série acima de um fio, e as ações +15s/pular.

### Imagem do exercício
Célula branca de 3px de raio; a ilustração tem fundo branco puro de estúdio (regra do prompt em `tools/imagens/estilo.ts`) para fundir com a célula. Dois quadros alternam em 2,4s; tocar pausa. Com movimento reduzido, mostra só o primeiro quadro.

### Fim do descanso
A tela inteira inverte uma vez (`filter: invert(1) hue-rotate(180deg)`, 900ms). Com movimento reduzido, não há animação; resta a mensagem estática.

## Do's and Don'ts

### Do:
- **Do** manter exatamente uma superfície ultramar preenchida por tela (placa, CTA ou placa de retomar).
- **Do** desenhar a linha atual da torre como tinta e faixa ultramar sobre branco; preencher só no painel da torre aberta no celular.
- **Do** usar números Archivo 800 a 62% de largura, tabulares, para tudo que é lido em movimento.
- **Do** separar com fios de 1px (fio) sobre branco puro.
- **Do** espaçar em múltiplos de 8px, com costura de 3px entre células irmãs.
- **Do** mostrar estado como faixa de 4px, barra inferior de 4px ou quadradinho de 12px na legenda; roxo vence amarelo.
- **Do** mostrar a imagem inteira (contain) numa célula da largura do conteúdo, e recolher a célula quando não houver imagem.
- **Do** usar a varredura da esquerda para a direita na placa, a de cima para baixo no painel da torre e a inversão única no fim do descanso, todas desligadas com movimento reduzido.

### Don't:
- **Don't** pôr rótulo pequeno (sobretítulo) acima de títulos; o estado entra na própria linha.
- **Don't** montar células de métrica com número gigante e legenda; resultado é uma linha tabular.
- **Don't** usar campos cinza ou cartões para separar conteúdo sobre o branco.
- **Don't** pintar áreas grandes com verde, roxo ou amarelo.
- **Don't** usar fundo escuro com verde-limão, cartões arredondados ou anéis de progresso.
- **Don't** usar sombra em repouso ou como decoração.
- **Don't** passar de 6px de raio (exceção: o interruptor).
