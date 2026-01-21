import { useEffect, useRef, useCallback, useState } from "react";
import { Textarea } from "./textarea";
import { cn } from "@/lib/utils";
import axios from "axios";
import {
    ArrowLeftIcon,
    Loader2,
    Hash,
    FileText,
    Type,
    Tag,
} from "lucide-react";


interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    isLoading?: boolean;
}

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

// Auto-scroll hook
function useChatScroll(dep: any) {
    const ref = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (ref.current) {
            ref.current.scrollTop = ref.current.scrollHeight;
        }
    }, [dep]);
    
    return ref;
}

// Animated rotating text hook
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

export function VercelV0Chat() {
    const [value, setValue] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 60,
        maxHeight: 200,
    });
    
    const chatContainerRef = useChatScroll(messages);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Rotating text for heading
    const rotatingTexts = ["for you", "SEO Title", "Hashtags", "Good Description"];
    const currentText = useRotatingText(rotatingTexts, 2000);

    // Poll for results
    const pollForResult = async (runId: string, messageId: string) => {
        let attempts = 0;
        const maxAttempts = 60;

        pollingIntervalRef.current = setInterval(async () => {
            attempts++;
            
            try {
                const response = await axios.get(
                    `http://localhost:8080/api/v1/agent/generated-result/${runId}`
                );

                if (response.data.success && response.data.status === "completed") {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === messageId
                                ? { ...msg, content: response.data.result, isLoading: false }
                                : msg
                        )
                    );

                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                        pollingIntervalRef.current = null;
                    }
                } else if (attempts >= maxAttempts) {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === messageId
                                ? {
                                      ...msg,
                                      content: "Request timed out. Please try again.",
                                      isLoading: false,
                                  }
                                : msg
                        )
                    );

                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                        pollingIntervalRef.current = null;
                    }
                }
            } catch (error) {
                console.error("Polling error:", error);
                
                if (attempts >= maxAttempts) {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === messageId
                                ? {
                                      ...msg,
                                      content: "An error occurred. Please try again.",
                                      isLoading: false,
                                  }
                                : msg
                        )
                    );

                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                        pollingIntervalRef.current = null;
                    }
                }
            }
        }, 2000);
    };

    const handleSubmit = async (quickAction: string | null = null) => {
        if (!value.trim() || isSubmitting) return;

        const userMessage = value.trim();
        setValue("");
        adjustHeight(true);
        setIsSubmitting(true);

        // Add user message
        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: userMessage,
        };

        setMessages((prev) => [...prev, userMsg]);

        // Add loading assistant message
        const assistantMsgId = (Date.now() + 1).toString();
        const assistantMsg: Message = {
            id: assistantMsgId,
            role: "assistant",
            content: "Processing your request...",
            isLoading: true,
        };

        setMessages((prev) => [...prev, assistantMsg]);

        try {
            // Send to backend
            const response = await axios.post(
                "http://localhost:8080/api/v1/agent/generated-content",
                {
                    userMessage: userMessage,
                    quickAction: quickAction,
                }
            );

            if (response.data.success) {
                const { runId } = response.data;
                pollForResult(runId, assistantMsgId);
            } else {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === assistantMsgId
                            ? {
                                  ...msg,
                                  content: "Failed to process request. Please try again.",
                                  isLoading: false,
                              }
                            : msg
                    )
                );
            }
        } catch (error) {
            console.error("Submit error:", error);
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === assistantMsgId
                        ? {
                              ...msg,
                              content: "An error occurred. Please try again.",
                              isLoading: false,
                          }
                        : msg
                )
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(null);
        }
    };

    const handleQuickAction = (action: string) => {
        if (!value.trim() || isSubmitting) return;
        handleSubmit(action);
    };

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []);

    const hasText = value.trim().length > 0;

    return (
        <div className="flex flex-col h-screen w-full max-w-4xl mx-auto">
            {/* Header */}
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center flex-1 p-4">
                    <h1 className="text-4xl font-bold text-black dark:text-white">
                        What can I generate{" "}
                        <span 
                            key={currentText}
                            className="inline-block text-blue-500 animate-fade-in"
                        >
                            {currentText}
                        </span>
                    </h1>
                </div>
            )}

            {/* Chat Messages */}
            {messages.length > 0 && (
                <div
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 chat-scrollbar"
                >
                    {messages.map((message) => (
                        <ChatMessage key={message.id} message={message} />
                    ))}
                </div>
            )}


            {/* Input Area - Always at bottom */}
            <div className="p-4 border-t border-neutral-800">
                <div className="relative bg-neutral-950/30 rounded-xl border border-neutral-800">
                    <div className="overflow-y-auto">
                        <Textarea
                            ref={textareaRef}
                            value={value}
                            onChange={(e) => {
                                setValue(e.target.value);
                                adjustHeight();
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask a question..."
                            disabled={isSubmitting}
                            className={cn(
                                "w-full px-4 py-3",
                                "resize-none",
                                "bg-transparent",
                                "border-none",
                                "text-white text-sm",
                                "focus:outline-none",
                                "focus-visible:ring-0 focus-visible:ring-offset-0",
                                "placeholder:text-neutral-500 placeholder:text-sm",
                                "min-h-[60px]",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                            style={{
                                overflow: "hidden",
                            }}
                        />
                    </div>

                    <div className="flex items-center justify-end p-3">
                        <button
                            type="button"
                            onClick={() => handleSubmit(null)}
                            disabled={!value.trim() || isSubmitting}
                            className={cn(
                                "px-1.5 py-1.5 rounded-lg text-sm transition-colors border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800 flex items-center justify-between gap-1",
                                value.trim() && !isSubmitting
                                    ? "bg-white text-black hover:bg-gray-200"
                                    : "text-zinc-400 cursor-not-allowed"
                            )}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <ArrowLeftIcon
                                    className={cn(
                                        "w-4 h-4",
                                        value.trim()
                                            ? "text-black"
                                            : "text-zinc-400"
                                    )}
                                />
                            )}
                            <span className="sr-only">Send</span>
                        </button>
                    </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                    <QuickActionButton
                        icon={<Type className="w-4 h-4" />}
                        label="SEO Title"
                        onClick={() => handleQuickAction("title")}
                        disabled={!hasText || isSubmitting}
                    />
                    <QuickActionButton
                        icon={<FileText className="w-4 h-4" />}
                        label="Description"
                        onClick={() => handleQuickAction("description")}
                        disabled={!hasText || isSubmitting}
                    />
                    <QuickActionButton
                        icon={<Hash className="w-4 h-4" />}
                        label="Hashtags"
                        onClick={() => handleQuickAction("hashtags")}
                        disabled={!hasText || isSubmitting}
                    />
                    <QuickActionButton
                        icon={<Tag className="w-4 h-4" />}
                        label="Tags"
                        onClick={() => handleQuickAction("tags")}
                        disabled={!hasText || isSubmitting}
                    />
                </div>
            </div>
        </div>
    );
}

