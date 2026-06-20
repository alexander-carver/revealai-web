"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  GraduationCap,
  Users,
  Calendar,
  ExternalLink,
  Globe,
  Copy,
  Check,
  Share2,
  Heart,
  Home,
  Building2,
  UserCheck,
  AlertTriangle,
  FileText,
  Shield,
  Car,
  Scale,
  Sparkles,
  Camera,
  Download,
  Map,
  ShieldCheck,
  Gavel,
  Landmark,
  FileBarChart,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Lock,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { fetchPersonProfile, runAIProfileSearch } from "@/lib/services/people-search";
import type { PersonProfileState, PersonSearchCandidate } from "@/lib/types";
import { formatPhone, formatDate } from "@/lib/utils";
import { useSubscription } from "@/hooks/use-subscription";

// Convert markdown links to clickable HTML links
function formatAIResponse(text: string): string {
  // Convert markdown links [text](url) to HTML <a> tags
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let html = text.replace(linkRegex, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>');
  
  // Convert line breaks to <br/>
  html = html.replace(/\n/g, "<br/>");
  
  return html;
}

// Calculate report completeness score
function getReportScore(person: any): { score: number; total: number; sections: { name: string; found: boolean }[] } {
  const sections = [
    { name: "Full Name", found: !!person.fullName },
    { name: "Date of Birth", found: !!person.dateOfBirth || !!person.age },
    { name: "Current Address", found: !!(person.addresses && person.addresses.length > 0) },
    { name: "Phone Numbers", found: !!(person.phones && person.phones.length > 0) },
    { name: "Email Addresses", found: !!(person.emails && person.emails.length > 0) },
    { name: "Relatives", found: !!(person.relatives && person.relatives.length > 0) },
    { name: "Associates", found: !!(person.associates && person.associates.length > 0) },
    { name: "Employment", found: !!(person.employment && person.employment.length > 0) || !!(person.workplaces && person.workplaces.length > 0) },
    { name: "Education", found: !!(person.education && person.education.length > 0) },
    { name: "Social Profiles", found: !!(person.socialProfiles && person.socialProfiles.length > 0) },
    { name: "Properties", found: !!(person.properties && person.properties.length > 0) },
    { name: "Vehicles", found: !!(person.vehicles && person.vehicles.length > 0) },
    { name: "Criminal Records", found: !!(person.criminalRecords && person.criminalRecords.length > 0) },
    { name: "Court Records", found: !!(person.bankruptcies && person.bankruptcies.length > 0) || !!(person.liens && person.liens.length > 0) },
    { name: "Professional Licenses", found: !!(person.professionalLicenses && person.professionalLicenses.length > 0) },
    { name: "Marriage Records", found: !!(person.marriages && person.marriages.length > 0) || !!(person.divorces && person.divorces.length > 0) },
    { name: "Voter Registration", found: !!person.voterRegistration },
    { name: "Photos", found: !!(person.photos && person.photos.length > 0) },
  ];
  const score = sections.filter(s => s.found).length;
  return { score, total: sections.length, sections };
}

// Generate a plain-English report summary
function generateReportSummary(person: any, queryLabel: string): string {
  const name = person.fullName || queryLabel;
  const parts: string[] = [];

  // Age and location
  const ageStr = person.age ? `${person.age}` : null;
  const currentAddr = person.addresses?.find((a: any) => a.isCurrent) || person.addresses?.[0];
  const locationStr = currentAddr ? [currentAddr.city, currentAddr.state].filter(Boolean).join(", ") : null;

  if (ageStr && locationStr) {
    parts.push(`${name}, ${ageStr}, currently lives in ${locationStr}.`);
  } else if (locationStr) {
    parts.push(`${name} currently lives in ${locationStr}.`);
  } else if (ageStr) {
    parts.push(`${name} is ${ageStr} years old.`);
  } else {
    parts.push(`Report for ${name}.`);
  }

  // Properties
  const propCount = person.properties?.length || 0;
  if (propCount > 0) {
    parts.push(`Owns ${propCount} propert${propCount === 1 ? "y" : "ies"}.`);
  }

  // Employment
  const job = person.employment?.[0] || person.workplaces?.[0];
  if (job) {
    const jobParts = [job.title, job.company].filter(Boolean);
    if (jobParts.length > 0) parts.push(`Works as ${jobParts.join(" at ")}.`);
  }

  // Criminal
  const crimCount = person.criminalRecords?.length || 0;
  if (crimCount > 0) {
    parts.push(`Has ${crimCount} criminal record${crimCount === 1 ? "" : "s"} on file.`);
  } else {
    parts.push("No criminal records found.");
  }

  // Relatives
  const relCount = person.relatives?.length || 0;
  if (relCount > 0) {
    parts.push(`${relCount} known relative${relCount === 1 ? "" : "s"} identified.`);
  }

  return parts.join(" ");
}

// Report Score Circle Component
function ReportScoreCircle({ score, total }: { score: number; total: number }) {
  const percentage = Math.round((score / total) * 100);
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const color = percentage >= 70 ? "#10b981" : percentage >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative w-28 h-28 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="50" cy="50" r="40" fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>{percentage}%</span>
        <span className="text-[10px] text-gray-500 font-medium">COMPLETE</span>
      </div>
    </div>
  );
}

