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
| `NEXT_PUBLIC_API_URL` | `http://54.207.217.97:3000` | URL da API do backend |
| `NEXT_PUBLIC_STREAM_URL` | `http://54.207.217.97:8000` | URL do servidor de streaming |

5. Clique em "Save" para salvar as variáveis

**Observação**: Quando o backend tiver um domínio configurado, substitua os IPs pelos domínios correspondentes.

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
   FRONTEND_URL=https://radiodoubleg.vercel.app
   ```

2. **Importante**: O backend está configurado para aceitar apenas este domínio específico. Se você mudar o domínio ou adicionar domínios adicionais, precisará atualizar a configuração de CORS no backend.

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
4. Confirme que a URL no `.env` do backend corresponde exatamente ao domínio da Vercel (incluindo https:// e sem barra no final)

Para problemas com o build:

1. Verifique os logs de build na Vercel
2. Certifique-se de que todas as dependências estão instaladas corretamente 