# Radio Double G - Frontend

## Solução para problemas de CORS

Para resolver os problemas de CORS entre o frontend e o backend, implementamos uma abordagem de Server-Side Rendering (SSR) utilizando as rotas de API do Next.js. Isso permite que as requisições sejam feitas do servidor Next.js para o backend, evitando problemas de CORS no navegador.

### Rotas de API implementadas

- `/api/upload` - Upload de arquivos de música
- `/api/youtube` - Adição de músicas do YouTube
- `/api/now-playing` - Informações sobre a música atual
- `/api/queue` - Fila de reprodução
- `/api/stream` - Envio de áudio de voz para o stream
- `/api/chat` - Envio de mensagens para o chat

### Variáveis de ambiente

O projeto utiliza as seguintes variáveis de ambiente:

- `API_URL` - URL da API para uso no servidor (SSR)
- `NEXT_PUBLIC_STREAM_URL` - URL do stream de áudio

### Como funciona

1. Os componentes do frontend fazem requisições para as rotas de API do Next.js
2. As rotas de API do Next.js fazem requisições para o backend
3. As respostas são retornadas para os componentes do frontend

Esta abordagem elimina problemas de CORS, pois as requisições do navegador são feitas para o mesmo domínio (o servidor Next.js), e as requisições do servidor Next.js para o backend não estão sujeitas às restrições de CORS do navegador.

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
``` 