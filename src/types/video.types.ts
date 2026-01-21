// types/video.types.ts

export interface VideoStatus {
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED"
}


export interface VideoData {
    id: string;
    userId: string;
    status: VideoStatus;
    avatarId: string;
    avatarName: string;
    avatarImage: string;
    voiceId: string;
    voiceName: string;
    script: string;
    duration: string;
    language: string;
    heygenVideoId?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    videoDuration?: number;
    errorMessage?: string;
    deleteAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateVideoRequest {
    avatarId: string;
    voiceId: string;
    script: string;
    duration: string; // "Auto", "15s", "30s", "60s", etc.
    userId: string;
}

export interface CreateVideoResponse {
    result: boolean;
    message: string;
    eventId: string;
    status: string;
}

export interface VideoStatusRequest {
    videoId: string;
}

export interface VideoStatusResponse {
    result: boolean;
    status: string;
    video: VideoData;
}

export interface GetUserVideosResponse {
    result: boolean;
    videos: VideoData[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface DeleteVideoRequest {
    videoId: string;
    userId: string;
}

export interface DeleteVideoResponse {
    result: boolean;
    message: string;
    deletedId: string;
}

// Avatar types
export interface Avatar {
    avatar_id: string;
    avatar_name: string;
    gender: string;
    preview_image_url: string;
    preview_video_url: string;
    premium: boolean;
}

export interface FetchAvatarsResponse {
    result: boolean;
    data: Avatar[];
}

// Voice types
export interface Voice {
    voice_id: string;
    name: string;
    preview_url: string;
    description: string;
    category: string;
}

export interface FetchVoicesResponse {
    result: boolean;
    data: Voice[];
}

// Error types
export interface ApiError {
    result: false;
    error: string;
}