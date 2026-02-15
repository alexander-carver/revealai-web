"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  History,
  Search,
  Phone,
  FileText,
  AtSign,
  Car,
  Trash2,
  Clock,
  Crown,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import {
  getSearchHistory,
  removeSearchHistoryItem,
  clearSearchHistory,
  getTypeLabel,
  getTypeColor,
  type SearchHistoryItem,
} from "@/lib/search-history";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";

const typeIcons: Record<SearchHistoryItem["type"], React.ElementType> = {
  people: Search,
  phone: Phone,
  records: FileText,
  username: AtSign,
  vehicle: Car,
};

const typeRoutes: Record<SearchHistoryItem["type"], string> = {
  people: "/search",
  phone: "/phone",
  records: "/records",
  username: "/username",
  vehicle: "/vehicle",
};

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function HistoryPage() {
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setHistory(getSearchHistory());
    setLoaded(true);
  }, []);

  const handleRemove = (id: string) => {
    removeSearchHistoryItem(id);
    setHistory(getSearchHistory());
  };

  const handleClearAll = () => {
    clearSearchHistory();
    setHistory([]);
  };

  if (!loaded) return null;

  return (
    <div>
      <PageHeader
        title="Search History"
        description="Your recent searches — stored locally on your device"
        icon={History}
        iconColor="text-gray-500"
        iconBgColor="bg-gray-500/10"
      />

      {!isPro && (
        <Alert variant="info" className="mb-6">
          <Crown className="w-4 h-4 text-amber-500" />
          <div>
            <strong>Pro Feature:</strong> Upgrade to Pro to save unlimited searches and access them across sessions.
          </div>
        </Alert>
      )}

      {history.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <History className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No search history yet</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Your searches will appear here as you use RevealAI
            </p>
            <Link href="/search">
              <Button className="gap-2">
                <Search className="w-4 h-4" />
                Start Searching
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {history.length} search{history.length !== 1 ? "es" : ""}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={handleClearAll}
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </Button>
          </div>

          <div className="space-y-2">
            {history.map((item) => {
              const Icon = typeIcons[item.type];
              const colors = getTypeColor(item.type);
              return (
                <Card
                  key={item.id}
                  className="hover:border-primary/30 transition-colors group"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${colors.bg} flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium truncate">{item.query}</span>
                          <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                            {getTypeLabel(item.type)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(item.timestamp)}
                          {item.preview && (
                            <>
                              <span>&middot;</span>
                              <span className="truncate">{item.preview}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Link href={typeRoutes[item.type]}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Search again"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                          title="Remove"
                          onClick={() => handleRemove(item.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
