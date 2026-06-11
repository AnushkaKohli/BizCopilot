"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  FileText,
  Zap,
  Shield,
  MessageSquare,
  ChevronRight,
  Loader2,
} from "lucide-react";

export default function LoginPage() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setIsGoogleLoading(false);
    }
  }

  async function handleDemoLogin() {
    setIsDemoLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Demo login failed");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo login failed");
      setIsDemoLoading(false);
    }
  }

  const features = [
    {
      icon: <FileText className="w-5 h-5" />,
      title: "Instant Document Analysis",
      desc: "Upload any business doc and get a summary, key info, and action items in seconds.",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Risk Detection",
      desc: "Automatically flags risks with severity levels so you never miss a critical clause.",
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: "Chat With Your Docs",
      desc: "Ask follow-up questions in plain English. RAG-powered for accurate answers.",
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "AI Email Drafts",
      desc: "Describe what you need to say — get a professional email draft in seconds.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-slate-900 to-indigo-950 border-r border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-16">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold text-lg">BizCopilot</span>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Stop drowning in
            <br />
            <span className="text-indigo-400">business documents.</span>
          </h1>
          <p className="text-slate-400 text-lg mb-12">
            Upload any invoice, contract, or email. Get instant analysis,
            action items, and risk flags — then chat with it.
          </p>

          <div className="space-y-6">
            {features.map((f) => (
              <div key={f.title} className="flex gap-4">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400 shrink-0">
                  {f.icon}
                </div>
                <div>
                  <div className="text-white font-medium text-sm">{f.title}</div>
                  <div className="text-slate-400 text-sm">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-sm">
          © 2025 BizCopilot. Built for small business owners.
        </p>
      </div>

      {/* Right panel — auth */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold text-lg">BizCopilot</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
          <p className="text-slate-400 mb-8">
            Sign in to your account or try the demo.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {/* Google OAuth */}
            <button
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isDemoLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-slate-100 text-slate-900 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Continue with Google
            </button>

            <div className="relative flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-slate-600 text-sm">or</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* Demo login */}
            <button
              onClick={handleDemoLogin}
              disabled={isGoogleLoading || isDemoLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDemoLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Zap className="w-5 h-5" />
              )}
              Try Demo — No signup needed
              {!isDemoLoading && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          </div>

          <p className="text-slate-600 text-xs text-center mt-6">
            Demo account includes pre-loaded sample documents.
            <br />
            By signing in you agree to our Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
}
