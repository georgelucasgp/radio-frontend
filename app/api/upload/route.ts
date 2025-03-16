import { NextRequest, NextResponse } from 'next/server';

// Configuração para permitir uploads grandes
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export async function POST(request: NextRequest) {
  try {
    console.log('[Upload Route] Iniciando processamento do upload...');
    
    // Verifica se a requisição tem o content-type correto
    const contentType = request.headers.get('content-type');
    console.log('[Upload Route] Content-Type:', contentType);
    
    if (!contentType?.includes('multipart/form-data')) {
      console.error('[Upload Route] Content-Type inválido');
      return NextResponse.json(
        { error: 'Content-Type deve ser multipart/form-data' },
        { status: 400 }
      );
    }

    // Extrai o arquivo do FormData
    console.log('[Upload Route] Extraindo arquivo do FormData...');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('[Upload Route] Nenhum arquivo recebido');
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    console.log('[Upload Route] Arquivo recebido:', {
      nome: file.name,
      tamanho: file.size,
      tipo: file.type
    });

    // Verifica se é um arquivo de áudio
    if (!file.type.startsWith('audio/')) {
      console.error('[Upload Route] Tipo de arquivo inválido:', file.type);
      return NextResponse.json(
        { error: 'Apenas arquivos de áudio são permitidos' },
        { status: 400 }
      );
    }

    // Criar um novo FormData para enviar ao backend
    const apiFormData = new FormData();
    apiFormData.append('file', file);

    // Enviar para o backend
    console.log('[Upload Route] Enviando para o backend:', process.env.API_URL);
    const response = await fetch(`${process.env.API_URL}/radio/upload`, {
      method: 'POST',
      body: apiFormData,
    });

    console.log('[Upload Route] Resposta do backend - Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Upload Route] Erro na resposta do backend:', {
        status: response.status,
        body: errorText
      });

      let errorMessage = 'Erro ao fazer upload';
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        console.error('[Upload Route] Erro ao parsear resposta de erro:', e);
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const responseText = await response.text();
    console.log('[Upload Route] Resposta do backend:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('[Upload Route] Erro ao parsear resposta:', e);
      return NextResponse.json(
        { error: 'Erro ao processar resposta do servidor' },
        { status: 500 }
      );
    }

    console.log('[Upload Route] Upload concluído com sucesso');
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Upload Route] Erro não tratado:', error);
    return NextResponse.json(
      { error: 'Falha ao processar o upload' },
      { status: 500 }
    );
  }
} 