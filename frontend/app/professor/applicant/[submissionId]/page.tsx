"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import ProtectedRoute from "@/components/ProtectedRoute";
import PageTransition from "@/components/PageTransition";
import VideoPlayer from "@/components/VideoPlayer";
import { ArrowLeft, GraduationCap, Mail, BookOpen, Calendar, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import type { Submission } from "@/types";

function statusVariant(status: string) {
  switch (status) {
    case "shortlisted":
      return "success" as const;
    case "rejected":
      return "destructive" as const;
    default:
      return "warning" as const;
  }
}

function ApplicantContent({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = use(params);
  const { token } = useAuth();
  const router = useRouter();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch("/api/professor/submissions", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const found = (data as Submission[]).find(
          (s) => String(s.id) === submissionId
        );
        setSubmission(found || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token, submissionId]);

  async function updateStatus(status: string) {
    if (!token) return;
    setUpdating(true);

    try {
      await fetch(`/api/professor/submissions/${submissionId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      setSubmission((prev) => (prev ? { ...prev, status: status as Submission["status"] } : prev));
    } catch {
      alert("Failed to update status");
    }

    setUpdating(false);
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-57px)] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-[calc(100vh-57px)] flex items-center justify-center text-gray-400">
        Applicant not found
      </div>
    );
  }

  return (
    <PageTransition className="max-w-3xl mx-auto px-6 py-10">
      <button
        onClick={() => router.push("/professor/dashboard")}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-2xl text-primary">
                {submission.studentName || "Student"}
              </h1>
              <p className="text-gray-400 text-sm">{submission.labName}</p>
            </div>
          </div>
          <Badge variant={statusVariant(submission.status)} className="text-sm px-3 py-1">
            {submission.status}
          </Badge>
        </div>

        {/* Student Info */}
        <div className="grid sm:grid-cols-2 gap-4">
          {submission.studentEmail && (
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm font-medium">{submission.studentEmail}</p>
                </div>
              </CardContent>
            </Card>
          )}
          {submission.studentProgram && (
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-gray-400">Program</p>
                  <p className="text-sm font-medium">
                    {submission.studentProgram}, Year {submission.studentYear}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-gray-400">Applied</p>
                <p className="text-sm font-medium">
                  {new Date(submission.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interests */}
        {submission.studentInterests && (
          <div>
            <h2 className="font-semibold text-lg mb-2">Research Interests</h2>
            <p className="text-gray-600 bg-gray-50 rounded-xl p-4 text-sm leading-relaxed">
              {submission.studentInterests}
            </p>
          </div>
        )}

        {/* Video */}
        <div>
          <h2 className="font-semibold text-lg mb-3">Introduction Video</h2>
          <VideoPlayer src={submission.videoUrl} />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => updateStatus("shortlisted")}
            disabled={updating || submission.status === "shortlisted"}
          >
            <CheckCircle className="w-4 h-4" />
            Shortlist
          </Button>
          <Button
            variant="destructive"
            className="flex-1 gap-2"
            onClick={() => updateStatus("rejected")}
            disabled={updating || submission.status === "rejected"}
          >
            <XCircle className="w-4 h-4" />
            Reject
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => setShowMessage(!showMessage)}
          >
            <MessageSquare className="w-4 h-4" />
            Message
          </Button>
        </div>

        {/* Message (optional) */}
        {showMessage && (
          <div className="space-y-3">
            <Textarea
              placeholder={`Write a message to ${submission.studentName || "the student"}...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowMessage(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (submission.studentEmail && message) {
                    window.location.href = `mailto:${submission.studentEmail}?subject=Re: Your application to ${submission.labName}&body=${encodeURIComponent(message)}`;
                  }
                  setShowMessage(false);
                }}
                disabled={!message.trim()}
              >
                Send via Email
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

export default function ApplicantPage({ params }: { params: Promise<{ submissionId: string }> }) {
  return (
    <ProtectedRoute requiredRole="professor">
      <ApplicantContent params={params} />
    </ProtectedRoute>
  );
}
