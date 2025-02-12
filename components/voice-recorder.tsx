"use client"

import { useState, useRef, useEffect } from 'react'
import { Mic, Square } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

export function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [volume, setVolume] = useState(100)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [error, setError] = useState<string | null>(null)

  const startRecording = async () => {
    try {
      setError(null)
      chunksRef.current = [] // Limpa os chunks anteriores
      console.log('Solicitando permissão do microfone...')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
          channelCount: 2,
        } 
      })
      
      console.log('Permissão concedida, configurando gravador...')
      streamRef.current = stream
      
      // Verifica os formatos suportados
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
      ]
      
      let selectedMimeType = null
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type
          break
        }
      }
      
      if (!selectedMimeType) {
        throw new Error('Nenhum formato de áudio suportado encontrado')
      }
      
      console.log(`Usando formato de áudio: ${selectedMimeType}`)
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        audioBitsPerSecond: 128000,
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log(`Chunk de áudio recebido: ${event.data.size} bytes`)
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        try {
          console.log('Finalizando gravação e preparando envio...')
          const audioBlob = new Blob(chunksRef.current, { type: selectedMimeType })
          console.log(`Tamanho total do áudio: ${audioBlob.size} bytes`)
          
          const formData = new FormData()
          const fileExtension = selectedMimeType.includes('ogg') ? 'ogg' : 'webm'
          formData.append('audio', audioBlob, `audio.${fileExtension}`)
          
          console.log('Enviando áudio para o servidor...')
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/radio/stream`, {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            const error = await response.text()
            console.error('Erro na resposta do servidor:', error)
            throw new Error(`Erro do servidor: ${response.status} - ${error}`)
          }

          const result = await response.json()
          console.log('Áudio enviado com sucesso:', result)
          chunksRef.current = [] // Limpa os chunks após envio bem-sucedido
        } catch (error) {
          console.error('Erro ao enviar áudio:', error)
          setError('Erro ao enviar áudio para o servidor')
        }
      }

      mediaRecorder.start() // Inicia a gravação sem timeslice
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      console.log('Gravação iniciada')
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error)
      setError('Erro ao iniciar gravação')
    }
  }

  const stopRecording = () => {
    console.log('Parando gravação...')
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.requestData() // Solicita o último chunk de dados
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    setIsRecording(false)
    console.log('Gravação finalizada')
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return (
    <Card>
      <CardHeader className="border-b">
        <h3 className="text-lg font-semibold">Gravação ao vivo</h3>
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Button
            variant={isRecording ? "destructive" : "default"}
            onClick={toggleRecording}
            className="w-32"
          >
            {isRecording ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Parar
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Gravar
              </>
            )}
          </Button>
          
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm">Volume do microfone</span>
            <Slider
              value={[volume]}
              max={100}
              step={1}
              className="w-32"
              onValueChange={(value) => setVolume(value[0])}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}