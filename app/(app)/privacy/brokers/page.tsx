"use client";

import { useState } from "react";
import {
  Globe,
  ArrowLeft,
  ExternalLink,
  Clock,
  CheckCircle,
  Search,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DATA_BROKERS, type DataBroker } from "@/lib/services/privacy";

export default function DataBrokersPage() {
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [completedBrokers, setCompletedBrokers] = useState<Set<string>>(
    new Set()
  );

  const filteredBrokers = DATA_BROKERS.filter((broker) => {
    const matchesSearch = broker.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesDifficulty =
      difficultyFilter === "all" || broker.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  const toggleCompleted = (brokerName: string) => {
    setCompletedBrokers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(brokerName)) {
        newSet.delete(brokerName);
      } else {
        newSet.add(brokerName);
      }
      return newSet;
    });
  };

  const completedCount = completedBrokers.size;
  const progressPercent = Math.round(
    (completedCount / DATA_BROKERS.length) * 100
  );

  return (
    <div>
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/privacy">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Privacy
          </Button>
        </Link>
      </div>

      <PageHeader
        title="Data Broker Removal"
        description="Remove your personal information from data broker websites"
        icon={Globe}
        iconColor="text-amber-500"
        iconBgColor="bg-amber-500/10"
      />

      {/* Progress Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold">Your Progress</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {completedCount} of {DATA_BROKERS.length} brokers completed
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-48 h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-success transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-sm font-medium">{progressPercent}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Search brokers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="w-4 h-4" />}
          className="sm:max-w-xs"
        />
        <Tabs
          value={difficultyFilter}
          onValueChange={setDifficultyFilter}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="easy">Easy</TabsTrigger>
            <TabsTrigger value="medium">Medium</TabsTrigger>
            <TabsTrigger value="hard">Hard</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Broker List */}
      <div className="space-y-4">
        {filteredBrokers.map((broker) => (
          <BrokerCard
            key={broker.name}
            broker={broker}
            isCompleted={completedBrokers.has(broker.name)}
            onToggleComplete={() => toggleCompleted(broker.name)}
          />
        ))}
      </div>

      {filteredBrokers.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No brokers match your search criteria.
          </p>
        </Card>
      )}
    </div>
  );
}

function BrokerCard({
  broker,
  isCompleted,
  onToggleComplete,
}: {
  broker: DataBroker;
  isCompleted: boolean;
  onToggleComplete: () => void;
}) {
  const difficultyColors = {
    easy: { bg: "bg-success/10", text: "text-success" },
    medium: { bg: "bg-amber-500/10", text: "text-amber-500" },
    hard: { bg: "bg-destructive/10", text: "text-destructive" },
  };

  const style = difficultyColors[broker.difficulty];

  return (
    <Card
      className={`transition-all ${
        isCompleted ? "border-success/50 bg-success/5" : ""
      }`}
    >
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleComplete}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                isCompleted
                  ? "bg-success text-white"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {isCompleted ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Globe className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            <div>
              <h3
                className={`font-semibold ${
                  isCompleted ? "line-through text-muted-foreground" : ""
                }`}
              >
                {broker.name}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <Badge className={`${style.bg} ${style.text} border-0 text-xs`}>
                  {broker.difficulty}
                </Badge>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {broker.timeEstimate}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pl-14 sm:pl-0">
            <a
              href={broker.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Visit Site
            </a>
            <a
              href={broker.optOutUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" className="gap-2">
                Opt Out
                <ExternalLink className="w-3 h-3" />
              </Button>
            </a>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 pl-14 text-sm text-muted-foreground">
          <p>
            <strong>Steps:</strong> Visit the opt-out page, search for your
            name, and follow the removal process. You may need to verify your
            identity via email.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

