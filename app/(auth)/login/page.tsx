"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, Lock, CheckCircle2, Scale } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const nextUrl = searchParams.get("next") || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
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
        setError(data.error || "Login failed. Please try again.");
        setLoading(false);
        return;
      }

      if (data.requiresTwoFactor) {
        router.push(`/login/two-factor?next=${encodeURIComponent(nextUrl)}`);
        return;
      }

      if (data.requiresEmailVerification) {
        router.push(`/verify-email?next=${encodeURIComponent(nextUrl)}`);
        return;
      }

      router.push(nextUrl);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setEmail('sabrina@test.com');
    setPassword('TestPassword123!');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1e3a8a] via-[#1e40af] to-[#1d4ed8] relative overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-2.5">
              <Scale className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold">LEXORA</span>
          </div>

          {/* Main content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-4 leading-tight">
                Legal Practice<br />
                Management<br />
                Made Simple
              </h1>
              <p className="text-lg text-blue-100 max-w-md">
                Trusted by UK law firms to manage matters, billing, and client relationships with confidence.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="space-y-3">
              {[
                "SRA-compliant case management",
                "Automated time tracking & billing",
                "Trust accounting reconciliation",
                "Secure client portal"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-shrink-0 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full p-1">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-blue-100">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-6 text-sm text-blue-200">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>ISO 27001 Certified</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>Bank-Grade Security</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="bg-[#1e3a8a] rounded-lg p-2">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">LEXORA</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back
            </h2>
            <p className="text-gray-600">
              Sign in to your account to continue
            </p>
          </div>

          {/* Login card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.name@lawfirm.co.uk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                  autoFocus
                  className="h-12 text-base border-gray-300 focus:border-[#1e3a8a] focus:ring-[#1e3a8a]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-[#1e3a8a] hover:text-[#1e40af] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="h-12 text-base border-gray-300 focus:border-[#1e3a8a] focus:ring-[#1e3a8a]"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-semibold text-base shadow-sm transition-all"
                disabled={loading || !email || !password}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Sign in securely
                  </>
                )}
              </Button>

              {/* Demo login separator */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-gray-500 font-medium uppercase tracking-wider">
                    Demo Access
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-base transition-all"
                onClick={handleDemoLogin}
                disabled={loading}
              >
                Use test account
              </Button>
            </form>
          </div>

          {/* Trust badges */}
          <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#1e3a8a]" />
                <span className="font-medium">SRA Compliant</span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#1e3a8a]" />
                <span className="font-medium">ISO 27001</span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#1e3a8a]" />
                <span className="font-medium">GDPR</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-gray-500">
            © 2026 Lexora Legal Technologies Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
