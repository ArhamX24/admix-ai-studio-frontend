"use client";
import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { Textarea } from "@/Components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    ArrowUpIcon,
    SquareUser,
    ChevronDown,
    Clock,
    Download,
    Loader2,
    AlertCircle,
    CheckCircle2
} from "lucide-react";
import { Link } from "react-router";
import { useSelector } from "react-redux";
import type { RootState } from "../../Store/store";
import { useVideoGeneration } from "../../hooks/useVideoGeneration";

interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({
    minHeight,
    maxHeight,
}: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            textarea.style.height = `${minHeight}px`;
            const newHeight = Math.max(
                minHeight,
                Math.min(
                    textarea.scrollHeight,
                    maxHeight ?? Number.POSITIVE_INFINITY
                )
            );
            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
        }
    }, [minHeight]);

    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

function useRotatingText(texts: string[], interval: number = 2000) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % texts.length);
        }, interval);

        return () => clearInterval(timer);
    }, [texts.length, interval]);

    return texts[index];
}

const VideoAgent = () => {
    const [value, setValue] = useState("");
    const [duration, setDuration] = useState("Auto");
    const [isDurationDropdownOpen, setIsDurationDropdownOpen] = useState(false);
    
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Get avatar data from Redux store
    const tempAvatarName = useSelector((state: RootState) => state.modal.avatarName);
    const avatarImage = useSelector((state: RootState) => state.modal.avatarImage);
    const voiceName = useSelector((state: RootState) => state.modal.voiceName);
    const avatarId = useSelector((state: RootState) => state.modal.avatarId);
    const voiceId = useSelector((state: RootState) => state.modal.voiceId);

    // Use custom video generation hook
    const {
        isGenerating,
        videoStatus,
        videoData,
        error,
        generateVideo,
        downloadVideo,
    } = useVideoGeneration();

    const avatarName = tempAvatarName ? tempAvatarName.split(" ")[0] : "";

    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 60,
        maxHeight: 200,
    });

    const rotatingTexts = useMemo(
        () => ["Ad", "Customer Testimonial", "Product Demo"],
        []
    );
    const currentText = useRotatingText(rotatingTexts, 2000);

    const durationOptions = ["Auto", "15s", "30s", "60s"];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDurationDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleGenerateVideo = async () => {
        try {
            await generateVideo({
                avatarId,
                voiceId,
                script: value,
                duration, // Send as-is: "Auto", "15s", "30s", "60s"
                userId: "e9ebea72-dc16-4553-8dd6-39ee62cbf857", 
            });
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) {
                handleGenerateVideo();
            }
        }
    };

    const handleDurationSelect = (option: string) => {
        setDuration(option);
        setIsDurationDropdownOpen(false);
    };

    return (
        <div className="flex flex-col items-center justify-center bg-transparent min-h-screen p-4">
            <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <h1 className="text-4xl font-bold text-black dark:text-white">
                    What You Want To Create{" "}
                    <span
                        key={currentText}
                        className="inline-block text-blue-500 animate-fade-in"
                    >
                        {currentText}
                    </span>
                </h1>

                {/* Video Display Section */}
                {(isGenerating || videoData || error) && (
                    <div className="w-full bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-4">
                        {isGenerating && (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                                <p className="text-white text-lg font-medium">
                                    {videoStatus === "pending" && "Initializing video generation..."}
                                    {videoStatus === "processing" && "Generating your video..."}
                                </p>
                                <p className="text-gray-400 text-sm">
                                    This may take a few minutes
                                </p>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-800 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                <p className="text-red-400">{error}</p>
                            </div>
                        )}

                        {videoData && !isGenerating && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-4 bg-green-900/20 border border-green-800 rounded-lg">
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    <p className="text-green-400">Video generated successfully!</p>
                                </div>

                                {/* Video Player */}
                                <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                                    <video
                                        src={videoData.videoUrl}
                                        controls
                                        className="w-full h-full"
                                        poster={videoData.thumbnailUrl}
                                    >
                                        Your browser does not support video playback.
                                    </video>
                                </div>

                                {/* Video Info */}
                                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg">
                                    <div>
                                        <p className="text-gray-400 text-sm">Avatar</p>
                                        <p className="text-white font-medium">{videoData.avatarName}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm">Voice</p>
                                        <p className="text-white font-medium">{videoData.voiceName}</p>
                                    </div>
                                    {videoData.videoDuration && (
                                        <div>
                                            <p className="text-gray-400 text-sm">Duration</p>
                                            <p className="text-white font-medium">
                                                {videoData.videoDuration.toFixed(1)}s
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-gray-400 text-sm">Created</p>
                                        <p className="text-white font-medium">
                                            {new Date(videoData.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                
                            </div>
                        )}
                    </div>
                )}

                {/* Input Section */}
                <div className="w-full">
                    <div className="relative rounded-xl border border-neutral-800 bg-transparent">
                        <div className="overflow-y-auto">
                            <Textarea
                                ref={textareaRef}
                                value={value}
                                onChange={(e) => {
                                    setValue(e.target.value);
                                    adjustHeight();
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder="Paste Script..."
                                disabled={isGenerating}
                                className={cn(
                                    "w-full px-4 py-3",
                                    "resize-none bg-transparent border-none",
                                    "text-white text-sm",
                                    "focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                                    "placeholder:text-neutral-500 placeholder:text-sm",
                                    "min-h-[60px]",
                                    "disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                                style={{ overflow: "hidden" }}
                            />
                        </div>

                        {/* Bottom Controls */}
                        <div className="flex items-center justify-between p-3">
                            <div className="flex items-center gap-3">
                                {/* Select Avatar Button */}
                                <Link to={"/select-avatar"}>
                                    <button
                                        type="button"
                                        disabled={isGenerating}
                                        className="flex items-center gap-3 px-3 py-1.5 bg-neutral-900/50 hover:bg-neutral-800 rounded-md border border-neutral-700/50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="w-8 h-8 rounded-md overflow-hidden flex items-center justify-center bg-neutral-800 flex-shrink-0">
                                            {avatarImage ? (
                                                <img
                                                    src={avatarImage}
                                                    alt={avatarName || "Avatar"}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <SquareUser className="w-5 h-5 text-neutral-400" />
                                            )}
                                        </div>

                                        <div className="flex flex-col items-start">
                                            <span className="text-xs font-medium text-white leading-tight">
                                                {avatarName || "Select Avatar"}
                                            </span>
                                            <span className="text-[10px] text-neutral-400 leading-tight">
                                                {voiceName || "Speaker"}
                                            </span>
                                        </div>
                                    </button>
                                </Link>

                                {/* Duration Dropdown */}
                                {/* <div className="relative" ref={dropdownRef}>
                                    <button
                                        type="button"
                                        onClick={() => setIsDurationDropdownOpen(!isDurationDropdownOpen)}
                                        disabled={isGenerating}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900/50 hover:bg-neutral-800 rounded-md border border-neutral-700/50 transition-colors cursor-pointer min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Clock className="w-4 h-4 text-neutral-400" />
                                        <span className="text-xs font-medium text-white flex-1">
                                            {duration}
                                        </span>
                                        <ChevronDown
                                            className={cn(
                                                "w-4 h-4 text-neutral-400 transition-transform",
                                                isDurationDropdownOpen && "rotate-180"
                                            )}
                                        />
                                    </button>

                                    {isDurationDropdownOpen && (
                                        <div className="absolute top-full left-0 mt-2 w-full bg-neutral-900 border border-neutral-700 rounded-md shadow-lg z-50 overflow-hidden">
                                            {durationOptions.map((option) => (
                                                <button
                                                    key={option}
                                                    onClick={() => handleDurationSelect(option)}
                                                    className={cn(
                                                        "w-full px-3 py-2 text-left text-xs font-medium transition-colors",
                                                        duration === option
                                                            ? "bg-neutral-800 text-white"
                                                            : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                                                    )}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div> */}
                            </div>

                            {/* Send Button */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleGenerateVideo}
                                    disabled={!value.trim() || isGenerating}
                                    className={cn(
                                        "px-1.5 py-1.5 rounded-lg text-sm transition-colors border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800 flex items-center justify-between gap-1",
                                        value.trim() && !isGenerating
                                            ? "bg-white text-black"
                                            : "text-zinc-400",
                                        "disabled:opacity-50 disabled:cursor-not-allowed"
                                    )}
                                >
                                    {isGenerating ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <ArrowUpIcon
                                            className={cn(
                                                "w-4 h-4",
                                                value.trim() ? "text-black" : "text-zinc-400"
                                            )}
                                        />
                                    )}
                                    <span className="sr-only">Generate Video</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-3 mt-4">
                        <ActionButton label="Social Media Content" />
                        <ActionButton label="Create an ad" />
                        <ActionButton label="Product Demo" />
                        <ActionButton label="Wishing Video" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoAgent;

interface ActionButtonProps {
    label: string;
}

function ActionButton({ label }: ActionButtonProps) {
    return (
        <button
            type="button"
            className="flex z-10 items-center cursor-pointer gap-2 px-4 py-2 bg-transparent hover:bg-neutral-800/65 rounded-full border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
        >
            <span className="text-xs">{label}</span>
        </button>
    );
}