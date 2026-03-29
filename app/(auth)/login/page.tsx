"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, Lock, CheckCircle } from "lucide-react";

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

      // Check if 2FA is required
      if (data.requiresTwoFactor) {
        router.push(`/login/two-factor?next=${encodeURIComponent(nextUrl)}`);
        return;
      }

      // Check if email verification is required
      if (data.requiresEmailVerification) {
        router.push(`/verify-email?next=${encodeURIComponent(nextUrl)}`);
        return;
      }

      // Successful login
      router.push(nextUrl);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left side - Login form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          {/* Logo and title */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
              LEXORA
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Legal Practice Management System
            </p>
          </div>

          {/* Login form */}
          <div className="bg-white">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Sign in to your account
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="h-11 border-gray-300 focus:border-blue-900 focus:ring-blue-900"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-blue-900 hover:text-blue-700"
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
                  className="h-11 border-gray-300 focus:border-blue-900 focus:ring-blue-900"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-blue-900 hover:bg-blue-800 text-white font-medium"
                disabled={loading || !email || !password}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-500">Testing</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                onClick={() => {
                  setEmail('sabrina@test.com');
                  setPassword('TestPassword123!');
                }}
                disabled={loading}
              >
                Use Demo Account
              </Button>
            </form>

            <p className="mt-6 text-sm text-gray-600 text-center">
              Need access?{" "}
              <Link href="/contact" className="font-medium text-blue-900 hover:text-blue-700">
                Contact your administrator
              </Link>
            </p>
          </div>

          {/* Trust indicators */}
          <div className="mt-10 pt-8 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="flex flex-col items-center">
                <Shield className="h-5 w-5 text-blue-900 mb-1" />
                <p className="text-xs font-medium text-gray-900">SRA Compliant</p>
              </div>
              <div className="flex flex-col items-center">
                <Lock className="h-5 w-5 text-blue-900 mb-1" />
                <p className="text-xs font-medium text-gray-900">Bank-Grade Security</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>© 2026 Lexora. All rights reserved.</p>
          <p className="mt-1">
            <Link href="/privacy" className="hover:text-gray-700 underline">Privacy</Link>
            {" · "}
            <Link href="/terms" className="hover:text-gray-700 underline">Terms</Link>
          </p>
        </div>
      </div>

      {/* Right side - Professional sidebar */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-slate-900 to-slate-800 flex-col justify-between p-12 text-white">
        <div>
          <h2 className="text-3xl font-bold mb-6 leading-tight">
            Trusted by leading<br />UK law firms
          </h2>
          
          <div className="space-y-8 mt-12">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="font-semibold mb-1">SRA-Compliant Trust Accounting</p>
                <p className="text-sm text-gray-300">
                  Automated three-way reconciliation and full audit trails
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="font-semibold mb-1">Secure Document Management</p>
                <p className="text-sm text-gray-300">
                  Chain-of-custody tracking for court-ready submissions
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="font-semibold mb-1">Comprehensive Case Management</p>
                <p className="text-sm text-gray-300">
                  Time tracking, billing, and client portal in one platform
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-slate-700">
            <p className="text-sm text-gray-400 italic">
              "Lexora has transformed how we manage client matters and trust accounts. 
              The SRA compliance features give us complete peace of mind."
            </p>
            <p className="mt-3 text-sm font-medium">
              — Sarah Williams, Managing Partner
            </p>
            <p className="text-xs text-gray-400">
              Williams & Partners Solicitors, London
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-8 text-xs text-gray-400">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>GDPR Compliant</span>
          </div>
          <div className="flex items-center space-x-2">
            <Lock className="h-4 w-4" />
            <span>ISO 27001</span>
          </div>
        </div>
      </div>
    </div>
  );
}
