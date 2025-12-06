import type { UnclaimedMoneyState } from "@/lib/types";

// US States + DC (alphabetical)
export const US_STATES: UnclaimedMoneyState[] = [
  { code: "AL", name: "Alabama", url: "https://missingmoney.com/" },
  { code: "AK", name: "Alaska", url: "https://missingmoney.com/" },
  { code: "AZ", name: "Arizona", url: "https://missingmoney.com/" },
  { code: "AR", name: "Arkansas", url: "https://missingmoney.com/" },
  { code: "CA", name: "California", url: "https://claimit.ca.gov" },
  { code: "CO", name: "Colorado", url: "https://missingmoney.com/" },
  { code: "CT", name: "Connecticut", url: "https://missingmoney.com/" },
  { code: "DC", name: "District of Columbia", url: "https://missingmoney.com/" },
  { code: "DE", name: "Delaware", url: "https://missingmoney.com/" },
  { code: "FL", name: "Florida", url: "https://missingmoney.com/" },
  { code: "GA", name: "Georgia", url: "https://missingmoney.com/" },
  { code: "HI", name: "Hawaii", url: "https://unclaimedproperty.ehawaii.gov/lilo/property-search.html" },
  { code: "ID", name: "Idaho", url: "https://missingmoney.com/" },
  { code: "IL", name: "Illinois", url: "https://missingmoney.com/" },
  { code: "IN", name: "Indiana", url: "https://missingmoney.com/" },
  { code: "IA", name: "Iowa", url: "https://missingmoney.com/" },
  { code: "KS", name: "Kansas", url: "https://missingmoney.com/" },
  { code: "KY", name: "Kentucky", url: "https://missingmoney.com/" },
  { code: "LA", name: "Louisiana", url: "https://missingmoney.com/" },
  { code: "ME", name: "Maine", url: "https://missingmoney.com/" },
  { code: "MD", name: "Maryland", url: "https://missingmoney.com/" },
  { code: "MA", name: "Massachusetts", url: "https://missingmoney.com/" },
  { code: "MI", name: "Michigan", url: "https://missingmoney.com/" },
  { code: "MN", name: "Minnesota", url: "https://missingmoney.com/" },
  { code: "MS", name: "Mississippi", url: "https://missingmoney.com/" },
  { code: "MO", name: "Missouri", url: "https://missingmoney.com/" },
  { code: "MT", name: "Montana", url: "https://missingmoney.com/" },
  { code: "NE", name: "Nebraska", url: "https://missingmoney.com/" },
  { code: "NV", name: "Nevada", url: "https://missingmoney.com/" },
  { code: "NH", name: "New Hampshire", url: "https://missingmoney.com/" },
  { code: "NJ", name: "New Jersey", url: "https://missingmoney.com/" },
  { code: "NM", name: "New Mexico", url: "https://missingmoney.com/" },
  { code: "NY", name: "New York", url: "https://missingmoney.com/" },
  { code: "NC", name: "North Carolina", url: "https://missingmoney.com/" },
  { code: "ND", name: "North Dakota", url: "https://missingmoney.com/" },
  { code: "OH", name: "Ohio", url: "https://missingmoney.com/" },
  { code: "OK", name: "Oklahoma", url: "https://missingmoney.com/" },
  { code: "OR", name: "Oregon", url: "https://missingmoney.com/" },
  { code: "PA", name: "Pennsylvania", url: "https://missingmoney.com/" },
  { code: "RI", name: "Rhode Island", url: "https://missingmoney.com/" },
  { code: "SC", name: "South Carolina", url: "https://missingmoney.com/" },
  { code: "SD", name: "South Dakota", url: "https://missingmoney.com/" },
  { code: "TN", name: "Tennessee", url: "https://missingmoney.com/" },
  { code: "TX", name: "Texas", url: "https://missingmoney.com/" },
  { code: "UT", name: "Utah", url: "https://missingmoney.com/" },
  { code: "VT", name: "Vermont", url: "https://missingmoney.com/" },
  { code: "VA", name: "Virginia", url: "https://missingmoney.com/" },
  { code: "WA", name: "Washington", url: "https://missingmoney.com/" },
  { code: "WV", name: "West Virginia", url: "https://missingmoney.com/" },
  { code: "WI", name: "Wisconsin", url: "https://missingmoney.com/" },
  { code: "WY", name: "Wyoming", url: "https://missingmoney.com/" },
];

export function getStateUrl(stateCode: string): string {
  const state = US_STATES.find((s) => s.code === stateCode);
  return state?.url || "https://missingmoney.com/";
}

export function getStateName(stateCode: string): string {
  const state = US_STATES.find((s) => s.code === stateCode);
  return state?.name || stateCode;
}

