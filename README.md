# TreinoAI

Plano de treino gerado por IA e análise de progresso, com os dados no próprio aparelho. Contexto de produto em [PRODUCT.md](PRODUCT.md).

## Estrutura

| Pasta | O que é |
|---|---|
| `app/` | SPA Vite + React + TypeScript (vira PWA na fase 3) |
| `api/` | Azure Functions v4 (Node + TypeScript), gerenciadas pelo Static Web Apps. Só faz proxy para o Foundry. |
| `app/staticwebapp.config.json` | Rotas, fallback da SPA, headers de segurança e runtime da API |
| `.github/workflows/` | Build e deploy no SWA, com ambiente de preview por PR |

## Azure

Subscription "Assinatura do Visual Studio Professional", resource group `rg-treinoai` (eastus2):

| Recurso | Nome | Observação |
|---|---|---|
| Static Web App (Free) | `treinoai-swa` | https://icy-bay-073af510f.1.azurestaticapps.net |
| Azure AI Foundry (AIServices) | `treinoai-foundry` | projeto `treinoai` |
| Deployment do modelo | `gpt-6-luna` | versão 2026-09-22, GlobalStandard, 30K TPM (teto de custo) |

App settings do SWA: `FOUNDRY_ENDPOINT`, `FOUNDRY_API_KEY`, `FOUNDRY_DEPLOYMENT`.

## Rodar localmente

```bash
cd app && npm install && cd ../api && npm install && cd ..
cp api/local.settings.example.json api/local.settings.json   # e preencha FOUNDRY_API_KEY
```

O SWA CLI 2.0.10 recusa iniciar o Functions com Node 24, então suba a API separada:

```bash
# terminal 1
cd api && npm start                      # http://localhost:7071

# terminal 2
cd app && npm run dev                    # http://localhost:5173

# terminal 3: emulador do SWA na frente dos dois
swa start http://localhost:5173 --api-devserver-url http://localhost:7071 --swa-config-location app
```

Abra http://localhost:4280. Com Node 22, `swa start treinoai` (usa o `swa-cli.config.json`) faz tudo de uma vez.

## Deploy

Cada push na `main` dispara o deploy pelo GitHub Actions. O workflow precisa do secret `AZURE_STATIC_WEB_APPS_API_TOKEN`:

```bash
az staticwebapp secrets list -n treinoai-swa -g rg-treinoai --query properties.apiKey -o tsv
```
