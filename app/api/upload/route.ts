import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

    // Envia o stream diretamente para o backend
    const response = await fetch(`${process.env.API_URL}/radio/upload`, {
      method: 'POST',
      // Passa o body e headers da requisição original diretamente
      body: request.body,
      headers: {
        'Content-Type': contentType,
      },
      // @ts-ignore - o tipo RequestInit não inclui duplex, mas é uma opção válida do Node.js fetch
      duplex: 'half',
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

    const data = await response.json();
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