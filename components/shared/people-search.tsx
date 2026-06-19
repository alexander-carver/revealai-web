"use client";

import { useState, useCallback, useEffect, useRef, type MouseEvent as ReactMouseEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AtSign,
  ArrowRight,
  Car,
  ChevronDown,
  FileText,
  Lock,
  MapPin,
  Phone,
  Search,
  Shield,
  Sparkles,
  Star,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import { useSubscription } from "@/hooks/use-subscription";
import { MostSearched } from "./most-searched";
import { trackSearchButtonClick } from "@/lib/analytics";
import { SearchLoadingScreen, type QuestionAnswers } from "./search-loading-screen";
import { EmailCaptureModal } from "./email-capture-modal";
import { lookupMockProfileByDetails } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { triggerHapticFeedback } from "@/lib/haptics";
import {
  getVehicleLookupMode,
  normalizeVehicleLookupQuery,
} from "@/lib/services/vehicle";
import {
  SEARCH_PRODUCT_IDS,
  getProductThemeStyle,
  getSearchProduct,
  type SearchProductId,
} from "@/lib/search-products";

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === "1") {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

interface PeopleSearchProps {
  selectedProduct?: SearchProductId;
  onProductChange?: (productId: SearchProductId) => void;
  initialSocialSearchMode?: "name" | "username";
}

type SocialSearchMode = "name" | "username";

type PendingSearchDestination = "loading" | "records" | "result";

interface PendingSearch {
  productId: SearchProductId;
  analyticsKey: string;
  queryLabel: string;
  destination: PendingSearchDestination;
  params?: string;
}

export function PeopleSearch({
  selectedProduct,
  onProductChange,
  initialSocialSearchMode = "name",
}: PeopleSearchProps) {
  const router = useRouter();
  const {
    isPro,
    showFreeTrialPaywall,
    isPaywallVisible,
    isAbandonedPaywallVisible,
  } = useSubscription();
  const [internalProduct, setInternalProduct] = useState<SearchProductId>("people");
  const [personFormData, setPersonFormData] = useState({
    firstName: "",
    lastName: "",
    city: "",
    state: "",
  });
  const [phoneNumber, setPhoneNumber] = useState("");
  const [vin, setVin] = useState("");
  const [username, setUsername] = useState("");
  const [socialSearchMode, setSocialSearchMode] =
    useState<SocialSearchMode>(initialSocialSearchMode);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [capturedAnswers, setCapturedAnswers] = useState<QuestionAnswers>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingProduct, setLoadingProduct] = useState<SearchProductId>("people");
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);
  const [searchValidationMessage, setSearchValidationMessage] = useState<string | null>(null);
  const paywallSequenceStarted = useRef(false);
  const productMenuRef = useRef<HTMLDivElement>(null);

  const activeProduct = selectedProduct ?? internalProduct;
  const currentProduct = getSearchProduct(activeProduct);
  const supportsUsernameMode =
    currentProduct.id === "social" || currentProduct.id === "followers";
  const isUsernameMode =
    supportsUsernameMode && socialSearchMode === "username";
  const CurrentProductIcon = currentProduct.icon;
  const themeStyle = getProductThemeStyle(activeProduct);

  const setActiveProduct = (productId: SearchProductId) => {
    if (selectedProduct === undefined) {
      setInternalProduct(productId);
    }
    onProductChange?.(productId);
  };

  const openValidationPopup = useCallback((message: string) => {
    triggerHapticFeedback("warning");
    setSearchValidationMessage(message);
  }, []);

  useEffect(() => {
    if (isPaywallVisible && showLoadingScreen) {
      paywallSequenceStarted.current = true;
    }
  }, [isPaywallVisible, showLoadingScreen]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        productMenuRef.current &&
        !productMenuRef.current.contains(event.target as Node)
      ) {
        setIsProductMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProductMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (
      paywallSequenceStarted.current &&
      !isPaywallVisible &&
      !isAbandonedPaywallVisible &&
      showLoadingScreen
    ) {
      setShowLoadingScreen(false);
      paywallSequenceStarted.current = false;
    }
  }, [isPaywallVisible, isAbandonedPaywallVisible, showLoadingScreen]);

  useEffect(() => {
    if (supportsUsernameMode) {
      setSocialSearchMode(initialSocialSearchMode);
      return;
    }

    setSocialSearchMode("name");
  }, [initialSocialSearchMode, supportsUsernameMode]);

  const startLoadingFlow = useCallback(
    (query: string, productId: SearchProductId) => {
      setSearchQuery(query);
      setLoadingProduct(productId);
      setShowLoadingScreen(true);
    },
    []
  );

  const handleEmailCaptured = useCallback((email: string) => {
    // Optionally save the email here in the future
    console.log("Captured email:", email);
    setShowEmailCapture(false);
    showFreeTrialPaywall(loadingProduct);
  }, [showFreeTrialPaywall, loadingProduct]);

  const executeSearch = useCallback(
    (search: PendingSearch) => {
      triggerHapticFeedback("impact");
      trackSearchButtonClick(search.analyticsKey);

      if (search.destination === "loading") {
        startLoadingFlow(search.queryLabel, search.productId);
        return;
      }

      const params = new URLSearchParams(search.params ?? "");
      const path =
        search.destination === "records" ? "/records" : "/search/result";
      router.push(`${path}?${params.toString()}`);
    },
    [router, startLoadingFlow],
  );

  const handlePersonSearch = useCallback(() => {
    if (!personFormData.firstName.trim() || !personFormData.lastName.trim()) {
      openValidationPopup(
        `Enter both a first and last name before starting ${currentProduct.menuLabel.toLowerCase()}.`
      );
      return;
    }

    const fullName = `${personFormData.firstName.trim()} ${personFormData.lastName.trim()}`;

    const params = new URLSearchParams({
      firstName: personFormData.firstName.trim(),
      lastName: personFormData.lastName.trim(),
      type: currentProduct.searchType,
    });

    if (personFormData.city.trim()) {
      params.set("city", personFormData.city.trim());
    }
    if (personFormData.state.trim()) {
      params.set("state", personFormData.state.trim());
    }

    if (
      currentProduct.id === "people" ||
      currentProduct.id === "social" ||
      currentProduct.id === "followers"
    ) {
      const mockProfile = lookupMockProfileByDetails(
        personFormData.firstName.trim(),
        personFormData.lastName.trim(),
        personFormData.city.trim() || undefined,
        personFormData.state.trim() || undefined
      );

      if (mockProfile) {
        router.push(`/search/${mockProfile.id}?${params.toString()}`);
        return;
      }
    }

    if (!isPro) {
      executeSearch({
        productId: currentProduct.id,
        analyticsKey: currentProduct.analyticsKey,
        queryLabel: fullName,
        destination: "loading",
      });
      return;
    }

    if (currentProduct.id === "records") {
      executeSearch({
        productId: currentProduct.id,
        analyticsKey: currentProduct.analyticsKey,
        queryLabel: fullName,
        destination: "records",
        params: params.toString(),
      });
      return;
    }

    executeSearch({
      productId: currentProduct.id,
      analyticsKey: currentProduct.analyticsKey,
      queryLabel: fullName,
      destination: "result",
      params: params.toString(),
    });
  }, [currentProduct, isPro, openValidationPopup, personFormData, executeSearch]);

  const handleUsernameSearch = useCallback(() => {
    const trimmedUsername = username.trim().replace(/^@+/, "");

    if (trimmedUsername.length < 2) {
      openValidationPopup(
        "Enter a username or handle before starting this search."
      );
      return;
    }

    if (!isPro) {
      executeSearch({
        productId: currentProduct.id,
        analyticsKey: currentProduct.analyticsKey,
        queryLabel: `@${trimmedUsername}`,
        destination: "loading",
      });
      return;
    }

    const params = new URLSearchParams({
      username: trimmedUsername,
      type: "username",
    });

    executeSearch({
      productId: currentProduct.id,
      analyticsKey: currentProduct.analyticsKey,
      queryLabel: `@${trimmedUsername}`,
      destination: "result",
      params: params.toString(),
    });
  }, [
    currentProduct.analyticsKey,
    currentProduct.id,
    isPro,
    openValidationPopup,
    executeSearch,
    username,
  ]);

  const handlePhoneSearch = useCallback(() => {
    const digits = phoneNumber.replace(/\D/g, "");
    if (digits.length < 10) {
      openValidationPopup(
        "Enter a full 10-digit phone number before running a reverse phone lookup."
      );
      return;
    }

    const formatted = formatPhoneDisplay(phoneNumber);

    if (!isPro) {
      executeSearch({
        productId: currentProduct.id,
        analyticsKey: currentProduct.analyticsKey,
        queryLabel: formatted,
        destination: "loading",
      });
      return;
    }

    const params = new URLSearchParams({
      type: "phone",
      number: formatted,
    });

    executeSearch({
      productId: currentProduct.id,
      analyticsKey: currentProduct.analyticsKey,
      queryLabel: formatted,
      destination: "result",
      params: params.toString(),
    });
  }, [currentProduct, isPro, openValidationPopup, phoneNumber, executeSearch]);

  const handleVehicleSearch = useCallback(() => {
    const lookupMode = getVehicleLookupMode(vin);
    const normalizedQuery = normalizeVehicleLookupQuery(vin);

    if (!lookupMode || !normalizedQuery) {
      openValidationPopup(
        "Enter a full 17-character VIN or a license plate before starting a vehicle lookup."
      );
      return;
    }

    if (!isPro) {
      executeSearch({
        productId: currentProduct.id,
        analyticsKey: currentProduct.analyticsKey,
        queryLabel: normalizedQuery,
        destination: "loading",
      });
      return;
    }

    const params = new URLSearchParams({
      type: "vehicle",
      [lookupMode === "vin" ? "vin" : "plate"]: normalizedQuery,
    });

    executeSearch({
      productId: currentProduct.id,
      analyticsKey: currentProduct.analyticsKey,
      queryLabel: normalizedQuery,
      destination: "result",
      params: params.toString(),
    });
  }, [currentProduct, isPro, openValidationPopup, executeSearch, vin]);

  const handleSearch = useCallback(() => {
    if (isUsernameMode) {
      handleUsernameSearch();
      return;
    }

    if (currentProduct.inputMode === "phone") {
      handlePhoneSearch();
      return;
    }

    if (currentProduct.inputMode === "vin") {
      handleVehicleSearch();
      return;
    }

    handlePersonSearch();
  }, [
    currentProduct.inputMode,
    handlePersonSearch,
    handlePhoneSearch,
    handleUsernameSearch,
    handleVehicleSearch,
    isUsernameMode,
  ]);

  const handleProductSelect = (event: ReactMouseEvent<HTMLButtonElement>, productId: SearchProductId) => {
    event.preventDefault();
    triggerHapticFeedback("selection");
    setActiveProduct(productId);
    setIsProductMenuOpen(false);
  };

  if (showLoadingScreen) {
    return (
      <>
        <SearchLoadingScreen
          isVisible={showLoadingScreen}
          searchQuery={searchQuery}
          productId={loadingProduct}
          onComplete={(answers) => {
            setCapturedAnswers(answers);
            setShowEmailCapture(true);
          }}
          onCancel={() => {
            setShowLoadingScreen(false);
            setShowEmailCapture(false);
          }}
        />
        <EmailCaptureModal
          isOpen={showEmailCapture}
          onContinue={handleEmailCaptured}
          searchQuery={searchQuery}
          answers={capturedAnswers}
        />
      </>
    );
  }

  return (
    <section
      id="search"
      className="min-h-screen flex items-center justify-center py-12 md:py-16 transition-colors duration-300"
      style={{
        ...themeStyle,
        background:
          "linear-gradient(180deg, var(--product-gradient-from) 0%, var(--product-gradient-to) 60%, #ffffff 100%)",
      }}
    >
      <div className="container mx-auto px-4 max-w-5xl">
        <Card
          className="border-0 bg-white"
          style={{
            boxShadow: "0 32px 80px -45px var(--product-shadow)",
          }}
        >
          <CardHeader className="pb-3 md:pb-5">
            <div className="text-center space-y-4">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium"
                style={{
                  backgroundColor: "var(--product-soft)",
                  borderColor: "var(--product-soft-border)",
                  color: "var(--product-primary)",
                }}
              >
                <Sparkles className="w-4 h-4" />
                <span>{currentProduct.home.badge}</span>
              </div>
              <div>
                <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                  {currentProduct.home.titlePrefix}{" "}
                  <span style={{ color: "var(--product-primary)" }}>
                    {currentProduct.home.titleAccent}
                  </span>
                  {currentProduct.home.titleSuffix
                    ? ` ${currentProduct.home.titleSuffix}`
                    : ""}
                </CardTitle>
                <p className="mt-2 mx-auto max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[12px] text-gray-500 sm:text-sm md:text-base">
                  {currentProduct.home.subtitle}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="mx-auto mb-5 flex justify-center">
              <div
                ref={productMenuRef}
                className="relative w-fit"
              >
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={isProductMenuOpen}
                  onClick={() => setIsProductMenuOpen((open) => !open)}
                  className={cn(
                    "flex h-10 w-auto items-center justify-between gap-2 rounded-2xl border bg-white px-3 transition-all duration-200",
                    isProductMenuOpen && "shadow-lg"
                  )}
                  style={{
                    borderColor: currentProduct.theme.softBorder,
                    boxShadow: isProductMenuOpen
                      ? `0 18px 45px -28px ${currentProduct.theme.shadow}`
                      : "0 10px 30px -26px rgba(15, 23, 42, 0.18)",
                  }}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border"
                      style={{
                        backgroundColor:
                          currentProduct.id === "people"
                            ? "#ffffff"
                            : currentProduct.theme.soft,
                        borderColor: currentProduct.theme.softBorder,
                      }}
                    >
                      <CurrentProductIcon
                        className="h-3.5 w-3.5"
                        style={{ color: currentProduct.theme.primary }}
                      />
                    </span>
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {currentProduct.label}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-gray-500">
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform duration-200",
                        isProductMenuOpen && "rotate-180"
                      )}
                    />
                  </span>
                </button>

                {isProductMenuOpen && (
                  <div
                    role="menu"
                    className="absolute left-1/2 top-[calc(100%+0.6rem)] z-30 min-w-[260px] -translate-x-1/2 overflow-hidden rounded-2xl border bg-white p-2 shadow-2xl"
                    style={{
                      borderColor: currentProduct.theme.softBorder,
                      boxShadow: "0 28px 70px -36px rgba(15, 23, 42, 0.28)",
                    }}
                  >
                    {SEARCH_PRODUCT_IDS.filter((productId) => productId !== activeProduct).map(
                      (productId) => {
                        const product = getSearchProduct(productId);
                        const Icon = product.icon;

                        return (
                          <button
                            key={productId}
                            type="button"
                            role="menuitem"
                            onClick={(event) => handleProductSelect(event, productId)}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-gray-50"
                          >
                            <span
                              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border"
                              style={{
                                backgroundColor: product.theme.soft,
                                borderColor: product.theme.softBorder,
                              }}
                            >
                              <Icon
                                className="h-4 w-4"
                                style={{ color: product.theme.primary }}
                              />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-gray-900">
                                {product.label}
                              </p>
                              <p className="truncate text-xs text-gray-500">
                                {product.home.subtitle}
                              </p>
                            </div>
                            <ChevronDown className="h-4 w-4 rotate-[-90deg] text-gray-300" />
                          </button>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mx-auto max-w-xl">
              {supportsUsernameMode && (
                <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-[#f5f5f5] p-1">
                  {([
                    { value: "name", label: "Search by name" },
                    { value: "username", label: "Search by username" },
                  ] as const).map((option) => {
                    const isActive = socialSearchMode === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSocialSearchMode(option.value)}
                        className="rounded-[14px] px-3 py-2 text-sm font-medium transition-all"
                        style={{
                          backgroundColor: isActive
                            ? "white"
                            : "transparent",
                          color: isActive
                            ? "var(--product-primary)"
                            : "#6b7280",
                          boxShadow: isActive
                            ? "0 10px 30px -22px rgba(15, 23, 42, 0.35)"
                            : "none",
                        }}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {currentProduct.inputMode === "person" && !isUsernameMode && (
                <div className="grid grid-cols-1 gap-3">
                  <Input
                    placeholder="First Name *"
                    value={personFormData.firstName}
                    onChange={(e) =>
                      setPersonFormData((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    icon={<User className="w-4 h-4" />}
                  />
                  <Input
                    placeholder="Last Name *"
                    value={personFormData.lastName}
                    onChange={(e) =>
                      setPersonFormData((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    icon={<User className="w-4 h-4" />}
                  />
                  <Input
                    placeholder="City (optional)"
                    value={personFormData.city}
                    onChange={(e) =>
                      setPersonFormData((prev) => ({
                        ...prev,
                        city: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    icon={<MapPin className="w-4 h-4" />}
                  />
                  <Input
                    placeholder="State (optional)"
                    value={personFormData.state}
                    onChange={(e) =>
                      setPersonFormData((prev) => ({
                        ...prev,
                        state: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    icon={<MapPin className="w-4 h-4" />}
                  />
                </div>
              )}

              {isUsernameMode && (
                <Input
                  placeholder="Username or handle"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  icon={<AtSign className="w-4 h-4" />}
                  className="font-mono"
                />
              )}

              {currentProduct.inputMode === "phone" && (
                <Input
                  placeholder="(555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  icon={<Phone className="w-4 h-4" />}
                  className="font-mono text-lg"
                />
              )}

              {currentProduct.inputMode === "vin" && (
                <Input
                  placeholder="VIN or License Plate"
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  icon={<Car className="w-4 h-4" />}
                  className="font-mono"
                />
              )}

              <Button
                onClick={handleSearch}
                size="lg"
                className="mt-5 w-full gap-2 text-white"
                style={{
                  backgroundColor: "var(--product-primary)",
                  boxShadow: "0 18px 45px -24px var(--product-shadow)",
                }}
              >
                {currentProduct.inputMode === "phone" ? (
                  <Phone className="w-5 h-5" />
                ) : isUsernameMode ? (
                  <AtSign className="w-5 h-5" />
                ) : currentProduct.inputMode === "vin" ? (
                  <Car className="w-5 h-5" />
                ) : currentProduct.id === "records" ? (
                  <FileText className="w-5 h-5" />
                ) : currentProduct.id === "social" ||
                  currentProduct.id === "followers" ? (
                  <CurrentProductIcon className="w-5 h-5" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                {isUsernameMode ? "Search by Username" : currentProduct.home.ctaLabel}
                <ArrowRight className="w-4 h-4" />
              </Button>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-green-600" />
                  <span className="font-medium">Trusted</span>
                </div>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-medium">4.9 Star Rating</span>
                </div>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1">
                  <CurrentProductIcon
                    className="w-3.5 h-3.5"
                    style={{ color: "var(--product-primary)" }}
                  />
                  <span className="font-medium">
                    {isUsernameMode
                      ? "Handle & Profile Match"
                      : currentProduct.id === "social"
                      ? "100+ Platforms"
                      : currentProduct.id === "followers"
                      ? "Public Follow-Back Signals"
                      : currentProduct.id === "phone"
                      ? "Spam Check Included"
                      : currentProduct.id === "vehicle"
                      ? "VIN & Plate Search"
                      : currentProduct.id === "records"
                      ? "Court & Filing Focus"
                      : "500M+ Searches"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mx-auto mt-4 max-w-md flex items-center justify-center gap-2 rounded-full border border-green-100 bg-green-50/50 py-2 px-4 text-sm font-medium text-green-800 shadow-sm">
          <Lock className="h-4 w-4 text-green-600" />
          <span>100% Confidential — They won't be notified.</span>
        </div>

        <MostSearched />

        <p className="mt-8 text-center text-[11px] text-gray-400 max-w-lg mx-auto leading-relaxed">
          A 7-day trial or paid membership is required to view full reports. RevealAI is not a Consumer Reporting Agency (FCRA). Reports cannot be used for employment, credit, tenant screening, or insurance purposes.
        </p>
      </div>

      <Modal
        isOpen={Boolean(searchValidationMessage)}
        onClose={() => setSearchValidationMessage(null)}
        className="max-w-md"
      >
        <ModalHeader>
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
            style={{
              backgroundColor: "var(--product-soft)",
              color: "var(--product-primary)",
            }}
          >
            <CurrentProductIcon className="h-4 w-4" />
            Search Incomplete
          </div>
          <h3 className="mt-4 text-2xl font-semibold text-gray-900">
            Add a little more info first.
          </h3>
        </ModalHeader>
        <ModalContent>
          <p className="text-sm leading-6 text-gray-600">
            {searchValidationMessage}
          </p>
        </ModalContent>
        <ModalFooter>
          <Button
            type="button"
            className="text-white"
            style={{ backgroundColor: "var(--product-primary)" }}
            onClick={() => setSearchValidationMessage(null)}
          >
            Got it
          </Button>
        </ModalFooter>
      </Modal>
    </section>
  );
}
