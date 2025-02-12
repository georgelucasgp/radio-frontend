"use client"

import { useState } from 'react';
import { Player } from '@/components/player';
import { Chat } from '@/components/chat';
import { Queue } from '@/components/queue';
import { VoiceRecorder } from '@/components/voice-recorder';
import { MusicUploader } from '@/components/music-uploader';
import { RadioLogo } from '@/components/radio-logo';

export default function Home() {
  const [isAdmin] = useState(true); // TODO: Replace with actual auth

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          <header className="flex items-center justify-between">
            <RadioLogo />
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Player />
              {isAdmin && <VoiceRecorder />}
              <Queue />
            </div>
            <div className="space-y-8">
              {isAdmin && <MusicUploader />}
              <Chat />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}