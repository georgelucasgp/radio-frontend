# Guia de Deploy na Vercel

Este guia explica como configurar e fazer deploy do frontend da Rádio DoubleG na Vercel.

## Pré-requisitos

- Conta na Vercel (https://vercel.com)
- Repositório do projeto no GitHub, GitLab ou Bitbucket

## Configuração das Variáveis de Ambiente

1. Faça login na sua conta da Vercel
2. Importe o repositório do frontend
3. Na página de configuração do projeto, vá para a aba "Environment Variables"
4. Adicione as seguintes variáveis de ambiente:

| Nome | Valor em Produção | Descrição |
|------|-------------------|-----------|
| `NEXT_PUBLIC_API_URL` | `https://api.radio-doubleg.com` | URL da API do backend |
| `NEXT_PUBLIC_STREAM_URL` | `https://stream.radio-doubleg.com` | URL do servidor de streaming |
| `NEXT_PUBLIC_ICECAST_HOST` | `stream.radio-doubleg.com` | Host do Icecast |
| `NEXT_PUBLIC_LIVE_PASSWORD` | `senha-segura` | Senha para transmissão ao vivo (não use "hackme" em produção) |

5. Clique em "Save" para salvar as variáveis

## Configuração de Build

A Vercel detectará automaticamente que é um projeto Next.js, mas você pode precisar ajustar algumas configurações:

1. Na aba "Settings" > "Build & Development Settings":
   - Build Command: `pnpm build`
   - Output Directory: `out`
   - Install Command: `pnpm install`

2. Na aba "Settings" > "Environment Variables", adicione:
   - `NPM_FLAGS`: `--shamefully-hoist`

## Domínio Personalizado (Opcional)

1. Na aba "Domains", adicione seu domínio personalizado
2. Siga as instruções para configurar os registros DNS

## Configuração do Backend

Depois de fazer o deploy do frontend, você precisa configurar o backend para aceitar requisições do domínio da Vercel:

1. No arquivo `.env` do backend, atualize a variável `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://radio-doubleg.vercel.app,https://www.radio-doubleg.com
   ```

2. Se você estiver usando múltiplos domínios, separe-os por vírgula como mostrado acima

3. Reinicie o servidor backend para aplicar as alterações

## Verificação do Deploy

Após o deploy, verifique se:

1. O frontend está carregando corretamente
2. A conexão com o backend está funcionando (chat, upload de áudio, etc.)
3. O streaming de áudio está funcionando

## Solução de Problemas

Se encontrar problemas com WebSockets:

1. Verifique se as variáveis de ambiente estão configuradas corretamente
2. Certifique-se de que o backend está aceitando conexões do domínio da Vercel
3. Verifique os logs do backend para erros de CORS

Para problemas com o build:

1. Verifique os logs de build na Vercel
2. Certifique-se de que todas as dependências estão instaladas corretamente 