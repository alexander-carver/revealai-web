"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import Link from "next/link";
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

export default function PersonProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { isPro, showPaywall } = useSubscription();
  const [profile, setProfile] = useState<PersonProfileState | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);

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

  useEffect(() => {
    if (id) {
      profileMutation.mutate();
    }
  }, [id]);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

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
    <div>
      {/* Back Button */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/search">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </Button>
        </Link>
      </div>

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
          <Card>
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
          <Card>
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
          </Card>
        )}

        {/* Criminal Records */}
        {person.criminalRecords && person.criminalRecords.length > 0 && (
          <Card className="lg:col-span-2 border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-red-600">
                <Shield className="w-5 h-5" />
                Criminal Records ({person.criminalRecords.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {person.criminalRecords.map((crime, i) => (
                  <div key={i} className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
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
    </div>
  );
}

