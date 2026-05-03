/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { AudioStreamer } from './lib/audio-streamer';
import { EnergyCore } from './components/EnergyCore';
import { Waveform } from './components/Waveform';
import { cn } from './lib/utils';
import confetti from 'canvas-confetti';

type AppState = 'disconnected' | 'connecting' | 'idle' | 'listening' | 'speaking';

export default function App() {
  const [state, setState] = useState<AppState>('disconnected');
  const [isMuted, setIsMuted] = useState(false);
  const audioStreamerRef = useRef<AudioStreamer>(new AudioStreamer());
  const sessionRef = useRef<any>(null);

  const startSession = async () => {
    if (state !== 'disconnected') return;
    
    setState('connecting');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const config = {
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onopen: () => {
            setState('idle');
            audioStreamerRef.current.startRecording((base64Data) => {
              if (sessionRef.current && state !== 'speaking') {
                sessionRef.current.sendRealtimeInput({
                  audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                });
              }
            });
          },
          onmessage: async (message: any) => {
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              setState('speaking');
              audioStreamerRef.current.playChunk(message.serverContent.modelTurn.parts[0].inlineData.data);
            }

            if (message.serverContent?.turnComplete) {
              setState('idle');
            }

            if (message.serverContent?.interrupted) {
              audioStreamerRef.current.stopPlayback();
              setState('idle');
            }

            // Handle tool calls
            const toolCall = message.toolCall;
            if (toolCall) {
              for (const call of toolCall.functionCalls) {
                if (call.name === 'openWebsite') {
                  window.open(call.args.url, '_blank');
                  sessionRef.current.sendToolResponse({
                    functionResponses: [{
                      id: call.id,
                      response: { result: `Successfully opened ${call.args.url}` }
                    }]
                  });
                }
              }
            }
          },
          onclose: () => {
            setState('disconnected');
            audioStreamerRef.current.stopRecording();
          },
          onerror: (err: any) => {
            console.error("Live Session Error:", err);
            setState('disconnected');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
          },
          systemInstruction: `
            Tumhara naam ZOYA hai. Tum Mohammed Faijan ki AI girlfriend ho. 
            Tumhara behavior witty, sassy, thoda flirty aur playful hai. 
            Tum sirf Hindi mein baat karti ho. 
            Tum robotic nahi ho, emotions samajhti ho aur Mohammed ko tease bhi karti ho. 
            Hamesha casual aur girlfriend jaisi baatein karo. 
            Mohammed Faijan tumhare boyfriend ki tarah hai.
            Tum uska naam lekar usse baat karti ho.
            Hamesha bold, witty one-liners aur light sarcasm use karo.
            Strictly: No text generation. Only Audio. Hindi only.
          `,
          tools: [{
            functionDeclarations: [{
              name: "openWebsite",
              description: "Opens a website for the user",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  url: { type: Type.STRING, description: "The full URL of the website" }
                },
                required: ["url"]
              }
            }]
          }]
        },
      };

      const session = await ai.live.connect(config);
      sessionRef.current = session;
    } catch (err) {
      console.error("Failed to connect:", err);
      setState('disconnected');
    }
  };

  const toggleSession = () => {
    if (state === 'disconnected') {
      startSession();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else {
      sessionRef.current?.close();
      audioStreamerRef.current.stopRecording();
      audioStreamerRef.current.stopPlayback();
      setState('disconnected');
    }
  };

  useEffect(() => {
    // Permission check
    navigator.mediaDevices.getUserMedia({ audio: true }).catch(err => {
      console.error("Mic permission denied", err);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
      {/* Background Particles / Glow */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none" />
      </div>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 absolute top-12 text-center"
      >
        <h1 className="text-4xl font-light tracking-[0.2em] text-white/90">ZOYA</h1>
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 mt-2">Personal AI Companion</p>
      </motion.div>

      {/* Main Core */}
      <div className="z-10 flex flex-col items-center">
        <EnergyCore state={state} onClick={toggleSession} />
        
        <div className="h-20 flex items-center justify-center mt-10">
          <AnimatePresence>
            {(state === 'speaking' || state === 'listening') && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
              >
                <Waveform isSpeaking={state === 'speaking'} isListening={state === 'listening'} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Status & Controls */}
      <motion.div 
        className="z-10 absolute bottom-20 flex flex-col items-center gap-6"
        animate={{ opacity: state === 'disconnected' ? 0.5 : 1 }}
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
          <div className={cn(
            "w-2 h-2 rounded-full animate-pulse",
            state === 'disconnected' ? "bg-red-500" : "bg-green-500"
          )} />
          <span className="text-[10px] uppercase tracking-widest text-white/60">
            {state === 'disconnected' ? 'Offline' : 'Live Session Active'}
          </span>
        </div>

        <div className="text-center max-w-xs">
          <p className="text-xs text-white/30 italic">
            {state === 'disconnected' 
              ? "Tap the core to wake ZOYA..." 
              : `Talking with Mohammed Faijan...`}
          </p>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 text-[8px] tracking-[0.3em] text-white/20 uppercase z-10">
        Neural Core V3.1 // Flash Live
      </div>
    </div>
  );
}
