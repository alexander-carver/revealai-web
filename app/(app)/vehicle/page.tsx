"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Car,
  Search,
  ArrowRight,
  Fuel,
  Gauge,
  Cog,
  MapPin,
  Calendar,
  Factory,
  Info,
  Copy,
  Check,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchLoadingScreen } from "@/components/shared/search-loading-screen";
import { decodeVin, getVehicleTitle, getEngineSummary } from "@/lib/services/vehicle";
import type { VinDecodedVehicle } from "@/lib/types";
import { useSubscription } from "@/hooks/use-subscription";

export default function VehicleSearchPage() {
  const { isPro } = useSubscription();
  const [vin, setVin] = useState("");
  const [vehicle, setVehicle] = useState<VinDecodedVehicle | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Loading screen state
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [loadingSearchQuery, setLoadingSearchQuery] = useState("");

  const searchMutation = useMutation({
    mutationFn: async () => {
      return decodeVin(vin);
    },
    onSuccess: (data) => {
      setVehicle(data);
    },
  });

  const handleSearch = useCallback(() => {
    if (vin.trim().length < 17) {
      return;
    }
    
    // Show loading screen and start search
    setLoadingSearchQuery(vin.toUpperCase());
    setShowLoadingScreen(true);
    searchMutation.mutate();
  }, [vin, searchMutation]);

  const handleLoadingComplete = useCallback(() => {
    setShowLoadingScreen(false);
  }, []);

  const handleLoadingCancel = useCallback(() => {
    setShowLoadingScreen(false);
    setVehicle(null);
  }, []);

  const handleCopyVin = () => {
    if (vehicle) {
      navigator.clipboard.writeText(vehicle.vin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      {/* Loading Screen Overlay */}
      <SearchLoadingScreen
        isVisible={showLoadingScreen}
        searchQuery={loadingSearchQuery}
        onComplete={handleLoadingComplete}
        onCancel={handleLoadingCancel}
      />

      <PageHeader
        title="Vehicle Lookup"
        description="Decode any VIN for vehicle history and specifications"
        icon={Car}
        iconColor="text-emerald-500"
        iconBgColor="bg-emerald-500/10"
      />

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Enter VIN</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="17-character VIN"
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              icon={<Car className="w-4 h-4" />}
              className="flex-1 font-mono"
              maxLength={17}
            />
            <Button
              onClick={handleSearch}
              isLoading={searchMutation.isPending && !showLoadingScreen}
              size="lg"
              className="gap-2"
            >
              <Search className="w-5 h-5" />
              Decode
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Find the VIN on your dashboard (driver&apos;s side), door jamb, or
            vehicle registration documents.
          </p>
        </CardContent>
      </Card>

      {/* Error Message */}
      {searchMutation.error && !showLoadingScreen && (
        <Alert variant="destructive" className="mt-6">
          {(searchMutation.error as Error).message ||
            "An error occurred during the VIN decode"}
        </Alert>
      )}

      {/* Loading State (inline, hidden when full loading screen is shown) */}
      {searchMutation.isPending && !showLoadingScreen && (
        <div className="mt-6">
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Skeleton className="w-16 h-16 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-5 w-48" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Vehicle Results */}
      {vehicle && !showLoadingScreen && (
        <div className="mt-6 space-y-6">
          {/* Vehicle Header */}
          <Card className="overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-cyan-500/20 flex items-center justify-center">
              <Car className="w-16 h-16 text-emerald-500/50" />
            </div>
            <CardContent className="p-6 -mt-8">
              <div className="bg-card rounded-xl border border-border p-6 shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {getVehicleTitle(vehicle)}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {vehicle.trim && (
                        <Badge variant="secondary">{vehicle.trim}</Badge>
                      )}
                      {vehicle.bodyClass && (
                        <Badge variant="outline">{vehicle.bodyClass}</Badge>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleCopyVin}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors font-mono text-sm"
                  >
                    <span className="text-muted-foreground">VIN:</span>
                    <span>{vehicle.vin}</span>
                    {copied ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Specs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Engine */}
            {getEngineSummary(vehicle) && (
              <Card className="p-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-amber-500/10">
                    <Gauge className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Engine</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getEngineSummary(vehicle)}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Fuel */}
            {vehicle.fuelType && (
              <Card className="p-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-green-500/10">
                    <Fuel className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Fuel Type</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {vehicle.fuelType}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Transmission */}
            {vehicle.transmission && (
              <Card className="p-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <Cog className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Transmission</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {vehicle.transmission}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Drive Type */}
            {vehicle.driveType && (
              <Card className="p-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-purple-500/10">
                    <Car className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Drive Type</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {vehicle.driveType}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Model Year */}
            {vehicle.modelYear && (
              <Card className="p-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-rose-500/10">
                    <Calendar className="w-6 h-6 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Model Year</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {vehicle.modelYear}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Manufacturer */}
            {vehicle.manufacturer && (
              <Card className="p-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-cyan-500/10">
                    <Factory className="w-6 h-6 text-cyan-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Manufacturer</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {vehicle.manufacturer}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Plant Location */}
            {(vehicle.plantCity || vehicle.plantCountry) && (
              <Card className="p-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-orange-500/10">
                    <MapPin className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Assembly Plant</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {[vehicle.plantCity, vehicle.plantState, vehicle.plantCountry]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Doors */}
            {vehicle.doors && (
              <Card className="p-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-indigo-500/10">
                    <Info className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Doors</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {vehicle.doors} doors
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Data Source */}
          <p className="text-xs text-muted-foreground text-center">
            Data provided by NHTSA (National Highway Traffic Safety
            Administration)
          </p>
        </div>
      )}
    </div>
  );
}
