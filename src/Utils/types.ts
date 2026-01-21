export interface Voice {
  id: string;
  voiceId: string;
  name: string;
  description?: string;
  language: string;
  accent?: string;
  isCustom: boolean;
  createdAt: string;
  _count?: {
    audioSamples: number;
    speechHistory: number;
  };
}

export interface SpeechHistory {
  id: string;
  text: string;
  language: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  fileSize: number;
  duration?: number;
  createdAt: string;
  voice: {
    name: string;
    voiceId: string;
  };
}

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}
