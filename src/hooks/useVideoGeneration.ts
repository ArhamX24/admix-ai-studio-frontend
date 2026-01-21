// hooks/useVideoGeneration.ts
import { useState, useEffect, useRef, useCallback } from "react";
import { videoApiService } from "../services/videoApi.service";
import type { VideoData, CreateVideoRequest } from "../types/video.types";

interface UseVideoGenerationResult {
    // State
    isGenerating: boolean;
    videoStatus: string;
    videoData: VideoData | null;
    error: string | null;
    currentVideoId: string | null;

    // Actions
    generateVideo: (request: CreateVideoRequest) => Promise<void>;
    resetState: () => void;
    downloadVideo: () => void;
}

export const useVideoGeneration = (): UseVideoGenerationResult => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
    const [videoStatus, setVideoStatus] = useState<string>("idle");
    const [videoData, setVideoData] = useState<VideoData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const pollingIntervalRef = useRef<number | null>(null);

    // Polling for video status
    useEffect(() => {
        if (currentVideoId && isGenerating) {
            pollingIntervalRef.current = setInterval(async () => {
                try {
                    const response = await videoApiService.checkVideoStatus({
                        videoId: currentVideoId
                    });

                    if (response.result) {
                        const status = response.status.toLowerCase();
                        setVideoStatus(status);

                        if (status === "completed") {
                            setVideoData(response.video);
                            setIsGenerating(false);
                            if (pollingIntervalRef.current) {
                                clearInterval(pollingIntervalRef.current);
                            }
                        } else if (status === "failed") {
                            setError(
                                response.video.errorMessage || "Video generation failed"
                            );
                            setIsGenerating(false);
                            if (pollingIntervalRef.current) {
                                clearInterval(pollingIntervalRef.current);
                            }
                        }
                    }
                } catch (err: any) {

                    setError(err.message || "Failed to check video status");
                    setIsGenerating(false);
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                    }
                }
            }, 5000); // Check every 5 seconds
        }

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [currentVideoId, isGenerating]);

    const generateVideo = useCallback(
        async (request: CreateVideoRequest) => {
            if (!request.script.trim()) {
                throw new Error("Please enter a script");
            }

            if (!request.avatarId || !request.voiceId) {
                throw new Error("Please select an avatar and voice");
            }

            setIsGenerating(true);
            setError(null);
            setVideoStatus("pending");
            setVideoData(null);

            try {
                const response = await videoApiService.createVideo(request);

                if (response.result) {
                    // Fetch the latest video to get the ID
                    setTimeout(async () => {
                        try {
                            const historyResponse =
                                await videoApiService.getUserVideos(
                                    request.userId,
                                    1,
                                    1
                                );
                            if (
                                historyResponse.result &&
                                historyResponse.videos.length > 0
                            ) {
                                setCurrentVideoId(historyResponse.videos[0].id);
                            }
                        } catch (err: any) {

                            setError(err.message);
                        }
                    }, 2000);
                }
            } catch (err: any) {

                setError(err.message || "Failed to generate video");
                setIsGenerating(false);
            }
        },
        []
    );

    const resetState = useCallback(() => {
        setIsGenerating(false);
        setCurrentVideoId(null);
        setVideoStatus("idle");
        setVideoData(null);
        setError(null);
        
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }
    }, []);

    const downloadVideo = useCallback(() => {
        if (videoData?.videoUrl) {
            window.open(videoData.videoUrl, "_blank");
        }
    }, [videoData]);

    return {
        // State
        isGenerating,
        videoStatus,
        videoData,
        error,
        currentVideoId,

        // Actions
        generateVideo,
        resetState,
        downloadVideo,
    };
};

export default useVideoGeneration;