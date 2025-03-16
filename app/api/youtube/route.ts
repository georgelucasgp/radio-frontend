import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL do YouTube não fornecida' },
        { status: 400 }
      );
    }

    // Enviar para o backend
    const response = await fetch(`${process.env.API_URL}/radio/youtube`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Erro ao baixar do YouTube' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao processar YouTube:', error);
    return NextResponse.json(
      { error: 'Falha ao processar o vídeo do YouTube' },
      { status: 500 }
    );
  }
} 