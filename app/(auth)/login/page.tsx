"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, Lock, CheckCircle2, Scale, Building2, Users, FileCheck, Clock } from "lucide-react";

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
      {/* Left side - Corporate branding panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}></div>
          
          {/* Gradient orbs */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white w-full">
          {/* Logo & Brand */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-3 shadow-lg">
                <Scale className="w-8 h-8 text-white" />
              </div>
              <div>
                <span className="text-3xl font-bold tracking-tight">LEXORA</span>
                <div className="text-xs text-slate-400 font-medium tracking-wider mt-0.5">LEGAL TECHNOLOGIES</div>
              </div>
            </div>
          </div>

          {/* Main value proposition */}
          <div className="space-y-10">
            <div>
              <div className="inline-block px-3 py-1.5 bg-blue-500/10 border border-blue-400/20 rounded-full mb-6">
                <span className="text-xs font-semibold text-blue-300 tracking-wider uppercase">Enterprise Legal Platform</span>
              </div>
              
              <h1 className="text-5xl xl:text-6xl font-bold mb-6 leading-[1.1] tracking-tight">
                Transform Your<br />
                Legal Practice
              </h1>
              <p className="text-xl text-slate-300 max-w-lg leading-relaxed">
                The complete practice management solution trusted by leading UK law firms to streamline operations, ensure compliance, and deliver exceptional client service.
              </p>
            </div>

            {/* Key features grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: FileCheck, title: "SRA Compliant", desc: "Full regulatory compliance" },
                { icon: Clock, title: "Save 40+ Hours", desc: "Per week automation" },
                { icon: Users, title: "Client Portal", desc: "24/7 secure access" },
                { icon: Building2, title: "Trust Accounting", desc: "Automated reconciliation" }
              ].map((feature, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300">
                  <feature.icon className="w-6 h-6 text-blue-400 mb-2" />
                  <div className="text-sm font-semibold text-white mb-1">{feature.title}</div>
                  <div className="text-xs text-slate-400">{feature.desc}</div>
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div className="space-y-4 pt-6 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-white">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">500+ Law Firms</div>
                  <div className="text-xs text-slate-400">Managing 15,000+ active cases</div>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Compliance badges */}
          <div className="space-y-4">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                <div>
                  <div className="font-semibold text-white">ISO 27001</div>
                  <div className="text-xs text-slate-400">Information Security</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="font-semibold text-white">Bank-Grade</div>
                  <div className="text-xs text-slate-400">256-bit Encryption</div>
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-500 leading-relaxed">
              Lexora complies with SRA regulations, GDPR, and UK data protection laws. Your data is encrypted in transit and at rest, with regular third-party security audits.
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full max-w-[480px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-2.5 shadow-lg">
              <Scale className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-900">LEXORA</span>
              <div className="text-[10px] text-slate-500 font-medium tracking-wider">LEGAL TECHNOLOGIES</div>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl xl:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
              Sign in to your account
            </h2>
            <p className="text-slate-600 text-lg">
              Access your legal practice management platform
            </p>
          </div>

          {/* Login card */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 xl:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50 rounded-xl">
                  <AlertDescription className="text-red-800 text-sm font-medium">{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2.5">
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
                  className="h-14 text-base border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-slate-50 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <Label htmlFor="password" className="block text-sm font-bold text-slate-700">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
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
                  className="h-14 text-base border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-slate-50 transition-all"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
                disabled={loading || !email || !password}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-5 w-5" />
                    Sign in securely
                  </>
                )}
              </Button>

              {/* Demo login separator */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-4 bg-white text-slate-500 font-bold uppercase tracking-widest">
                    Demo Access
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-14 border-2 border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 font-semibold text-base transition-all rounded-xl"
                onClick={handleDemoLogin}
                disabled={loading}
              >
                Use test account
              </Button>
            </form>
          </div>

          {/* Trust indicators */}
          <div className="mt-8 bg-white rounded-xl border border-slate-200 shadow-md p-6">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-4">
              Trusted & Secure
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Shield, label: "SRA Compliant" },
                { icon: CheckCircle2, label: "ISO 27001" },
                { icon: Lock, label: "GDPR Secure" }
              ].map((badge, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-2">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3">
                    <badge.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-sm text-slate-600">
              Need help? Contact our support team at{" "}
              <a href="mailto:support@lexora.com" className="font-semibold text-blue-600 hover:text-blue-700">
                support@lexora.com
              </a>
            </p>
            <p className="text-xs text-slate-500">
              © 2026 Lexora Legal Technologies Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
