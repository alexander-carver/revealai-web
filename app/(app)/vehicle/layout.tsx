import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vehicle Lookup - Decode VIN & Get Vehicle History",
  description:
    "Decode any VIN (Vehicle Identification Number) to get vehicle history, specifications, recalls, and ownership information. Free VIN lookup with RevealAI.",
  keywords: [
    "vin lookup",
    "vehicle lookup",
    "vin decoder",
    "vehicle history",
    "car history",
    "vin check",
    "vehicle information",
    "car lookup",
  ],
  openGraph: {
    title: "Vehicle Lookup - VIN Decoder & Vehicle History | RevealAI",
    description:
      "Decode any VIN to get vehicle history, specifications, and ownership information. Free VIN lookup.",
    url: "https://revealai.com/vehicle",
  },
};

export default function VehicleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

