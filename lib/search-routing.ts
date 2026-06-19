import type { SearchProductId } from "@/lib/search-products";

const SEARCH_PRODUCT_TYPE_MAP: Record<SearchProductId, string> = {
  people: "fullreport",
  social: "social",
  followers: "followers",
  phone: "phone",
  vehicle: "vehicle",
  records: "records",
};

const SEARCH_PRODUCT_ALIASES: Record<string, SearchProductId> = {
  people: "people",
  peoplesearch: "people",
  peoplefinder: "people",
  personsearch: "people",
  personlookup: "people",
  fullreport: "people",
  fullreports: "people",
  backgroundcheck: "people",
  backgroundreport: "people",
  fullbackgroundcheck: "people",
  social: "social",
  socialonline: "social",
  socialandonline: "social",
  onlinepresence: "social",
  onlineprofiles: "social",
  socialprofiles: "social",
  socialsearch: "social",
  datingapp: "social",
  datingapps: "social",
  datingprofile: "social",
  datingprofiles: "social",
  datingappsearch: "social",
  username: "social",
  usernamesearch: "social",
  follower: "followers",
  followers: "followers",
  followersearch: "followers",
  followerssearch: "followers",
  followerchecker: "followers",
  followerschecker: "followers",
  followerredflags: "followers",
  followbackchecker: "followers",
  whodoesntfollowback: "followers",
  whodoesnotfollowback: "followers",
  phone: "phone",
  phonesearch: "phone",
  phonelookup: "phone",
  reversephone: "phone",
  reversephonelookup: "phone",
  whocalledme: "phone",
  unknowncaller: "phone",
  vehicle: "vehicle",
  vehiclesearch: "vehicle",
  vehiclelookup: "vehicle",
  vin: "vehicle",
  vinlookup: "vehicle",
  plate: "vehicle",
  platelookup: "vehicle",
  licenseplate: "vehicle",
  licenseplatelookup: "vehicle",
  records: "records",
  recordssearch: "records",
  recordlookup: "records",
  publicrecords: "records",
  publicrecordssearch: "records",
  courtrecords: "records",
  criminalrecords: "records",
  legalrecords: "records",
};

function normalizeSearchKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}

export function resolveSearchProductId(
  value: string | null | undefined
): SearchProductId | null {
  if (!value) {
    return null;
  }

  return SEARCH_PRODUCT_ALIASES[normalizeSearchKey(value)] ?? null;
}

export function getCanonicalSearchType(
  value: string | null | undefined
): string | null {
  const productId = resolveSearchProductId(value);

  if (!productId) {
    return null;
  }

  return SEARCH_PRODUCT_TYPE_MAP[productId];
}
