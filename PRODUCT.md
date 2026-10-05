# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

- **Hospedagem (definido pelo usuário):** Azure Static Web Apps (SWA).
- **IA (definido pelo usuário):** Azure AI Foundry com modelo GPT; provavelmente "GPT-6 Luna" (a confirmar disponibilidade e região no Foundry). O nome do deployment fica em configuração, nunca no código.
- **Frontend (delegated):** Vite + React + TypeScript como SPA estática, entregue como PWA instalável; dados do usuário no dispositivo (IndexedDB). Motivo: SWA serve SPA estática de forma nativa e estável, enquanto o suporte a Next.js híbrido no SWA tem limitações; o app não precisa de SSR (sem login, sem conteúdo público indexável).
- **API (delegated):** Azure Functions gerenciadas pelo SWA (`/api`, Node + TypeScript), servindo só de proxy para o Foundry, para a chave nunca chegar ao cliente.

## Users

Pessoas que praticam treino (academia, casa, corrida) e querem um plano personalizado sem depender de um personal trainer. O uso principal acontece **durante o treino**: celular na mão, entre séries, consultando o próximo exercício, registrando carga e repetições e controlando o descanso.

## Product Purpose

O TreinoAI gera um plano de treino completo do zero e interpreta o histórico do usuário para explicar a evolução. Sucesso: a pessoa sabe exatamente o que fazer em cada sessão, registra o que fez sem atrito e entende como está progredindo e o que vem a seguir.

## Positioning

Duas capacidades de IA, confirmadas, formam o núcleo:

1. **Geração do plano do zero:** um programa completo montado a partir do objetivo, nível, equipamento disponível e tempo do usuário.
2. **Análise de progresso:** a IA lê o histórico registrado e explica a evolução, identifica platôs e sugere os próximos passos.

Tudo isso sem conta e com os dados no próprio aparelho. Adaptação automática sessão a sessão e coach conversacional **não** fazem parte do posicionamento confirmado.

## Operating Context

- Momento dominante: no meio do treino, em pé, com uma mão, possivelmente suado, com atenção dividida e descansos curtos entre séries.
- Momentos secundários (não confirmados como frequentes): montar o plano inicial e revisar o progresso fora da academia.
- O registro feito durante o treino é a matéria-prima da análise de progresso; se registrar for lento, a análise perde a base.

## Capabilities and Constraints

- Idioma: interface e conteúdo em português do Brasil (PT-BR).
- Local-first e sem login, ao menos no início: sem conta, sem sincronização entre dispositivos.
- A geração e a análise por IA exigem enviar dados do treino ao Azure AI Foundry via proxy no servidor; isso deve ficar claro para o usuário.
- Sem login, o endpoint `/api` fica público: precisa de proteção contra abuso e custo (rate limit, limite de tamanho de payload, teto de tokens).
- Autenticação no Foundry: chave nas app settings do SWA, lida pelas Functions gerenciadas (compatível com o plano Free).
- Código no GitHub, deploy por GitHub Actions (workflow do SWA, com ambiente de preview por PR).
- A sessão de treino e o registro funcionam **offline desde o MVP**; só a geração de plano e a análise de progresso exigem rede.
- **Escopo do MVP:** fundação, geração do plano, sessão de treino com registro, e histórico com análise de progresso. Exportação/backup, polimento e aviso de saúde ficam para depois do MVP.
- **Em aberto:** exportação/backup dos dados locais (o risco de perder dados ao limpar o navegador existe); biblioteca de exercícios (origem, mídia, idioma); como lidar com lesões, limitações e o aviso de que o app não substitui orientação médica ou profissional; monetização.

## Brand Commitments

- Nome de trabalho: **TreinoAI** (é o nome do projeto, não confirmado como marca final).
- Público brasileiro, tudo em PT-BR.
- Ainda não existem logo, identidade visual nem tom de voz definidos.

## Evidence on Hand

Nenhuma. Não há usuários, depoimentos, métricas, dados reais, parcerias nem profissionais validando os planos. O trabalho futuro não deve inventar nada disso: nada de números de usuários, depoimentos, "aprovado por especialistas" ou estudos citados.

## Product Principles

1. **A tela de treino manda.** O que acontece entre séries define o produto: entendido com uma olhada e operável com uma mão.
2. **Registrar sem atrito.** Cada toque a mais no registro corrói a análise de progresso, que depende desses dados.
3. **IA que se explica.** O plano e a leitura do progresso dizem o porquê das escolhas, sem caixa-preta.
4. **Os dados são do usuário.** Local-first, sem conta, e transparência sobre o que vai para a IA.
