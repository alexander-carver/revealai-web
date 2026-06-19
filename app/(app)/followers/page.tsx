"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AtSign,
  ArrowRight,
  Heart,
  Search,
  Shield,
  User,
  Users,
  MapPin,
  Waypoints,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription } from "@/hooks/use-subscription";
import { getSearchProduct } from "@/lib/search-products";

export default function FollowersSearchPage() {
  const router = useRouter();
  const { isPro, showFreeTrialPaywall } = useSubscription();
  const product = getSearchProduct("followers");
  const accent = product.theme.primary;
  const accentHover = product.theme.primaryHover;
  const accentSoft = product.theme.soft;
  const accentBorder = product.theme.softBorder;
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    city: "",
    state: "",
  });

  const handleSearch = useCallback(() => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      return;
    }

    if (!isPro) {
      showFreeTrialPaywall();
      return;
    }

    const params = new URLSearchParams({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      type: product.searchType,
    });

    if (formData.city.trim()) {
      params.set("city", formData.city.trim());
    }
    if (formData.state.trim()) {
      params.set("state", formData.state.trim());
    }

    router.push(`/search/result?${params.toString()}`);
  }, [formData, isPro, product.searchType, router, showFreeTrialPaywall]);

  return (
    <div>
      <PageHeader
        title="Followers Search"
        description="Check public follower red flags, one-sided follows, and suspicious account patterns by name"
        icon={Users}
        iconColor="text-[#FD5068]"
        iconBgColor="bg-[#FD5068]/10"
      >
        <Link href={product.usernameHelperPath ?? "/username"}>
          <Button variant="outline" className="gap-2">
            <AtSign className="w-4 h-4" />
            Search by Username Instead
          </Button>
        </Link>
      </PageHeader>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Search Follower Red Flags</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Enter a name and location to review public follow-back patterns, suspicious account clusters, and social graph warning signs.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="First Name *"
              value={formData.firstName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, firstName: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              icon={<User className="w-4 h-4" />}
            />
            <Input
              placeholder="Last Name *"
              value={formData.lastName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, lastName: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              icon={<User className="w-4 h-4" />}
            />
            <Input
              placeholder="City (optional)"
              value={formData.city}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, city: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              icon={<MapPin className="w-4 h-4" />}
            />
            <Input
              placeholder="State (optional)"
              value={formData.state}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, state: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              icon={<MapPin className="w-4 h-4" />}
            />
          </div>

          <Button
            onClick={handleSearch}
            size="lg"
            className="w-full mt-6 gap-2 text-white"
            style={{ backgroundColor: accent }}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = accentHover;
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = accent;
            }}
          >
            <Search className="w-5 h-5" />
            {product.home.ctaLabel}
            <ArrowRight className="w-4 h-4" />
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {[
              {
                icon: Users,
                title: "One-Sided Follows",
                description:
                  "Check for public accounts they follow that do not appear to follow back.",
              },
              {
                icon: Heart,
                title: "Suspicious Interest Patterns",
                description:
                  "Spot heavy clusters of apparent women or men they do not seem personally connected to.",
              },
              {
                icon: Shield,
                title: "Low-Trust Signals",
                description:
                  "Flag burner-like, bait, or low-quality account patterns that change how the profile reads.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl bg-muted/50 p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="rounded-xl p-2"
                    style={{ backgroundColor: accentSoft }}
                  >
                    <item.icon className="w-5 h-5" style={{ color: accent }} />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            className="mt-6 rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor: accentBorder,
              backgroundColor: accentSoft,
              color: accent,
            }}
          >
            <span className="font-medium">Need an account-first search?</span>{" "}
            Use <Link href={product.usernameHelperPath ?? "/username"} className="underline underline-offset-2">Username Search</Link> when you already know the handle you want to review.
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <div
              className="rounded-lg p-2"
              style={{ backgroundColor: accentSoft }}
            >
              <Waypoints className="w-5 h-5" style={{ color: accent }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Public Social Graph Review</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Best when you want to understand what the visible follower network is signaling around a profile.
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <div
              className="rounded-lg p-2"
              style={{ backgroundColor: accentSoft }}
            >
              <Shield className="w-5 h-5" style={{ color: accent }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Red Flag Summary</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Review public non-follow-backs, suspicious clusters, and visible interest patterns from one tool.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
