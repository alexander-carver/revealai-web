"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  ArrowRight,
  Globe,
  Lock,
  Clock,
  ChevronRight,
  KeyRound,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import {
  calculateExposureScore,
  getExposureLevel,
  DATA_BROKERS,
  type DataBroker,
} from "@/lib/services/privacy";
import { useSubscription } from "@/hooks/use-subscription";

// Mock exposed categories for demo
const MOCK_EXPOSED = [
  "Phone Numbers",
  "Email Addresses",
  "Home Addresses",
  "Social Media",
];

export default function PrivacyPage() {
  const { isPro, showFreeTrialPaywall } = useSubscription();
  const exposureData = calculateExposureScore(MOCK_EXPOSED);
  const { level, color } = getExposureLevel(
    exposureData.score,
    exposureData.maxScore
  );
  const percentage = Math.round(
    (exposureData.score / exposureData.maxScore) * 100
  );

  return (
    <div>
      <PageHeader
        title="Privacy Tools"
        description="Protect your personal information and remove yourself from data brokers"
        icon={Shield}
        iconColor="text-rose-500"
        iconBgColor="bg-rose-500/10"
      />

      {/* Exposure Score Card */}
      <Card className="mb-6 overflow-hidden">
        <div className="h-4 bg-gradient-to-r from-green-500 via-amber-500 to-red-500">
          <div
            className="h-full bg-card"
            style={{ marginLeft: `${percentage}%` }}
          />
        </div>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">
                Your Exposure Score
              </h2>
              <div className="flex items-baseline gap-3">
                <span className={`text-5xl font-bold ${color}`}>
                  {exposureData.score}
                </span>
                <span className="text-muted-foreground">
                  / {exposureData.maxScore}
                </span>
              </div>
              <Badge
                variant={
                  level === "Low"
                    ? "success"
                    : level === "Moderate"
                    ? "warning"
                    : "destructive"
                }
                className="mt-2"
              >
                {level} Risk
              </Badge>
            </div>
            <div className="flex-1 max-w-md">
              <p className="text-sm text-muted-foreground mb-4">
                Your personal data is exposed in {MOCK_EXPOSED.length} categories.
                Remove your information from data brokers to lower your score.
              </p>
              {isPro ? (
                <Link href="/privacy/scan">
                  <Button className="gap-2">
                    <Eye className="w-4 h-4" />
                    Run Full Privacy Scan
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <Button 
                  className="gap-2"
                  onClick={showFreeTrialPaywall}
                >
                  <Eye className="w-4 h-4" />
                  Run Full Privacy Scan
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link href="/privacy/remove">
          <Card className="p-5 hover:border-primary/50 transition-all cursor-pointer group h-full">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-rose-500/10">
                <EyeOff className="w-6 h-6 text-rose-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  Remove From Search
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Opt out of having your profile appear in searches
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Card>
        </Link>

        <Link href="/privacy/brokers">
          <Card className="p-5 hover:border-primary/50 transition-all cursor-pointer group h-full">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <Globe className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  Data Broker Removal
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Step-by-step guides to remove yourself from data brokers
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Card>
        </Link>

        <Link href="/privacy/password-checker">
          <Card className="p-5 hover:border-primary/50 transition-all cursor-pointer group h-full">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-indigo-500/10">
                <KeyRound className="w-6 h-6 text-indigo-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  Password Strength Checker
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Test your password security — 100% private, runs locally
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Card>
        </Link>
      </div>

      {/* Exposure Categories */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Exposure Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {exposureData.categories.map((category) => (
              <div
                key={category.name}
                className={`p-4 rounded-xl border ${
                  category.exposed
                    ? "border-destructive/30 bg-destructive/5"
                    : "border-success/30 bg-success/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  {category.exposed ? (
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-success" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{category.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {category.description}
                    </p>
                  </div>
                  <Badge
                    variant={
                      category.severity === "high"
                        ? "destructive"
                        : category.severity === "medium"
                        ? "warning"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {category.severity}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Brokers Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Popular Data Brokers</CardTitle>
          <Link href="/privacy/brokers">
            <Button variant="ghost" size="sm" className="gap-1">
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DATA_BROKERS.slice(0, 4).map((broker) => (
              <DataBrokerRow key={broker.name} broker={broker} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DataBrokerRow({ broker }: { broker: DataBroker }) {
  const difficultyColors = {
    easy: "text-success",
    medium: "text-amber-500",
    hard: "text-destructive",
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center">
          <Globe className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">{broker.name}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span className={difficultyColors[broker.difficulty]}>
              {broker.difficulty} removal
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {broker.timeEstimate}
            </span>
          </div>
        </div>
      </div>
      <a
        href={broker.optOutUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm text-primary hover:underline"
      >
        Opt Out
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}

