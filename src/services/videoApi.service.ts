// services/videoApi.service.ts
import axios from "axios";
import type {
    CreateVideoRequest,
    CreateVideoResponse,
    VideoStatusRequest,
    VideoStatusResponse,
    GetUserVideosResponse,
    DeleteVideoRequest,
    DeleteVideoResponse,
    FetchAvatarsResponse,
    FetchVoicesResponse
} from "../types/video.types";
import { baseURL } from "@/Utils/URL";

const API_BASE_URL = `${baseURL}/api/v1`;

class VideoApiService {
    /**
     * Fetch available avatars from HeyGen
     */
    async fetchAvatars(): Promise<FetchAvatarsResponse> {
        try {
            const response = await axios.get(`${API_BASE_URL}/video/fetch-avatars`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || "Failed to fetch avatars");
        }
    }

    /**
     * Fetch available voices from ElevenLabs
     */
    async fetchVoices(): Promise<FetchVoicesResponse> {
        try {
            const response = await axios.get(`${API_BASE_URL}/video/fetch-voices`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || "Failed to fetch voices");
        }
    }

    /**
     * Create a new video generation request
     */
    async createVideo(data: CreateVideoRequest): Promise<CreateVideoResponse> {
        try {
            const response = await axios.post(`${API_BASE_URL}/video/create`, data);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || "Failed to create video");
        }
    }

    /**
     * Check the status of a video generation
     */
    async checkVideoStatus(data: VideoStatusRequest): Promise<VideoStatusResponse> {
        try {
            const response = await axios.post(`${API_BASE_URL}/video/status`, data);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || "Failed to check video status");
        }
    }

    /**
     * Get all videos for a user with pagination
     */
    async getUserVideos(
        userId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<GetUserVideosResponse> {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/video/history/${userId}?page=${page}&limit=${limit}`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || "Failed to fetch user videos");
        }
    }

    /**
     * Delete a video
     */
    async deleteVideo(data: DeleteVideoRequest): Promise<DeleteVideoResponse> {
        try {
            const response = await axios.post(`${API_BASE_URL}/video/delete`, data);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || "Failed to delete video");
        }
    }

    /**
     * Poll video status until completion or failure
     * @param videoId - The video ID to poll
     * @param onStatusChange - Callback function called on each status change
     * @param interval - Polling interval in milliseconds (default: 5000)
     * @param maxAttempts - Maximum number of polling attempts (default: 120)
     * @returns Promise that resolves when video is completed or fails
     */
    async pollVideoStatus(
        videoId: string,
        onStatusChange?: (status: string) => void,
        interval: number = 5000,
        maxAttempts: number = 120
    ): Promise<VideoStatusResponse> {
        let attempts = 0;

        return new Promise((resolve, reject) => {
            const pollInterval = setInterval(async () => {
                try {
                    attempts++;
                    
                    const response = await this.checkVideoStatus({ videoId });
                    const status = response.status.toLowerCase();
                    
                    if (onStatusChange) {
                        onStatusChange(status);
                    }

                    if (status === "completed") {
                        clearInterval(pollInterval);
                        resolve(response);
                    } else if (status === "failed") {
                        clearInterval(pollInterval);
                        reject(new Error(response.video.errorMessage || "Video generation failed"));
                    } else if (attempts >= maxAttempts) {
                        clearInterval(pollInterval);
                        reject(new Error("Video generation timeout"));
                    }
                } catch (error: any) {
                    clearInterval(pollInterval);
                    reject(error);
                }
            }, interval);
        });
    }
}

// Export singleton instance
export const videoApiService = new VideoApiService();

// Export class for testing
export default VideoApiService;