interface ChatMessageProps {
    message: Message;
}

function ChatMessage({ message }: ChatMessageProps) {
    return (
        <div
            className={cn(
                "flex gap-3 p-4 rounded-lg",
                message.role === "user"
                    ? "bg-neutral-800 ml-auto max-w-[80%]"
                    : "bg-neutral-900 mr-auto max-w-[80%]"
            )}
        >
            <div className="flex-shrink-0">
                <div
                    className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                        message.role === "user"
                            ? "bg-blue-500 text-white"
                            : "bg-purple-500 text-white"
                    )}
                >
                    {message.role === "user" ? "U" : "AI"}
                </div>
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white">
                        {message.role === "user" ? "You" : "Assistant"}
                    </span>
                </div>
                <div className="text-sm text-gray-300 whitespace-pre-wrap break-words">
                    {message.isLoading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{message.content}</span>
                        </div>
                    ) : (
                        message.content
                    )}
                </div>
            </div>
        </div>
    );
}

interface QuickActionButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled: boolean;
}

function QuickActionButton({ icon, label, onClick, disabled }: QuickActionButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full border text-xs transition-colors",
                disabled
                    ? "bg-neutral-900 border-neutral-800 text-neutral-600 cursor-not-allowed opacity-50"
                    : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white hover:border-neutral-700"
            )}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}
