import React, { useState, useEffect } from 'react';
import { X, Play, Volume2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addAvatarDetails, addVoiceDetails } from '../lib/Slice/videoagentslice';
import { useNavigate } from 'react-router-dom';

interface Avatar {
    avatar_id: string;
    avatar_name: string;
    gender: string;
    preview_image_url: string;
    preview_video_url: string;
    premium: boolean;
}

interface Voice {
    voice_id: string;
    name: string;
    preview_url: string;
    description: string;
    category: string;
}

interface AvatarModalProps {
    isOpen: boolean;
    onClose: () => void;
    avatar: Avatar | null;
    voices: Voice[];
}

const AvatarModal: React.FC<AvatarModalProps> = ({ isOpen, onClose, avatar, voices }) => {
    const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
    const [isVoiceSelectOpen, setIsVoiceSelectOpen] = useState(false);
    const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !avatar) return null;

    const handleVoiceSelect = (voice: Voice) => {
        setSelectedVoice(voice);
        setIsVoiceSelectOpen(false);
    };

    const playAudio = (url: string, voiceId: string) => {
        if (audioPlaying === voiceId) {
            setAudioPlaying(null);
            const audio = document.getElementById(`audio-${voiceId}`) as HTMLAudioElement;
            audio?.pause();
        } else {
            setAudioPlaying(voiceId);
            const audio = document.getElementById(`audio-${voiceId}`) as HTMLAudioElement;
            audio?.play();
        }
    };

    const handleSubmit = () => {
        if (!selectedVoice) {
            alert('Please select a voice');
            return;
        }

        // Dispatch avatar details
        dispatch(addAvatarDetails({
            avatarId: avatar.avatar_id,
            avatarName: avatar.avatar_name,
            avatarImage: avatar.preview_image_url,
            avatarVideo: avatar.preview_video_url,
            gender: avatar.gender
        }));

        // Dispatch voice details
        dispatch(addVoiceDetails({
            voiceId: selectedVoice.voice_id,
            voiceName: selectedVoice.name,
            voicePreviewUrl: selectedVoice.preview_url
        }));

        // Navigate to news-agent
        navigate('/video-agent');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 rounded-xl border border-gray-800 shadow-2xl">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors z-10"
                >
                    <X className="w-5 h-5 text-white" />
                </button>

                <div className="p-6">
                    {/* Header */}
                    <h2 className="text-2xl font-bold text-white mb-6">
                        Select Avatar & Voice
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Avatar Preview Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">Avatar Preview</h3>
                            
                            {/* Image Preview */}
                            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
                                <img
                                    src={avatar.preview_image_url}
                                    alt={avatar.avatar_name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Video Preview */}
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-800">
                                <video
                                    src={avatar.preview_video_url}
                                    controls
                                    className="w-full h-full"
                                >
                                    Your browser does not support video playback.
                                </video>
                            </div>

                            {/* Avatar Info */}
                            <div className="bg-gray-800 rounded-lg p-4">
                                <p className="text-white font-medium">{avatar.avatar_name}</p>
                                <p className="text-gray-400 text-sm capitalize">Gender: {avatar.gender}</p>
                            </div>
                        </div>

                        {/* Voice Selection Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">Select Voice</h3>
                            
                            {/* Selected Voice Display */}
                            <div className="bg-gray-800 rounded-lg p-4">
                                {selectedVoice ? (
                                    <div>
                                        <p className="text-white font-medium">{selectedVoice.name}</p>
                                        <p className="text-gray-400 text-sm">{selectedVoice.description}</p>
                                        <audio id={`audio-selected`} src={selectedVoice.preview_url} />
                                        <button
                                            onClick={() => playAudio(selectedVoice.preview_url, 'selected')}
                                            className="mt-2 flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
                                        >
                                            <Play className="w-4 h-4" />
                                            {audioPlaying === 'selected' ? 'Pause' : 'Play'} Preview
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-gray-400">No voice selected</p>
                                )}
                            </div>

                            {/* Voice Select Button */}
                            <button
                                onClick={() => setIsVoiceSelectOpen(!isVoiceSelectOpen)}
                                className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors"
                            >
                                {isVoiceSelectOpen ? 'Hide Voices' : 'Select Audio'}
                            </button>

                            {/* Voice List */}
                            {isVoiceSelectOpen && (
                                <div className="max-h-96 overflow-y-auto space-y-2 bg-gray-800 rounded-lg p-4">
                                    {voices.map((voice) => (
                                        <div
                                            key={voice.voice_id}
                                            className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                                                selectedVoice?.voice_id === voice.voice_id
                                                    ? 'border-blue-500 bg-gray-700'
                                                    : 'border-gray-700 hover:border-gray-600 bg-gray-800'
                                            }`}
                                            onClick={() => handleVoiceSelect(voice)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <p className="text-white font-medium text-sm">{voice.name}</p>
                                                    <p className="text-gray-400 text-xs">{voice.category}</p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        playAudio(voice.preview_url, voice.voice_id);
                                                    }}
                                                    className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                                                >
                                                    <Volume2 className="w-4 h-4 text-white" />
                                                </button>
                                                <audio id={`audio-${voice.voice_id}`} src={voice.preview_url} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="mt-6 flex justify-end gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedVoice}
                            className="px-6 py-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-purple-600 hover:opacity-90 rounded-lg text-white font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AvatarModal;
