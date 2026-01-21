interface Voice {
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

interface VoiceSelectorProps {
  voices: Voice[];
  selectedVoice: Voice | null;
  onVoiceChange: (voice: Voice) => void;
}

const VoiceSelector = ({ voices, selectedVoice, onVoiceChange }: VoiceSelectorProps) => {
  return (
    <div className="voice-selector">
      <label className="selector-label">Select Voice</label>
      <select
        className="voice-dropdown"
        value={selectedVoice?.id || ''}
        onChange={(e) => {
          const voice = voices.find(v => v.id === e.target.value);
          if (voice) onVoiceChange(voice);
        }}
      >
        {voices.map((voice) => (
          <option key={voice.id} value={voice.id}>
            {voice.name} {voice.isCustom && '(Custom)'}
          </option>
        ))}
      </select>
    </div>
  );
};

export default VoiceSelector;
