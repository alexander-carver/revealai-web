"use client";

import { useState } from "react";
import {
  DollarSign,
  MapPin,
  ExternalLink,
  Info,
  CheckCircle,
  Lock,
  Building2,
  ChevronDown,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { US_STATES, getStateUrl, getStateName } from "@/lib/services/unclaimed-money";
import { useSubscription } from "@/hooks/use-subscription";

export default function UnclaimedMoneyPage() {
  const [selectedState, setSelectedState] = useState("TX");
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [hasShownPaywall, setHasShownPaywall] = useState(false);
  const { showFreeTrialPaywall, isFreeTrialPaywallVisible, isPro } = useSubscription();

  const handleContinue = () => {
    if (dontShowAgain) {
      localStorage.setItem("um_skip_disclaimer", "true");
    }
    setShowDisclaimer(false);
  };

  const handleOpenSearch = () => {
    // If user is Pro, skip paywall and redirect immediately
    if (isPro) {
      const url = getStateUrl(selectedState);
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    // First click: show paywall
    if (!hasShownPaywall) {
      setHasShownPaywall(true);
      showFreeTrialPaywall();
      return;
    }
    
    // Second click (after paywall was shown): redirect
    const url = getStateUrl(selectedState);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const stateOptions = US_STATES.map((state) => ({
    value: state.code,
    label: `${state.code} - ${state.name}`,
  }));

  // Check if we should skip disclaimer on mount
  useState(() => {
    if (typeof window !== "undefined") {
      const skip = localStorage.getItem("um_skip_disclaimer");
      if (skip === "true") {
        setShowDisclaimer(false);
      }
    }
  });

  return (
    <div>
      <PageHeader
        title="Unclaimed Money"
        description="Find money that may be owed to you by state governments"
        icon={DollarSign}
        iconColor="text-green-500"
        iconBgColor="bg-green-500/10"
      />

      {showDisclaimer ? (
        <DisclaimerCard
          onContinue={handleContinue}
          dontShowAgain={dontShowAgain}
          setDontShowAgain={setDontShowAgain}
        />
      ) : (
        <SearchCard
          selectedState={selectedState}
          setSelectedState={setSelectedState}
          stateOptions={stateOptions}
          onSearch={handleOpenSearch}
        />
      )}
    </div>
  );
}

function DisclaimerCard({
  onContinue,
  dontShowAgain,
  setDontShowAgain,
}: {
  onContinue: () => void;
  dontShowAgain: boolean;
  setDontShowAgain: (value: boolean) => void;
}) {
  return (
    <Card>
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
          <DollarSign className="w-8 h-8 text-green-500" />
        </div>
        <CardTitle className="text-xl">Before You Continue</CardTitle>
      </CardHeader>
      <CardContent className="max-w-lg mx-auto">
        <div className="space-y-4 mb-6">
          <InfoItem
            icon={CheckCircle}
            iconColor="text-green-500"
            text="We route you to **official state unclaimed property** searches (NAUPA/MissingMoney or your state site)."
          />
          <InfoItem
            icon={DollarSign}
            iconColor="text-green-500"
            text="**Searches and claims are free.**"
          />
          <InfoItem
            icon={Lock}
            iconColor="text-blue-500"
            text="We **don't collect SSNs** or file claims for you."
          />
          <InfoItem
            icon={Building2}
            iconColor="text-purple-500"
            text="RevealAI is **not affiliated** with any government agency."
          />
        </div>

        <label className="flex items-center gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="w-5 h-5 rounded border-border"
          />
          <span className="text-sm">Don&apos;t show this again</span>
        </label>

        <Button onClick={onContinue} size="lg" className="w-full gap-2">
          <CheckCircle className="w-5 h-5" />
          I Understand • Continue
        </Button>

        <Alert variant="info" className="mt-6">
          <Info className="w-4 h-4" />
          <div>
            <strong>Helpful:</strong> Use your legal name and current/previous
            addresses. You&apos;ll complete any claim on your state&apos;s
            official site.
          </div>
        </Alert>
      </CardContent>
    </Card>
  );
}

function InfoItem({
  icon: Icon,
  iconColor,
  text,
}: {
  icon: React.ElementType;
  iconColor: string;
  text: string;
}) {
  // Parse markdown-style bold text
  const parts = text.split(/\*\*(.*?)\*\*/g);

  return (
    <div className="flex items-start gap-3">
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
      <p className="text-sm">
        {parts.map((part, i) =>
          i % 2 === 1 ? <strong key={i}>{part}</strong> : part
        )}
      </p>
    </div>
  );
}

function SearchCard({
  selectedState,
  setSelectedState,
  stateOptions,
  onSearch,
}: {
  selectedState: string;
  setSelectedState: (state: string) => void;
  stateOptions: { value: string; label: string }[];
  onSearch: () => void;
}) {
  return (
    <Card>
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
          <DollarSign className="w-8 h-8 text-green-500" />
        </div>
        <CardTitle className="text-xl">Find Money by State</CardTitle>
        <p className="text-muted-foreground mt-2">
          Pick a state and we&apos;ll open the official search.
        </p>
      </CardHeader>
      <CardContent className="max-w-md mx-auto">
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Select Your State
          </label>
          <Select
            value={selectedState}
            onChange={setSelectedState}
            options={stateOptions}
          />
        </div>

        <Button onClick={onSearch} size="lg" className="w-full gap-2">
          <MapPin className="w-5 h-5" />
          Open Official Search
          <ExternalLink className="w-4 h-4" />
        </Button>

        <div className="mt-6 space-y-3">
          <InfoItem
            icon={Info}
            iconColor="text-blue-500"
            text="Most states are covered by **MissingMoney.com**."
          />
          <InfoItem
            icon={ExternalLink}
            iconColor="text-purple-500"
            text="Some states send you to their **own** portal."
          />
        </div>

        {/* State-specific note */}
        {selectedState === "CA" && (
          <Alert variant="info" className="mt-6">
            California uses its own portal at claimit.ca.gov
          </Alert>
        )}
        {selectedState === "HI" && (
          <Alert variant="info" className="mt-6">
            Hawaii uses its own portal at unclaimedproperty.ehawaii.gov
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

