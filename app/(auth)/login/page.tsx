"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, Lock, CheckCircle, Award, Users } from "lucide-react";

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

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Left side - Login form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <div className="mb-10">
            <img 
              src="/logo.svg" 
              alt="Lexora" 
              className="h-12 mb-6"
            />
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-base text-gray-600">
              Sign in to your Lexora account
            </p>
          </div>

          {/* Trust badges */}
          <div className="mb-8 flex items-center gap-6 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-blue-900" />
              <span className="font-medium text-gray-700">SRA Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Lock className="w-4 h-4 text-blue-900" />
              <span className="font-medium text-gray-700">ISO 27001</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Award className="w-4 h-4 text-blue-900" />
              <span className="font-medium text-gray-700">GDPR</span>
            </div>
          </div>

          {/* Login form */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@lawfirm.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                  autoFocus
                  className="h-12 border-gray-300 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 text-base"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="password" className="block text-sm font-semibold text-gray-900">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-semibold text-blue-900 hover:text-blue-700 transition-colors"
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
                  className="h-12 border-gray-300 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 text-base"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-base shadow-lg shadow-blue-900/20 transition-all hover:shadow-xl hover:shadow-blue-900/30"
                disabled={loading || !email || !password}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-gray-500 font-medium uppercase tracking-wide">
                    Demo Account
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
                onClick={() => {
                  setEmail('sabrina@test.com');
                  setPassword('TestPassword123!');
                }}
                disabled={loading}
              >
                <Users className="mr-2 h-5 w-5" />
                Use Test Account (Sabrina)
              </Button>
            </form>

            <p className="mt-6 text-sm text-gray-600 text-center">
              Need access?{" "}
              <Link href="/contact" className="font-semibold text-blue-900 hover:text-blue-700 transition-colors">
                Contact your administrator
              </Link>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-gray-500">
            <p>© 2026 Lexora. All rights reserved.</p>
            <p className="mt-2 space-x-3">
              <Link href="/privacy" className="hover:text-gray-700 underline transition-colors">Privacy Policy</Link>
              <span>·</span>
              <Link href="/terms" className="hover:text-gray-700 underline transition-colors">Terms of Service</Link>
              <span>·</span>
              <Link href="/security" className="hover:text-gray-700 underline transition-colors">Security</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Professional hero section */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex-col justify-between p-12 text-white relative overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1.5" fill="white"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#dots)"/>
          </svg>
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-8">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold">Trusted by 150+ UK Law Firms</span>
          </div>

          <h2 className="text-4xl font-bold mb-6 leading-tight">
            The complete legal<br />practice platform
          </h2>
          
          <div className="space-y-6 mt-12">
            <div className="flex items-start space-x-4 group">
              <div className="flex-shrink-0 mt-1">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <CheckCircle className="h-5 w-5 text-blue-300" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-lg mb-1">SRA-Compliant Trust Accounting</p>
                <p className="text-sm text-blue-100">
                  Automated three-way reconciliation with full audit trails
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 group">
              <div className="flex-shrink-0 mt-1">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <CheckCircle className="h-5 w-5 text-blue-300" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-lg mb-1">Intelligent Time Tracking</p>
                <p className="text-sm text-blue-100">
                  AI-powered time capture from emails and calendar events
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 group">
              <div className="flex-shrink-0 mt-1">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <CheckCircle className="h-5 w-5 text-blue-300" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-lg mb-1">Client Portal & Communication</p>
                <p className="text-sm text-blue-100">
                  Real-time updates and secure messaging for clients
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-white/20">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-lg font-bold">
                  SW
                </div>
              </div>
              <div>
                <p className="text-base italic leading-relaxed mb-3">
                  "Lexora has transformed how we manage our practice. The SRA compliance features 
                  and automated workflows have saved us countless hours."
                </p>
                <p className="text-sm font-semibold">Sarah Williams</p>
                <p className="text-xs text-blue-200">Managing Partner, Williams & Partners Solicitors</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-blue-200">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <Lock className="h-4 w-4" />
              <span>ISO 27001 Certified</span>
            </div>
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4" />
              <span>SRA Approved</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
