"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Copy, 
  Plus, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Users,
  Link as LinkIcon,
  CreditCard
} from "lucide-react";

interface Affiliate {
  id: string;
  ref_slug: string;
  name: string;
  email: string;
  stripe_connect_account_id: string | null;
  commission_rate: number;
  status: "pending_onboarding" | "active" | "inactive";
  created_at: string;
  affiliate_link: string;
  onboarding_link: string | null;
}

interface Commission {
  stripe_invoice_id: string;
  invoice_amount_cents: number;
  commission_amount_cents: number;
  commission_rate: number;
  currency: string;
  status: string;
  created_at: string;
}

interface AffiliateStats {
  affiliate_ref: string;
  referrals: { total: number; active: number };
  commissions: {
    total_earned: string;
    total_earned_cents: number;
    pending: string;
    pending_cents: number;
    paid: string;
    paid_cents: number;
    total_invoices: number;
    commission_rate: string;
  };
  recent_commissions: Commission[];
}

export default function AdminAffiliatesPage() {
  const searchParams = useSearchParams();
  const secretFromUrl = searchParams.get("secret");

  const [secret, setSecret] = useState(secretFromUrl || "");
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAffiliate, setNewAffiliate] = useState({ name: "", email: "", ref_slug: "" });
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState<{affiliate_link: string; connect_onboarding_url: string} | null>(null);

  // Stats modal state
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Copy feedback
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchAffiliates = useCallback(async () => {
    if (!secret) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/affiliates/list?secret=${encodeURIComponent(secret)}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAffiliates(data.affiliates || []);
    } catch (err: any) {
      setError(err.message || "Error loading affiliates");
    } finally {
      setLoading(false);
    }
  }, [secret]);

  useEffect(() => {
    if (secret) fetchAffiliates();
  }, [secret, fetchAffiliates]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret) return;
    setCreating(true);
    setCreateResult(null);
    try {
      const res = await fetch("/api/affiliates/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${secret}`,
        },
        body: JSON.stringify(newAffiliate),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create");
      }
      const data = await res.json();
      setCreateResult(data);
      setNewAffiliate({ name: "", email: "", ref_slug: "" });
      fetchAffiliates();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const fetchStats = async (ref: string) => {
    if (!secret) return;
    setStatsLoading(true);
    try {
      const res = await fetch(`/api/affiliates/stats?ref=${encodeURIComponent(ref)}&secret=${encodeURIComponent(secret)}`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setStatsLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  if (!secret) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LinkIcon className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">Affiliate Admin</h1>
          <p className="text-gray-500 text-center mb-6">Enter your secret key to manage affiliates</p>
          <input
            type="password"
            placeholder="AFFILIATE_API_SECRET"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            onClick={() => secret && fetchAffiliates()}
            className="w-full mt-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors"
          >
            Access Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Affiliate Management</h1>
                <p className="text-sm text-gray-500">Manage UGC creators & track commissions</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Affiliate
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
          </div>
        ) : affiliates.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No affiliates yet</h3>
            <p className="text-gray-500 mb-6">Create your first affiliate to get started</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
            >
              Create First Affiliate
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Creator</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Affiliate Link</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Onboarding</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {affiliates.map((aff) => (
                    <tr key={aff.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {aff.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{aff.name}</p>
                            <p className="text-sm text-gray-500">@{aff.ref_slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-mono text-gray-700 truncate max-w-[200px]">
                            ?ref={aff.ref_slug}
                          </code>
                          <button
                            onClick={() => copyToClipboard(aff.affiliate_link, `link-${aff.id}`)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Copy full link"
                          >
                            {copiedField === `link-${aff.id}` ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                          aff.status === "active"
                            ? "bg-green-100 text-green-700"
                            : aff.status === "pending_onboarding"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            aff.status === "active" ? "bg-green-600" : aff.status === "pending_onboarding" ? "bg-yellow-600" : "bg-gray-600"
                          }`} />
                          {aff.status === "pending_onboarding" ? "Needs Onboarding" : aff.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {aff.onboarding_link ? (
                          <a
                            href={aff.onboarding_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 font-medium text-sm"
                          >
                            <CreditCard className="w-4 h-4" />
                            Complete Setup
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-green-600 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            Ready for payouts
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedAffiliate(aff);
                            fetchStats(aff.ref_slug);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <DollarSign className="w-4 h-4" />
                          View Stats
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Affiliate Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Create New Affiliate</h2>
              <p className="text-sm text-gray-500 mt-1">Generate a unique link for a UGC creator</p>
            </div>
            
            {createResult ? (
              <div className="p-6 space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800">Affiliate created!</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Send these links to your creator:
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Affiliate Link (for sharing)</label>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={createResult.affiliate_link}
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard(createResult.affiliate_link, "new-link")}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        {copiedField === "new-link" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Connect Onboarding (for payouts)</label>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={createResult.connect_onboarding_url}
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-xs"
                      />
                      <button
                        onClick={() => copyToClipboard(createResult.connect_onboarding_url, "new-onboard")}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        {copiedField === "new-onboard" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setCreateResult(null);
                  }}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-medium transition-colors"
                >
                  Close & Create Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Creator Name</label>
                  <input
                    required
                    value={newAffiliate.name}
                    onChange={(e) => setNewAffiliate({ ...newAffiliate, name: e.target.value })}
                    placeholder="Jane Creator"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Email Address</label>
                  <input
                    required
                    type="email"
                    value={newAffiliate.email}
                    onChange={(e) => setNewAffiliate({ ...newAffiliate, email: e.target.value })}
                    placeholder="jane@example.com"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Ref Slug (unique identifier)
                    <span className="text-gray-400 font-normal ml-1">— used in the link</span>
                  </label>
                  <input
                    required
                    value={newAffiliate.ref_slug}
                    onChange={(e) => setNewAffiliate({ ...newAffiliate, ref_slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })}
                    placeholder="jane"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    Link will be: <code className="bg-gray-100 px-1.5 py-0.5 rounded">?ref={newAffiliate.ref_slug || "slug"}</code>
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !newAffiliate.name || !newAffiliate.email || !newAffiliate.ref_slug}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Create Affiliate
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {selectedAffiliate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedAffiliate.name}</h2>
                <p className="text-sm text-gray-500">@{selectedAffiliate.ref_slug} • 30% commission</p>
              </div>
              <button
                onClick={() => {
                  setSelectedAffiliate(null);
                  setStats(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {statsLoading ? (
              <div className="p-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-red-600" />
              </div>
            ) : stats ? (
              <div className="p-6 space-y-6">
                {/* Stats cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-red-50 rounded-xl p-4">
                    <p className="text-sm text-red-600 font-medium">Total Earned</p>
                    <p className="text-2xl font-bold text-red-700">{stats.commissions.total_earned}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-4">
                    <p className="text-sm text-yellow-600 font-medium">Pending</p>
                    <p className="text-2xl font-bold text-yellow-700">{stats.commissions.pending}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-sm text-green-600 font-medium">Paid Out</p>
                    <p className="text-2xl font-bold text-green-700">{stats.commissions.paid}</p>
                  </div>
                </div>

                {/* Referral stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                    <Users className="w-8 h-8 text-gray-400" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.referrals.total}</p>
                      <p className="text-sm text-gray-500">Total Referrals</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.referrals.active}</p>
                      <p className="text-sm text-gray-500">Active Subscriptions</p>
                    </div>
                  </div>
                </div>

                {/* Recent commissions */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Recent Commissions</h3>
                  {stats.recent_commissions.length === 0 ? (
                    <p className="text-gray-500 text-sm">No commissions yet. They&apos;ll appear here when referred customers pay.</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.recent_commissions.map((comm, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{formatCurrency(comm.commission_amount_cents)}</p>
                            <p className="text-xs text-gray-500">
                              {formatCurrency(comm.invoice_amount_cents)} invoice • {new Date(comm.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            comm.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {comm.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">Failed to load stats</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
