import { baseURL } from "@/Utils/URL";

interface SpeechHistory {
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


interface AudioPlayerProps {
  speech: SpeechHistory;
  onDelete: (speechId: string) => void;
}

const AudioPlayer = ({ speech, onDelete }: AudioPlayerProps) => {
  const audioUrl = `${baseURL}/api/v1/speech/${speech.id}/audio`;
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="audio-player-card">
      <div className="audio-info">
        <div className="audio-text">{speech.text.substring(0, 80)}...</div>
        <div className="audio-meta">
          <span className="voice-name">{speech.voice.name}</span>
          <span className="separator">•</span>
          <span className="audio-date">{formatDate(speech.createdAt)}</span>
          <span className="separator">•</span>
          <span className="audio-size">{formatFileSize(speech.fileSize)}</span>
        </div>
      </div>

      <div className="audio-controls">
        <audio controls className="audio-element">
          <source src={audioUrl} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
        
        <button 
          className="delete-btn" 
          onClick={() => onDelete(speech.id)}
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export default AudioPlayer;
