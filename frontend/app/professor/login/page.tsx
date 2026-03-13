"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import PageTransition from "@/components/PageTransition";

export default function ProfessorLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      if (data.user.role !== "professor") {
        setError("This login is for professors only. Please use the student login.");
        setLoading(false);
        return;
      }

      login(data.token, data.user);
      router.push("/professor/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <PageTransition className="min-h-[calc(100vh-57px)] flex items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-serif text-2xl text-primary">Professor Portal</CardTitle>
          <CardDescription>Sign in to manage your lab applications</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="prof-email">Email</Label>
              <Input
                id="prof-email"
                type="email"
                placeholder="you@mail.utoronto.ca"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prof-password">Password</Label>
              <Input
                id="prof-password"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/professor/register" className="text-primary font-medium hover:underline">
              Register
            </Link>
          </div>
          <div className="mt-2 text-center text-sm text-gray-400">
            <Link href="/login" className="hover:underline">
              Student login
            </Link>
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
