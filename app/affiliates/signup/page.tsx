"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Sparkles,
  DollarSign,
  Users,
  TrendingUp,
} from "lucide-react";

export default function AffiliateSignupPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slugCheckTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/affiliates/login?redirect=/affiliates/signup");
        return;
      }

      setUser(session.user);
      setName(session.user.user_metadata?.full_name || session.user.user_metadata?.name || "");

      // Check if already an affiliate
      const { data: existing } = await supabase
        .from("affiliates")
        .select("ref_slug")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (existing) {
        router.push("/affiliates/dashboard");
        return;
      }

      setCheckingSession(false);
    };
    checkSession();
  }, [router]);

  const normalizeSlug = (input: string) =>
    input.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "");

  const handleSlugChange = (raw: string) => {
    const normalized = normalizeSlug(raw);
    setSlug(normalized);
    setSlugStatus("idle");

    if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current);

    if (normalized.length < 3) {
      if (normalized.length > 0) setSlugStatus("invalid");
      return;
    }

    setSlugStatus("checking");
    slugCheckTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/affiliates/check-slug?slug=${encodeURIComponent(normalized)}`);
        const data = await res.json();
        setSlugStatus(data.available ? "available" : "taken");
      } catch {
        setSlugStatus("idle");
      }
    }, 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || slug.length < 3 || slugStatus !== "available") return;

    setSubmitting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.push("/affiliates/login?redirect=/affiliates/signup");
        return;
      }

      const res = await fetch("/api/affiliates/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name: name.trim(), ref_slug: slug }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Signup failed");
      }

      if (data.connect_onboarding_url) {
        window.location.href = data.connect_onboarding_url;
      } else {
        router.push("/affiliates/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setSubmitting(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Become an Affiliate
          </h1>
          <p className="text-gray-500">
            Earn 30% recurring commission on every subscription you refer — for life.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white rounded-xl p-4 text-center border border-gray-200">
            <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">30% Commission</p>
            <p className="text-xs text-gray-500">Every payment</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-gray-200">
            <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Recurring</p>
            <p className="text-xs text-gray-500">Lifetime payouts</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-gray-200">
            <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Real-time</p>
            <p className="text-xs text-gray-500">Live dashboard</p>
          </div>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          {/* Email (read-only) */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Name */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
            />
          </div>

          {/* Ref Slug */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Referral Code</label>
            <div className="relative">
              <input
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="your-code"
                required
                className={`w-full px-4 py-3 bg-white border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition pr-10 ${
                  slugStatus === "available"
                    ? "border-green-400 focus:ring-green-500"
                    : slugStatus === "taken" || slugStatus === "invalid"
                    ? "border-red-400 focus:ring-red-500"
                    : "border-gray-300 focus:ring-red-500"
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {slugStatus === "checking" && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
                {slugStatus === "available" && <CheckCircle className="w-5 h-5 text-green-500" />}
                {slugStatus === "taken" && <XCircle className="w-5 h-5 text-red-500" />}
                {slugStatus === "invalid" && <XCircle className="w-5 h-5 text-red-500" />}
              </div>
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              {slugStatus === "available" && (
                <span className="text-green-600">
                  Your link: revealai-peoplesearch.com/?ref={slug}
                </span>
              )}
              {slugStatus === "taken" && (
                <span className="text-red-600">This code is already taken</span>
              )}
              {slugStatus === "invalid" && (
                <span className="text-red-600">At least 3 characters (letters, numbers, dashes)</span>
              )}
              {(slugStatus === "idle" || slugStatus === "checking") && slug.length === 0 && (
                <span>This will be your unique referral link</span>
              )}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !name.trim() || slug.length < 3 || slugStatus !== "available"}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Setting up your account...
              </>
            ) : (
              <>
                Create Affiliate Account
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <p className="text-xs text-gray-400 text-center mt-4">
            You&apos;ll set up payouts through Stripe in the next step.
          </p>
        </form>
      </div>
    </div>
  );
}
