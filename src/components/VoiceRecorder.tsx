import React, { useState, useRef } from 'react';
import { Button, Slider, Box, Typography } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';

export const VoiceRecorder: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks.current, { type: 'audio/mp3' });
        const formData = new FormData();
        formData.append('voice', audioBlob);
        formData.append('volume', volume.toString());

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/radio/voice`, {
            method: 'POST',
            credentials: 'omit',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Falha ao enviar áudio');
          }

          console.log('Áudio enviado com sucesso!');
          chunks.current = [];
        } catch (error) {
          console.error('Erro ao enviar áudio:', error);
        }
      };

      mediaRecorder.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">Controle de Voz</Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="contained"
          color={isRecording ? 'error' : 'primary'}
          startIcon={isRecording ? <StopIcon /> : <MicIcon />}
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? 'Parar Gravação' : 'Iniciar Gravação'}
        </Button>
      </Box>

      <Box sx={{ width: 300 }}>
        <Typography gutterBottom>Volume da Voz: {volume}</Typography>
        <Slider
          value={volume}
          onChange={(_, newValue) => setVolume(newValue as number)}
          min={0}
          max={1}
          step={0.1}
          marks
          valueLabelDisplay="auto"
        />
      </Box>
    </Box>
  );
}; 