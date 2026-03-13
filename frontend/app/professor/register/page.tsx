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

export default function ProfessorRegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    labName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role: "professor" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
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
          <CardTitle className="font-serif text-2xl text-primary">Professor Registration</CardTitle>
          <CardDescription>Create your Atryn professor account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Dr. Jane Smith"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@mail.utoronto.ca"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                placeholder="e.g. Computer Science"
                value={form.department}
                onChange={(e) => update("department", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="labName">Lab Name</Label>
              <Input
                id="labName"
                placeholder="e.g. Machine Intelligence Lab"
                value={form.labName}
                onChange={(e) => update("labName", e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/professor/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </div>
          <div className="mt-2 text-center text-sm text-gray-400">
            <Link href="/register" className="hover:underline">
              Student registration
            </Link>
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
