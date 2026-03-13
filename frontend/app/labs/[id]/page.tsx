"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import PageTransition from "@/components/PageTransition";
import VideoRecorder from "@/components/VideoRecorder";
import { FlaskConical, User, Mail, BookOpen, ArrowLeft, Video } from "lucide-react";
import type { Lab } from "@/types";

export default function LabDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, token } = useAuth();
  const router = useRouter();
  const [lab, setLab] = useState<Lab | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/labs/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setLab(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleSubmit() {
    if (!user || !token) {
      router.push("/login");
      return;
    }

    setSubmitting(true);
    let videoUrl = "";

    // Upload video if recorded
    if (videoBlob) {
      const formData = new FormData();
      formData.append("video", videoBlob, "introduction.webm");
      try {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        videoUrl = uploadData.videoUrl || "";
      } catch (err) {
        console.error("Video upload failed:", err);
      }
    }

    // Create submission via API Gateway
    const apiBase = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "";
    const submissionsUrl = apiBase ? `${apiBase.replace(/\/$/, "")}/submissions` : "/api/submissions";

    try {
      const res = await fetch(submissionsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ labId: id, videoUrl }),
      });

      if (res.ok) {
        setSubmitted(true);
        setShowModal(false);
      } else {
        const data = await res.json();
        alert(data.error || "Submission failed");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    }

    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-57px)] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="min-h-[calc(100vh-57px)] flex items-center justify-center text-gray-400">
        Lab not found
      </div>
    );
  }

  return (
    <PageTransition className="max-w-3xl mx-auto px-6 py-10">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <FlaskConical className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-3xl text-primary">{lab.labName}</h1>
              <p className="text-gray-400 mt-1">{lab.department}</p>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="grid sm:grid-cols-2 gap-4">
          {lab.professorName && (
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
              <User className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-gray-400">Professor</p>
                <p className="font-medium text-sm">{lab.professorName}</p>
              </div>
            </div>
          )}
          {lab.professorEmail && (
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-gray-400">Contact</p>
                <p className="font-medium text-sm">{lab.professorEmail}</p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-lg">About</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">{lab.description}</p>
        </div>

        {/* Topics */}
        <div>
          <h2 className="font-semibold text-lg mb-3">Research Topics</h2>
          <div className="flex flex-wrap gap-2">
            {lab.topics.split(",").map((t) => (
              <Badge key={t} variant="secondary" className="px-3 py-1">
                {t.trim()}
              </Badge>
            ))}
          </div>
        </div>

        {/* CTA */}
        {submitted ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
            <p className="text-emerald-700 font-medium">Your interest has been submitted!</p>
            <p className="text-sm text-emerald-600 mt-1">
              You can track your submission on your dashboard.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/dashboard")}
            >
              View Dashboard
            </Button>
          </div>
        ) : (
          <Button
            size="lg"
            className="w-full gap-2 py-6 text-base"
            onClick={() => {
              if (!user) {
                router.push("/login");
                return;
              }
              setShowModal(true);
            }}
          >
            <Video className="w-5 h-5" />
            Express Interest
          </Button>
        )}
      </div>

      {/* Video Recording Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record a quick introduction video</DialogTitle>
            <DialogDescription>
              Introduce yourself to {lab.professorName || "the lab"}. Tell them about your interests and why you want to join. Max 60 seconds.
            </DialogDescription>
          </DialogHeader>
          <VideoRecorder onVideoReady={(blob) => setVideoBlob(blob)} />
          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setVideoBlob(null);
                handleSubmit();
              }}
              disabled={submitting}
            >
              Skip Video
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={submitting || !videoBlob}
            >
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
