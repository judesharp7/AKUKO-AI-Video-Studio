"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Film, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { ErrorBanner } from "@/components/studio/StateFeedback";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.userMessage || "Could not sign in.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0B10] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#26262F] bg-[#15151C] p-8 space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl studio-gradient">
            <Film className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Welcome to AKUKO</h1>
            <p className="text-xs text-[#A1A1AA]">Sign in or create your studio account</p>
          </div>
        </div>

        {error && <ErrorBanner message={error} />}

        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#26262F] bg-[#0B0B10] px-4 py-3 text-sm font-medium text-white hover:border-[#7C5CFF] transition"
        >
          Continue with Google (Studio Demo)
        </button>

        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-[#26262F]" />
          <span className="mx-3 text-xs text-[#A1A1AA]">or with email</span>
          <div className="flex-grow border-t border-[#26262F]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Amara Okafor"
              className="w-full rounded-xl border border-[#26262F] bg-[#0B0B10] px-3.5 py-2.5 text-sm text-white placeholder-[#A1A1AA]/50 focus:border-[#7C5CFF] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#A1A1AA]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@studio.com"
                className="w-full rounded-xl border border-[#26262F] bg-[#0B0B10] pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-[#A1A1AA]/50 focus:border-[#7C5CFF] focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-[#26262F] bg-[#0B0B10] px-3.5 py-2.5 text-sm text-white placeholder-[#A1A1AA]/50 focus:border-[#7C5CFF] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[#26262F] bg-[#0B0B10] px-3 py-2 text-xs text-[#A1A1AA]">
            <ShieldCheck className="h-4 w-4 text-[#22C55E]" />
            Protected against disposable emails &amp; automated abuse
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl studio-gradient px-5 py-3 text-sm font-semibold text-white hover:opacity-95 transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Enter Studio"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="text-center text-xs text-[#A1A1AA]">
          <Link href="/" className="hover:text-white underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

