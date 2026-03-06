"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  Copy,
  CheckCircle,
  TrendingUp,
  Users,
  MousePointer,
  DollarSign,
  Calendar,
  Loader2,
  AlertCircle,
  LogOut,
  ArrowUpRight,
} from "lucide-react";

interface Stats {
  affiliate: {
    name: string;
    ref_slug: string;
    commission_rate: number;
    status: string;
    joined_at: string;
    affiliate_link: string;
  };
  clicks: {
    last_30_days: number;
    converted_last_30_days: number;
    conversion_rate: string;
    all_time: number;
  };
  referrals: {
    total: number;
    active: number;
  };
  commissions: {
    total_earned: string;
    total_earned_cents: number;
    total_gmv: string;
    total_gmv_cents: number;
    pending: string;
    pending_cents: number;
    paid: string;
    paid_cents: number;
    total_payments: number;
  };
  monthly_earnings: Array<{
    month: string;
    amount: string;
    cents: number;
  }>;
  recent_commissions: Array<{
    commission_amount_cents: number;
    invoice_amount_cents: number;
    status: string;
    created_at: string;
  }>;
}

export default function AffiliateDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Date filtering for commissions
  const [dateFilter, setDateFilter] = useState<"all" | "30d" | "90d" | "this_year">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Check auth and fetch stats
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/affiliates/login?redirect=/affiliates/dashboard");
        return;
      }
      // Get affiliate ref from user_id
      const { data: affiliate } = await supabase
        .from("affiliates")
        .select("ref_slug")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!affiliate) {
        router.push("/affiliates/signup");
        return;
      }

      // Fetch stats using the ref
      try {
        const res = await fetch(`/api/affiliates/public-stats?ref=${encodeURIComponent(affiliate.ref_slug)}`);
        if (!res.ok) throw new Error("Failed to load stats");
        const data = await res.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message || "Error loading dashboard");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const copyLink = () => {
    if (!stats?.affiliate.affiliate_link) return;
    navigator.clipboard.writeText(stats.affiliate.affiliate_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/affiliates/login");
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const filterCommissionsByDate = (commissions: Stats["recent_commissions"]) => {
    if (!commissions || dateFilter === "all") return commissions;
    
    const now = new Date();
    const cutoff = new Date();
    
    switch (dateFilter) {
      case "30d":
        cutoff.setDate(now.getDate() - 30);
        break;
      case "90d":
        cutoff.setDate(now.getDate() - 90);
        break;
      case "this_year":
        cutoff.setMonth(0, 1);
        break;
    }
    
    return commissions.filter(c => new Date(c.created_at) >= cutoff);
  };

  const sortCommissions = (commissions: Stats["recent_commissions"]) => {
    if (!commissions) return [];
    const sorted = [...commissions];
    return sortOrder === "newest" 
      ? sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      : sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Unable to load dashboard</h1>
          <p className="text-gray-500">{error || "Something went wrong"}</p>
        </div>
      </div>
    );
  }

  const maxMonthlyEarning = Math.max(...stats.monthly_earnings.map((m) => m.cents), 1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Creator Dashboard</h1>
              <p className="text-gray-500 mt-1">
                Welcome back, {stats.affiliate.name}!
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                {stats.affiliate.commission_rate}% commission rate
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Affiliate Link Card */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 text-white mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Your Affiliate Link</h2>
              <p className="text-red-100 text-sm">Share this with your audience to earn {stats.affiliate.commission_rate}% on every subscription</p>
            </div>
            <div className="flex items-center gap-3">
              <code className="px-4 py-2 bg-white/20 rounded-lg font-mono text-sm break-all">
                {stats.affiliate.affiliate_link}
              </code>
              <button
                onClick={copyLink}
                className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid - GMV & Commission highlighted */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Total GMV */}
          <div className="bg-white rounded-2xl p-6 border-2 border-blue-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-gray-500 font-medium">Total GMV</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.commissions.total_gmv || "$0.00"}</p>
            <p className="text-sm text-blue-600 mt-2">Total sales you referred</p>
          </div>

          {/* Total Commission */}
          <div className="bg-white rounded-2xl p-6 border-2 border-green-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-500 font-medium">Total Commission</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.commissions.total_earned}</p>
            <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4" />
              Your earnings ({stats.affiliate.commission_rate}% of GMV)
            </p>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-sm text-gray-500 font-medium">Pending</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.commissions.pending}</p>
            <p className="text-sm text-gray-500 mt-2">Processing to your account</p>
          </div>

          {/* Referrals */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-gray-500 font-medium">Active Referrals</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.referrals.active}</p>
            <p className="text-sm text-gray-500 mt-2">
              {stats.referrals.total} total signups
            </p>
          </div>

          {/* Clicks & Conversion */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <MousePointer className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-sm text-gray-500 font-medium">Click Conversion</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.clicks.conversion_rate}</p>
            <p className="text-sm text-gray-500 mt-2">
              {stats.clicks.last_30_days} clicks (30 days)
            </p>
          </div>
        </div>

        {/* Monthly Earnings Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Monthly Earnings (Last 6 Months)</h2>
          <div className="space-y-4">
            {stats.monthly_earnings.map((month) => (
              <div key={month.month} className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-500 font-medium">{formatMonth(month.month)}</div>
                <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all duration-500"
                    style={{ width: `${(month.cents / maxMonthlyEarning) * 100}%` }}
                  />
                </div>
                <div className="w-20 text-right font-semibold text-gray-900">{month.amount}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Commissions with Date Filter */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Commission History</h2>
            <div className="flex items-center gap-3">
              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All time</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="this_year">This year</option>
              </select>
              {/* Sort Order */}
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
          </div>
          
          {(() => {
            const filtered = filterCommissionsByDate(stats.recent_commissions);
            const sorted = sortCommissions(filtered);
            
            if (sorted.length === 0) {
              return (
                <p className="text-gray-500 text-center py-8">
                  No commissions found for this period. Keep sharing your link!
                </p>
              );
            }
            
            return (
              <div className="divide-y divide-gray-100">
                {/* Table Header */}
                <div className="hidden sm:grid grid-cols-4 gap-4 py-3 px-4 text-sm font-medium text-gray-500 border-b border-gray-200">
                  <div>Date</div>
                  <div className="text-right">Sale Amount (GMV)</div>
                  <div className="text-right">Your Commission</div>
                  <div className="text-right">Status</div>
                </div>
                
                {sorted.map((commission, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4 py-4 px-4 items-center hover:bg-gray-50 transition-colors">
                    {/* Date */}
                    <div className="text-sm text-gray-900">
                      {formatDate(commission.created_at)}
                    </div>
                    
                    {/* GMV / Sale Amount */}
                    <div className="text-right">
                      <span className="text-sm text-gray-600">{formatCurrency(commission.invoice_amount_cents || 0)}</span>
                    </div>
                    
                    {/* Commission */}
                    <div className="text-right">
                      <span className="font-semibold text-green-600">
                        +{formatCurrency(commission.commission_amount_cents)}
                      </span>
                      <span className="hidden sm:inline text-xs text-gray-400 ml-1">
                        ({Math.round((commission.commission_amount_cents / (commission.invoice_amount_cents || 1)) * 100)}%)
                      </span>
                    </div>
                    
                    {/* Status */}
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        commission.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          commission.status === "paid" ? "bg-green-600" : "bg-yellow-600"
                        }`} />
                        {commission.status === "paid" ? "Paid" : "Pending"}
                      </span>
                    </div>
                  </div>
                ))}
                
                {/* Summary Row */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4 py-4 px-4 bg-gray-50 rounded-b-xl mt-2">
                  <div className="text-sm font-medium text-gray-500">Period Summary</div>
                  <div className="text-right text-sm text-gray-600">
                    {formatCurrency(sorted.reduce((sum, c) => sum + (c.invoice_amount_cents || 0), 0))} GMV
                  </div>
                  <div className="text-right text-sm font-semibold text-green-600">
                    {formatCurrency(sorted.reduce((sum, c) => sum + c.commission_amount_cents, 0))} earned
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {sorted.length} payments
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Questions? Email support@revealai-peoplesearch.com</p>
          <p className="mt-1">Affiliate since {formatDate(stats.affiliate.joined_at)}</p>
        </div>
      </div>
    </div>
  );
}
