"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AtSign,
  ArrowRight,
  Globe,
  Heart,
  Search,
  Shield,
  User,
  Users,
  MapPin,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription } from "@/hooks/use-subscription";
import { getSearchProduct } from "@/lib/search-products";

export default function SocialSearchPage() {
  const router = useRouter();
  const { isPro, showFreeTrialPaywall } = useSubscription();
  const product = getSearchProduct("social");
  const socialAccent = product.theme.primary;
  const socialAccentHover = product.theme.primaryHover;
  const socialAccentSoft = product.theme.soft;
  const socialAccentBorder = product.theme.softBorder;
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
        title="Dating Apps Search"
        description="Search dating-app clues, public profiles, and online presence by name"
        icon={AtSign}
        iconColor="text-[#E1306C]"
        iconBgColor="bg-[#E1306C]/10"
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
          <CardTitle className="text-lg">Search Dating Apps</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Enter a name and location to look for dating-app-related clues, linked public profiles, and online presence signals.
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
            style={{ backgroundColor: socialAccent }}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = socialAccentHover;
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = socialAccent;
            }}
          >
            <Search className="w-5 h-5" />
            {product.home.ctaLabel}
            <ArrowRight className="w-4 h-4" />
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {[
              {
                icon: Heart,
                title: "Dating Safety",
                description:
                  "Check dating-profile context and linked public accounts before meeting someone in person.",
              },
              {
                icon: Globe,
                title: "Online Presence",
                description:
                  "Look for public profile matches and visible web presence tied to a real person.",
              },
              {
                icon: Shield,
                title: "Trust Verification",
                description:
                  "Use public online signals to verify consistency before you keep going.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl bg-muted/50 p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="rounded-xl p-2"
                    style={{ backgroundColor: socialAccentSoft }}
                  >
                    <item.icon
                      className="w-5 h-5"
                      style={{ color: socialAccent }}
                    />
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
              borderColor: socialAccentBorder,
              backgroundColor: socialAccentSoft,
              color: socialAccent,
            }}
          >
            <span className="font-medium">Need a handle-based search?</span>{" "}
            Use <Link href={product.usernameHelperPath ?? "/username"} className="underline underline-offset-2">Username Search</Link> when you already know the account name.
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <div
              className="rounded-lg p-2"
              style={{ backgroundColor: socialAccentSoft }}
            >
              <Users className="w-5 h-5" style={{ color: socialAccent }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Name-Based Social Search</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Best when you know the person but do not know their usernames yet.
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <div
              className="rounded-lg p-2"
              style={{ backgroundColor: socialAccentSoft }}
            >
              <Globe className="w-5 h-5" style={{ color: socialAccent }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Broader Online Context</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Search social accounts, dating clues, and public online mentions from one tool.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
