"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Video, Upload, Square, Circle, RotateCcw } from "lucide-react";

interface VideoRecorderProps {
  onVideoReady: (blob: Blob) => void;
  maxDuration?: number;
}

export default function VideoRecorder({ onVideoReady, maxDuration = 60 }: VideoRecorderProps) {
  const [mode, setMode] = useState<"idle" | "recording" | "preview">("idle");
  const [timeLeft, setTimeLeft] = useState(maxDuration);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      alert("Please allow camera and microphone access to record a video.");
    }
  };

  const startRecording = async () => {
    // Switch to recording mode first so the <video> element is in the DOM
    setMode("recording");
    chunksRef.current = [];
    setTimeLeft(maxDuration);

    // Wait a tick for React to render the video element
    await new Promise((r) => setTimeout(r, 100));

    await startCamera();

    const stream = streamRef.current;
    if (!stream) return;

    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setMode("preview");
      onVideoReady(blob);
      cleanup();
    };

    recorder.start(1000);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          recorder.stop();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const reset = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setMode("idle");
    setTimeLeft(maxDuration);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setMode("preview");
    onVideoReady(file);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {mode === "idle" && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
            <Video className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">
              Record a quick introduction video (max {maxDuration} seconds)
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={startRecording} className="gap-2">
                <Circle className="w-4 h-4" />
                Record Video
              </Button>
              <label>
                <Button variant="outline" className="gap-2 cursor-pointer" asChild>
                  <span>
                    <Upload className="w-4 h-4" />
                    Upload Video
                  </span>
                </Button>
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {mode === "recording" && (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full aspect-video object-cover"
            />
            <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full" />
              {formatTime(timeLeft)}
            </div>
          </div>
          <Button onClick={stopRecording} variant="destructive" className="w-full gap-2">
            <Square className="w-4 h-4" />
            Stop Recording
          </Button>
        </div>
      )}

      {mode === "preview" && videoUrl && (
        <div className="space-y-3">
          <div className="rounded-xl overflow-hidden bg-black">
            <video
              ref={previewRef}
              src={videoUrl}
              controls
              className="w-full aspect-video object-cover"
            />
          </div>
          <Button onClick={reset} variant="outline" className="w-full gap-2">
            <RotateCcw className="w-4 h-4" />
            Re-record
          </Button>
        </div>
      )}
    </div>
  );
}
