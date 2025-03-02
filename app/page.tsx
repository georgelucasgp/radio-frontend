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
      <div className="container mx-auto px-4 py-8 h-[calc(100vh-4rem)]">
        <div className="flex flex-col gap-8 h-full">
          <header className="flex items-center justify-between flex-shrink-0">
            <RadioLogo />
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
            <div className="lg:col-span-2 flex flex-col min-h-0">
              <div className="flex-shrink-0 mb-8">
                <Player />
              </div>
              {isAdmin && (
                <div className="flex-shrink-0 mb-8">
                  <VoiceRecorder />
                </div>
              )}
              <div className="flex-1 min-h-0">
                <Queue />
              </div>
            </div>
            <div className="flex flex-col gap-8 min-h-0">
              {isAdmin && (
                <div className="flex-shrink-0">
                  <MusicUploader />
                </div>
              )}
              <div className="flex-1 min-h-0">
                <Chat />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}