export default function PersonProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { isPro, showPaywall } = useSubscription();
  const [profile, setProfile] = useState<PersonProfileState | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const id = params.id as string;
  const firstName = searchParams.get("firstName") || "";
  const lastName = searchParams.get("lastName") || "";

  const profileMutation = useMutation({
    mutationFn: async () => {
      const candidate: PersonSearchCandidate = {
        id,
        firstName,
        lastName,
        rawPayload: { tahoeId: id, enformionId: id },
      };
      const queryPayload = { FirstName: firstName, LastName: lastName };
      return fetchPersonProfile(candidate, queryPayload);
    },
    onSuccess: (data) => {
      setProfile(data);
    },
  });

  const aiSearchMutation = useMutation({
    mutationFn: async (query: string) => {
      return runAIProfileSearch(query);
    },
    onSuccess: (data) => {
      setAiResult(data);
    },
  });

  // Mock profile IDs that should load without Pro subscription
  const MOCK_PROFILE_IDS = [
    "emma-smith", "kyle-anderson", "donald-trump", "mrbeast", 
    "jeffrey-epstein", "elon-musk", "dua-lipa", "andrew-tate", 
    "taylor-swift", "lebron-james"
  ];
  const isMockProfile = MOCK_PROFILE_IDS.includes(id);

  useEffect(() => {
    // Fetch profile if user is pro OR it's a mock demo profile
    if (id && (isPro || isMockProfile)) {
      profileMutation.mutate();
    }
  }, [id, isPro]);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadPDF = useCallback(() => {
    if (!reportRef.current || !profile) return;
    // Use browser print to PDF
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const person = profile.profile;
    const name = person.fullName || profile.queryLabel;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>RevealAI Report - ${name}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; color: #1a1a1a; max-width: 800px; margin: 0 auto; }
        h1 { font-size: 24px; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; }
        h2 { font-size: 18px; color: #4b5563; margin-top: 24px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
        .badge { display: inline-block; background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 6px; }
        .badge-green { background: #dcfce7; color: #166534; }
        .badge-red { background: #fef2f2; color: #991b1b; }
        .item { padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .label { font-weight: 600; }
        .sub { color: #6b7280; font-size: 14px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
        @media print { body { padding: 20px; } }
      </style>
      </head><body>
      <h1>🔍 RevealAI Background Report</h1>
      <p><strong>${name}</strong>${person.age ? ` • Age ${person.age}` : ""}${person.dateOfBirth ? ` • DOB: ${person.dateOfBirth}` : ""}</p>
      ${person.addresses?.length ? `<h2>📍 Addresses</h2>${person.addresses.map((a: any) => `<div class="item"><span class="label">${a.street || ""}</span><br/><span class="sub">${[a.city, a.state, a.zip].filter(Boolean).join(", ")}</span>${a.isCurrent ? ' <span class="badge badge-green">Current</span>' : ""}${a.dateRange ? `<br/><span class="sub">${a.dateRange}</span>` : ""}</div>`).join("")}` : ""}
      ${person.phones?.length ? `<h2>📞 Phone Numbers</h2>${person.phones.map((p: any) => `<div class="item"><span class="label">${p.number}</span>${p.type ? ` <span class="sub">${p.type}</span>` : ""}${p.carrier ? ` <span class="sub">• ${p.carrier}</span>` : ""}</div>`).join("")}` : ""}
      ${person.emails?.length ? `<h2>📧 Email Addresses</h2>${person.emails.map((e: any) => `<div class="item">${e.address}${e.type ? ` <span class="sub">(${e.type})</span>` : ""}</div>`).join("")}` : ""}
      ${person.relatives?.length ? `<h2>👨‍👩‍👧‍👦 Relatives</h2>${person.relatives.map((r: any) => `<div class="item"><span class="label">${r.name}</span>${r.relationship ? ` <span class="sub">(${r.relationship})</span>` : ""}${r.age ? ` <span class="badge">${r.age} yrs</span>` : ""}</div>`).join("")}` : ""}
      ${person.criminalRecords?.length ? `<h2>⚠️ Criminal Records</h2>${person.criminalRecords.map((c: any) => `<div class="item"><span class="label">${c.offense}</span>${c.severity ? ` <span class="badge badge-red">${c.severity}</span>` : ""}<br/><span class="sub">${[c.offenseDate, c.court, c.county ? `${c.county}, ${c.state}` : ""].filter(Boolean).join(" • ")}</span></div>`).join("")}` : '<h2>✅ Criminal Records</h2><p class="sub">No criminal records found.</p>'}
      ${person.properties?.length ? `<h2>🏠 Properties</h2>${person.properties.map((p: any) => `<div class="item"><span class="label">${p.address}</span><br/><span class="sub">${[p.city, p.state, p.zip].filter(Boolean).join(", ")}</span>${p.marketValue ? ` <span class="badge badge-green">Value: $${p.marketValue.toLocaleString()}</span>` : ""}</div>`).join("")}` : ""}
      ${person.vehicles?.length ? `<h2>🚗 Vehicles</h2>${person.vehicles.map((v: any) => `<div class="item"><span class="label">${[v.year, v.make, v.model].filter(Boolean).join(" ")}</span>${v.vin ? `<br/><span class="sub">VIN: ${v.vin}</span>` : ""}</div>`).join("")}` : ""}
      <div class="footer">
        <p>Generated by RevealAI • ${new Date().toLocaleDateString()} • This is not a Consumer Reporting Agency report (FCRA)</p>
      </div>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }, [profile]);

  // Memoized report score and summary
  const reportScore = useMemo(() => {
    if (!profile) return null;
    return getReportScore(profile.profile);
  }, [profile]);

  const reportSummary = useMemo(() => {
    if (!profile) return "";
    return generateReportSummary(profile.profile, profile.queryLabel);
  }, [profile]);

  if (profileMutation.isPending) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-8">
          <Link href="/search">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
        </div>
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-5 w-48" />
              </div>
            </div>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (profileMutation.error) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-8">
          <Link href="/search">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
        </div>
        <Alert variant="destructive">
          {(profileMutation.error as Error).message || "Failed to load profile"}
        </Alert>
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-8">
          <Link href="/search">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
        </div>
        <Alert variant="info">No profile data found.</Alert>
      </div>
    );
  }

  const { profile: person, queryLabel } = profile;

  return (
    <div ref={reportRef}>
      {/* Back Button */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link href="/search">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-primary border-primary/30 hover:bg-primary/10"
          onClick={handleDownloadPDF}
        >
          <Download className="w-4 h-4" />
          Download Report
        </Button>
      </div>

      {/* Report Summary Card */}
      <Card className="mb-6 overflow-hidden border-primary/10 bg-gradient-to-br from-primary/[0.03] via-transparent to-blue-500/[0.02]">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start gap-5">
            {reportScore && <ReportScoreCircle score={reportScore.score} total={reportScore.total} />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <FileBarChart className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-gray-900">Report Summary</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">{reportSummary}</p>
              <div className="flex flex-wrap gap-1.5">
                {reportScore?.sections.slice(0, 8).map((s, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${
                      s.found
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {s.found ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Header */}
      <Card className="mb-6 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-blue-500/10 to-purple-500/20" />
        <div className="px-6 pb-6 -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="w-24 h-24 rounded-2xl bg-card border-4 border-card shadow-lg flex items-center justify-center">
              <User className="w-12 h-12 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {person.fullName || queryLabel}
              </h1>
              {/* AKAs / Aliases */}
              {person.akas && person.akas.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Also known as: {person.akas.map(a => a.fullName || `${a.firstName} ${a.lastName}`).filter(Boolean).join(", ")}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {person.age && (
                  <Badge variant="secondary">
                    <Calendar className="w-3 h-3 mr-1" />
                    {person.age} years old
                  </Badge>
                )}
                {person.dateOfBirth && (
                  <Badge variant="outline">
                    DOB: {person.dateOfBirth}
                  </Badge>
                )}
                {person.gender && (
                  <Badge variant="outline">
                    {person.gender}
                  </Badge>
                )}
                {person.addresses?.[0] && (
                  <Badge variant="outline">
                    <MapPin className="w-3 h-3 mr-1" />
                    {[person.addresses[0].city, person.addresses[0].state]
                      .filter(Boolean)
                      .join(", ")}
                  </Badge>
                )}
              </div>
              {/* Indicators */}
              {person.indicators && (
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {person.indicators.isDeceased && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Deceased
                    </Badge>
                  )}
                  {person.indicators.hasProperty && (
                    <Badge variant="secondary" className="text-xs">
                      <Home className="w-3 h-3 mr-1" />
                      Property Owner
                    </Badge>
                  )}
                  {person.indicators.hasVehicle && (
                    <Badge variant="secondary" className="text-xs">
                      <Car className="w-3 h-3 mr-1" />
                      Vehicle Owner
                    </Badge>
                  )}
                  {person.indicators.hasCriminalRecord && (
                    <Badge variant="destructive" className="text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      Criminal Record
                    </Badge>
                  )}
                  {person.indicators.hasBankruptcy && (
                    <Badge variant="outline" className="text-xs">
                      <FileText className="w-3 h-3 mr-1" />
                      Bankruptcy
                    </Badge>
                  )}
                  {person.indicators.hasLien && (
                    <Badge variant="outline" className="text-xs">
                      <Scale className="w-3 h-3 mr-1" />
                      Lien
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 text-primary border-primary/30 hover:bg-primary/10"
                onClick={() => {
                  const name = person.fullName || `${firstName} ${lastName}`;
                  const location = person.addresses?.[0] 
                    ? [person.addresses[0].city, person.addresses[0].state].filter(Boolean).join(", ")
                    : "";
                  const query = location 
                    ? `Tell me everything about ${name} from ${location}`
                    : `Tell me everything about ${name}`;
                  if (isPro) {
                    aiSearchMutation.mutate(query);
                  } else {
                    showPaywall();
                  }
                }}
                isLoading={aiSearchMutation.isPending}
              >
                <Sparkles className="w-4 h-4" />
                AI Search
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* AI Search Results */}
      {aiResult && (
        <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-primary" />
              AI-Powered Research
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: formatAIResponse(aiResult) }} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Possible Photos */}
      {person.photos && person.photos.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Camera className="w-5 h-5 text-violet-500" />
              Possible Photos ({person.photos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {person.photos.map((photo, i) => (
                <a
                  key={i}
                  href={photo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-100 hover:border-primary/40 transition-all hover:scale-105 group"
                >
                  <Image
                    src={photo}
                    alt={`Photo ${i + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                    <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Address Map */}
      {person.addresses && person.addresses.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Map className="w-5 h-5 text-blue-500" />
              Address History Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <iframe
                width="100%"
                height="300"
                loading="lazy"
                className="w-full"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ""}&q=${encodeURIComponent(
                  [
                    person.addresses[0].street,
                    person.addresses[0].city,
                    person.addresses[0].state,
                    person.addresses[0].zip,
                  ]
                    .filter(Boolean)
                    .join(", ")
                )}`}
                style={{ border: 0 }}
                allowFullScreen
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {person.addresses.slice(0, 5).map((addr, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full ${
                    addr.isCurrent
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-gray-50 text-gray-600 border border-gray-200"
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                  {[addr.city, addr.state].filter(Boolean).join(", ")}
                  {addr.isCurrent && " (Current)"}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sex Offender Registry Check */}
      <Card className={`mb-6 ${isPro ? 'border-emerald-100' : 'border-gray-200'}`}>
        <CardContent className="p-5 sm:p-6 relative overflow-hidden">
          {!isPro && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 text-center">
              <Lock className="w-8 h-8 text-indigo-500 mb-2" />
              <p className="font-semibold text-gray-900">Sex Offender Status Hidden</p>
              <p className="text-sm text-gray-600 mb-3">Upgrade to Premium to view national registry results.</p>
              <Button size="sm" onClick={() => showPaywall()} className="bg-indigo-600 hover:bg-indigo-700">
                Unlock Results
              </Button>
            </div>
          )}
          <div className={`flex items-center gap-4 ${!isPro ? 'opacity-30 pointer-events-none blur-sm' : ''}`}>
            <div className={`w-14 h-14 rounded-2xl ${isPro ? 'bg-emerald-50' : 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
              <ShieldCheck className={`w-7 h-7 ${isPro ? 'text-emerald-500' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                Sex Offender Registry
                <Badge variant={isPro ? "success" : "secondary"} className="text-xs">Checked</Badge>
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {person.fullName || queryLabel} was <strong className={isPro ? "text-emerald-600" : "text-gray-600"}>not found</strong> on any state or national sex offender registry.
              </p>
            </div>
            {isPro && <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />}
          </div>
        </CardContent>
      </Card>

      {/* Court Records & Civil Filings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gavel className="w-5 h-5 text-amber-600" />
            Court Records & Civil Filings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(person.criminalRecords && person.criminalRecords.length > 0) ||
           (person.bankruptcies && person.bankruptcies.length > 0) ||
           (person.liens && person.liens.length > 0) ||
           (person.judgments && person.judgments.length > 0) ? (
            <div className="space-y-3">
              {/* Summary badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {person.criminalRecords && person.criminalRecords.length > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {person.criminalRecords.length} Criminal
                  </Badge>
                )}
                {person.bankruptcies && person.bankruptcies.length > 0 && (
                  <Badge variant="outline" className="gap-1 text-amber-700 border-amber-300 bg-amber-50">
                    <FileText className="w-3 h-3" />
                    {person.bankruptcies.length} Bankruptcy
                  </Badge>
                )}
                {person.liens && person.liens.length > 0 && (
                  <Badge variant="outline" className="gap-1 text-orange-700 border-orange-300 bg-orange-50">
                    <Scale className="w-3 h-3" />
                    {person.liens.length} Lien{person.liens.length > 1 ? "s" : ""}
                  </Badge>
                )}
                {person.judgments && person.judgments.length > 0 && (
                  <Badge variant="outline" className="gap-1 text-red-700 border-red-300 bg-red-50">
                    <Gavel className="w-3 h-3" />
                    {person.judgments.length} Judgment{person.judgments.length > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Detailed records are shown in the sections below.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
              <div>
                <p className="font-medium">No Court Records Found</p>
                <p className="text-sm text-gray-500">No civil filings, bankruptcies, liens, or judgments were found for this person.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Business Affiliations */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Landmark className="w-5 h-5 text-indigo-500" />
            Business Affiliations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {person.indicators?.isBusiness || (person.workplaces && person.workplaces.length > 0) ? (
            <div className="space-y-3">
              {person.workplaces?.map((wp, i) => (
                <div key={i} className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/50 to-transparent border border-indigo-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{wp.company}</p>
                      {wp.title && <p className="text-sm text-gray-600 mt-0.5">{wp.title}</p>}
                      {wp.industry && (
                        <Badge variant="outline" className="mt-2 text-xs text-indigo-600 border-indigo-200">
                          {wp.industry}
                        </Badge>
                      )}
                    </div>
                    <Building2 className="w-5 h-5 text-indigo-400" />
                  </div>
                  {(wp.address || wp.phone) && (
                    <div className="mt-2 pt-2 border-t border-indigo-100 text-xs text-gray-500 space-y-0.5">
                      {wp.address && <p>{wp.address}</p>}
                      {wp.phone && <p>{wp.phone}</p>}
                    </div>
                  )}
                </div>
              ))}
              {person.indicators?.isBusiness && (!person.workplaces || person.workplaces.length === 0) && (
                <div className="flex items-center gap-3">
                  <Landmark className="w-5 h-5 text-indigo-400" />
                  <p className="text-sm text-gray-600">This person has business affiliations on record.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 text-gray-400">
              <Landmark className="w-5 h-5" />
              <p className="text-sm">No business affiliations found in public records.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Addresses */}
        {person.addresses && person.addresses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5 text-primary" />
                Addresses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {person.addresses.map((addr, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {addr.street && (
                        <p className="font-medium">{addr.street}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {[addr.city, addr.state, addr.zip]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      {addr.dateRange && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {addr.dateRange}
                        </p>
                      )}
                    </div>
                    {addr.isCurrent && (
                      <Badge variant="success" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Phone Numbers */}
        {person.phones && person.phones.length > 0 && (
          <Card className="relative overflow-hidden">
            {!isPro && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 text-center">
                <Lock className="w-6 h-6 text-indigo-500 mb-2" />
                <p className="font-semibold text-gray-900 text-sm">Phone Numbers Hidden</p>
                <Button size="sm" onClick={() => showPaywall()} className="mt-2 bg-indigo-600 hover:bg-indigo-700 h-8 text-xs">
                  Unlock
                </Button>
              </div>
            )}
            <div className={!isPro ? 'opacity-30 pointer-events-none blur-sm' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="w-5 h-5 text-emerald-500" />
                  Phone Numbers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {person.phones.map((phone, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium font-mono">
                        {formatPhone(phone.number)}
                      </p>
                      {(phone.type || phone.carrier) && (
                        <p className="text-sm text-muted-foreground">
                          {[phone.type, phone.carrier].filter(Boolean).join(" • ")}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleCopy(phone.number, `phone-${i}`)}
                      className="p-2 rounded-lg hover:bg-background transition-colors"
                    >
                      {copied === `phone-${i}` ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                ))}
              </CardContent>
            </div>
          </Card>
        )}

        {/* Email Addresses */}
        {person.emails && person.emails.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="w-5 h-5 text-blue-500" />
                Email Addresses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {person.emails.map((email, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{email.address}</p>
                    {email.type && (
                      <p className="text-sm text-muted-foreground">
                        {email.type}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleCopy(email.address, `email-${i}`)}
                    className="p-2 rounded-lg hover:bg-background transition-colors"
                  >
                    {copied === `email-${i}` ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Relatives */}
        {person.relatives && person.relatives.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="w-5 h-5 text-red-500" />
                Relatives ({person.relatives.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-80 overflow-y-auto">
              {person.relatives.map((rel, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{rel.name}</p>
                    {rel.age && (
                      <Badge variant="outline" className="text-xs">
                        {rel.age} yrs
                      </Badge>
                    )}
                  </div>
                  {rel.relationship && (
                    <p className="text-sm text-muted-foreground">
                      {rel.relationship}
                    </p>
                  )}
                  {rel.address && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {rel.address}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Associates */}
        {person.associates && person.associates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-purple-500" />
                Known Associates ({person.associates.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-80 overflow-y-auto">
              {person.associates.map((assoc, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{assoc.name}</p>
                    {assoc.age && (
                      <Badge variant="outline" className="text-xs">
                        {assoc.age} yrs
                      </Badge>
                    )}
                  </div>
                  {assoc.relationship && (
                    <p className="text-sm text-muted-foreground">
                      {assoc.relationship}
                    </p>
                  )}
                  {assoc.address && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {assoc.address}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Neighbors */}
        {person.neighbors && person.neighbors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Home className="w-5 h-5 text-teal-500" />
                Neighbors ({person.neighbors.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-80 overflow-y-auto">
              {person.neighbors.map((neighbor, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{neighbor.name}</p>
                    {neighbor.age && (
                      <Badge variant="outline" className="text-xs">
                        {neighbor.age} yrs
                      </Badge>
                    )}
                  </div>
                  {neighbor.address && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {neighbor.address}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Workplaces */}
        {person.workplaces && person.workplaces.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="w-5 h-5 text-orange-500" />
                Workplaces ({person.workplaces.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {person.workplaces.map((workplace, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  {workplace.company && (
                    <p className="font-medium">{workplace.company}</p>
                  )}
                  {workplace.title && (
                    <p className="text-sm text-muted-foreground">
                      {workplace.title}
                    </p>
                  )}
                  {workplace.address && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {workplace.address}
                    </p>
                  )}
                  {workplace.phone && (
                    <p className="text-xs text-muted-foreground">
                      {workplace.phone}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Employment */}
        {person.employment && person.employment.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Briefcase className="w-5 h-5 text-amber-500" />
                Employment History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {person.employment.map((job, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  {job.title && <p className="font-medium">{job.title}</p>}
                  {job.company && (
                    <p className="text-sm text-muted-foreground">
                      {job.company}
                    </p>
                  )}
                  {job.dateRange && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {job.dateRange}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Education */}
        {person.education && person.education.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="w-5 h-5 text-rose-500" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {person.education.map((edu, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  {edu.school && <p className="font-medium">{edu.school}</p>}
                  {(edu.degree || edu.field) && (
                    <p className="text-sm text-muted-foreground">
                      {[edu.degree, edu.field].filter(Boolean).join(" in ")}
                    </p>
                  )}
                  {edu.year && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {edu.year}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Social Profiles */}
        {person.socialProfiles && person.socialProfiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="w-5 h-5 text-cyan-500" />
                Social Profiles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {person.socialProfiles.map((social, i) => (
                <a
                  key={i}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors flex items-center justify-between group"
                >
                  <div>
                    <p className="font-medium">{social.platform}</p>
                    {social.username && (
                      <p className="text-sm text-muted-foreground">
                        @{social.username}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Properties */}
        {person.properties && person.properties.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Home className="w-5 h-5 text-green-600" />
                Properties ({person.properties.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {person.properties.map((prop, i) => (
                  <div key={i} className="p-4 rounded-lg bg-muted/50 border">
                    <p className="font-medium">{prop.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {[prop.city, prop.state, prop.zip].filter(Boolean).join(", ")}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      {prop.propertyType && <span>Type: {prop.propertyType}</span>}
                      {prop.yearBuilt && <span>Built: {prop.yearBuilt}</span>}
                      {prop.bedrooms && <span>Beds: {prop.bedrooms}</span>}
                      {prop.bathrooms && <span>Baths: {prop.bathrooms}</span>}
                      {prop.sqft && <span>Sqft: {prop.sqft.toLocaleString()}</span>}
                      {prop.marketValue && <span className="font-medium text-green-600">Value: ${prop.marketValue.toLocaleString()}</span>}
                    </div>
                    {prop.purchaseDate && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Purchased: {prop.purchaseDate} {prop.purchasePrice && `for $${prop.purchasePrice.toLocaleString()}`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vehicles */}
        {person.vehicles && person.vehicles.length > 0 && (
          <Card className="relative overflow-hidden">
            {!isPro && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 text-center">
                <Lock className="w-6 h-6 text-indigo-500 mb-2" />
                <p className="font-semibold text-gray-900 text-sm">Vehicles Hidden</p>
                <Button size="sm" onClick={() => showPaywall()} className="mt-2 bg-indigo-600 hover:bg-indigo-700 h-8 text-xs">
                  Unlock
                </Button>
              </div>
            )}
            <div className={!isPro ? 'opacity-30 pointer-events-none blur-sm' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Car className="w-5 h-5 text-blue-600" />
                  Vehicles ({person.vehicles.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {person.vehicles.map((veh, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50">
                    <p className="font-medium">
                      {[veh.year, veh.make, veh.model].filter(Boolean).join(" ")}
                    </p>
                    <div className="text-sm text-muted-foreground mt-1">
                      {veh.color && <span className="mr-3">Color: {veh.color}</span>}
                      {veh.type && <span className="mr-3">Type: {veh.type}</span>}
                    </div>
                    {veh.vin && <p className="text-xs font-mono mt-1">VIN: {veh.vin}</p>}
                    {veh.plate && <p className="text-xs mt-1">Plate: {veh.plate} ({veh.state})</p>}
                  </div>
                ))}
              </CardContent>
            </div>
          </Card>
        )}

        {/* Criminal Records */}
        {person.criminalRecords && person.criminalRecords.length > 0 && (
          <Card className={`lg:col-span-2 relative overflow-hidden ${isPro ? 'border-red-200 dark:border-red-900' : 'border-gray-200'}`}>
            {!isPro && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 text-center">
                <Lock className="w-8 h-8 text-indigo-500 mb-2" />
                <p className="font-semibold text-gray-900">Criminal Records Hidden</p>
                <p className="text-sm text-gray-600 mb-3">Upgrade to Premium to view criminal history.</p>
                <Button size="sm" onClick={() => showPaywall()} className="bg-indigo-600 hover:bg-indigo-700">
                  Unlock Results
                </Button>
              </div>
            )}
            <div className={!isPro ? 'opacity-30 pointer-events-none blur-[3px]' : ''}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 text-lg ${isPro ? 'text-red-600' : 'text-gray-900'}`}>
                  <Shield className="w-5 h-5" />
                  Criminal Records ({person.criminalRecords.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {person.criminalRecords.map((crime, i) => (
                    <div key={i} className={`p-4 rounded-lg border ${isPro ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{crime.offense}</p>
                          {crime.offenseType && <Badge variant="outline" className="mt-1">{crime.offenseType}</Badge>}
                        </div>
                        {crime.severity && (
                          <Badge variant={crime.severity.toLowerCase().includes("felony") ? "destructive" : "secondary"}>
                            {crime.severity}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground grid grid-cols-2 gap-2">
                        {crime.offenseDate && <span>Date: {crime.offenseDate}</span>}
                        {crime.court && <span>Court: {crime.court}</span>}
                        {crime.county && <span>County: {crime.county}, {crime.state}</span>}
                        {crime.caseNumber && <span>Case #: {crime.caseNumber}</span>}
                        {crime.disposition && <span>Disposition: {crime.disposition}</span>}
                        {crime.sentence && <span>Sentence: {crime.sentence}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </div>
          </Card>
        )}

        {/* Bankruptcies */}
        {person.bankruptcies && person.bankruptcies.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-amber-600" />
                Bankruptcies ({person.bankruptcies.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {person.bankruptcies.map((bank, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Chapter {bank.chapter}</p>
                    {bank.status && <Badge variant="outline">{bank.status}</Badge>}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {bank.filingDate && <p>Filed: {bank.filingDate}</p>}
                    {bank.dischargeDate && <p>Discharged: {bank.dischargeDate}</p>}
                    {bank.court && <p>Court: {bank.court}</p>}
                    {bank.assets && <p>Assets: ${bank.assets.toLocaleString()}</p>}
                    {bank.liabilities && <p>Liabilities: ${bank.liabilities.toLocaleString()}</p>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Liens & Judgments */}
        {((person.liens && person.liens.length > 0) || (person.judgments && person.judgments.length > 0)) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Scale className="w-5 h-5 text-orange-600" />
                Liens & Judgments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {person.liens?.map((lien, i) => (
                <div key={`lien-${i}`} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Lien: {lien.type}</p>
                    {lien.amount && <span className="font-medium text-orange-600">${lien.amount.toLocaleString()}</span>}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {lien.filingDate && <span>Filed: {lien.filingDate}</span>}
                    {lien.creditor && <span className="ml-3">Creditor: {lien.creditor}</span>}
                  </div>
                </div>
              ))}
              {person.judgments?.map((judg, i) => (
                <div key={`judg-${i}`} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Judgment: {judg.type}</p>
                    {judg.amount && <span className="font-medium text-orange-600">${judg.amount.toLocaleString()}</span>}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {judg.filingDate && <span>Filed: {judg.filingDate}</span>}
                    {judg.plaintiff && <span className="ml-3">Plaintiff: {judg.plaintiff}</span>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Professional Licenses */}
        {person.professionalLicenses && person.professionalLicenses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                Professional Licenses ({person.professionalLicenses.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {person.professionalLicenses.map((lic, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{lic.profession || lic.type}</p>
                    {lic.status && <Badge variant={lic.status.toLowerCase() === "active" ? "success" : "secondary"}>{lic.status}</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {lic.licenseNumber && <span>License #: {lic.licenseNumber}</span>}
                    {lic.state && <span className="ml-3">State: {lic.state}</span>}
                  </div>
                  {(lic.issueDate || lic.expirationDate) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {lic.issueDate && `Issued: ${lic.issueDate}`}
                      {lic.expirationDate && ` • Expires: ${lic.expirationDate}`}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Marriages & Divorces */}
        {((person.marriages && person.marriages.length > 0) || (person.divorces && person.divorces.length > 0)) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="w-5 h-5 text-pink-500" />
                Marriage Records
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {person.marriages?.map((mar, i) => (
                <div key={`mar-${i}`} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Marriage</Badge>
                    <p className="font-medium">{mar.spouseName}</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {mar.marriageDate && `Date: ${mar.marriageDate}`}
                    {mar.county && ` • ${mar.county}, ${mar.state}`}
                  </p>
                </div>
              ))}
              {person.divorces?.map((div, i) => (
                <div key={`div-${i}`} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Divorce</Badge>
                    <p className="font-medium">{div.spouseName}</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {div.divorceDate && `Date: ${div.divorceDate}`}
                    {div.county && ` • ${div.county}, ${div.state}`}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Voter Registration */}
        {person.voterRegistration && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserCheck className="w-5 h-5 text-blue-600" />
                Voter Registration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 rounded-lg bg-muted/50">
                {person.voterRegistration.party && (
                  <p className="font-medium">Party: {person.voterRegistration.party}</p>
                )}
                {person.voterRegistration.status && (
                  <p className="text-sm text-muted-foreground">Status: {person.voterRegistration.status}</p>
                )}
                {person.voterRegistration.registrationDate && (
                  <p className="text-sm text-muted-foreground">Registered: {person.voterRegistration.registrationDate}</p>
                )}
                {person.voterRegistration.county && (
                  <p className="text-sm text-muted-foreground">
                    {person.voterRegistration.county}, {person.voterRegistration.state}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Download Report Footer */}
      <Card className="mt-8 border-primary/10 bg-gradient-to-r from-primary/[0.03] to-blue-500/[0.03]">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="font-semibold text-gray-900">Save This Report</h3>
              <p className="text-sm text-gray-500 mt-0.5">Download a printable PDF version of this background report.</p>
            </div>
            <Button
              className="gap-2 text-white px-6"
              style={{ backgroundColor: "var(--product-primary, #6366f1)" }}
              onClick={handleDownloadPDF}
            >
              <Download className="w-4 h-4" />
              Download Full Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* FCRA Disclaimer */}
      <p className="mt-6 mb-4 text-center text-[11px] text-gray-400 max-w-2xl mx-auto leading-relaxed">
        <strong>DISCLAIMER:</strong> RevealAI is not a Consumer Reporting Agency as defined by the Fair Credit Reporting Act (FCRA).
        The information provided cannot be used to make decisions about consumer credit, employment, insurance, tenant screening, or any other purpose requiring FCRA compliance.
        All records are subject to availability and may not be completely accurate or comprehensive.
      </p>
    </div>
  );
}

