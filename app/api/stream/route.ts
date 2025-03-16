import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioBlob = formData.get('audio');
    
    if (!audioBlob || !(audioBlob instanceof Blob)) {
      return NextResponse.json(
        { error: 'Nenhum arquivo de áudio fornecido' },
        { status: 400 }
      );
    }

    // Criar um novo FormData para enviar ao backend
    const newFormData = new FormData();
    newFormData.append('audio', audioBlob);

    const response = await fetch(`${process.env.API_URL}/radio/stream`, {
      method: 'POST',
      body: newFormData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      return NextResponse.json(
        { error: errorData.error || 'Falha ao enviar áudio para o stream' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao enviar áudio:', error);
    return NextResponse.json(
      { error: 'Falha ao enviar áudio para o stream' },
      { status: 500 }
    );
  }
} 