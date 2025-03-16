import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Criar um novo FormData para enviar ao backend
    const apiFormData = new FormData();
    apiFormData.append('file', file);

    // Enviar para o backend
    const response = await fetch(`${process.env.API_URL}/radio/upload`, {
      method: 'POST',
      body: apiFormData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Erro ao fazer upload' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json(
      { error: 'Falha ao processar o upload' },
      { status: 500 }
    );
  }
} 