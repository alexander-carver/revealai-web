import { getAuthHeaders, getFunctionsUrl } from "@/lib/supabase/client";
import type {
  SearchQuery,
  SearchMode,
  PersonSearchCandidate,
  PersonMatch,
  PersonProfileState,
  EnformionContactMatch,
  AIProfileSearchResponse,
} from "@/lib/types";

// ============================================
// Enformion Service
// ============================================

export type EnformionOperation =
  | "person_candidates"
  | "person_profile"
  | "reverse_phone"
  | "email_lookup"
  | "address_lookup";

class EnformionServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "EnformionServiceError";
  }
}

function buildPersonSearchPayload(query: SearchQuery): Record<string, unknown> {
  return {
    FirstName: query.firstName,
    LastName: query.lastName,
    MiddleName: query.middleName,
    City: query.city,
    State: query.state,
  };
}

function buildPhonePayload(query: SearchQuery): Record<string, unknown> {
  return {
    Phone: query.phone?.replace(/\D/g, ""),
  };
}

function buildEmailPayload(query: SearchQuery): Record<string, unknown> {
  return {
    Email: query.email,
  };
}

function buildAddressPayload(query: SearchQuery): Record<string, unknown> {
  return {
    Street: query.street,
    City: query.city,
    State: query.state,
    Zip: query.zip,
  };
}

async function performEnformionRequest(
  operation: EnformionOperation,
  payload: Record<string, unknown>
): Promise<unknown> {
  try {
    // Use web-specific function for browser requests
    const url = getFunctionsUrl("enformion-search-web");
    const headers = await getAuthHeaders();

  const body = {
    ...payload,
    operation,
    appVersion: "web-1.0.0",
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
      let errorMessage = `Search failed (${response.status})`;
      try {
        const errorData = await response.json();
        // Handle different error formats from Enformion
        if (errorData.error) {
          errorMessage = typeof errorData.error === "string" 
            ? errorData.error 
            : JSON.stringify(errorData.error);
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.warnings && Array.isArray(errorData.warnings)) {
          errorMessage = errorData.warnings.join("; ");
        } else if (errorData.isError === false) {
          // Not actually an error, just empty results - don't throw
          console.log("[performEnformionRequest] Empty results, not an error");
          return errorData;
        }
      } catch {
        const errorText = await response.text();
        if (errorText) errorMessage = errorText;
      }
      throw new EnformionServiceError(errorMessage, response.status);
    }

    return response.json();
  } catch (error) {
    if (error instanceof EnformionServiceError) {
      throw error;
    }
    // Handle network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new EnformionServiceError(
        "Network error: Unable to connect to search service. Please check your internet connection.",
        0
      );
    }
    throw new EnformionServiceError(
      error instanceof Error ? error.message : "An unexpected error occurred",
      0
    );
  }
}

// Parse candidates from raw response
function parseCandidates(data: unknown): PersonSearchCandidate[] {
  if (!data || typeof data !== "object") return [];

  const response = data as Record<string, unknown>;
  // Enformion returns "persons" array, but also handle other formats
  const results = (response.persons || response.results || response.Results || []) as unknown[];

  console.log("[parseCandidates] Raw response:", JSON.stringify(response).substring(0, 500));
  console.log("[parseCandidates] Found", results.length, "results");

  return results.map((item: unknown, index: number) => {
    const raw = item as Record<string, unknown>;
    const name = (raw.name as Record<string, unknown>) || {};

    // Extract address info from the first address if available
    const addresses = (raw.addresses as unknown[]) || [];
    const firstAddr = (addresses[0] as Record<string, unknown>) || {};
    
    return {
      id:
        (raw.tahoeId as string) ||
        (raw.enformionId as string) ||
        (raw.id as string) ||
        `candidate-${index}`,
      firstName: (name.firstName as string) || (raw.firstName as string) || "",
      lastName: (name.lastName as string) || (raw.lastName as string) || "",
      middleName: (name.middleName as string) || (raw.middleName as string),
      age: raw.age as number,
      city: (firstAddr.city as string) || (raw.city as string),
      state: (firstAddr.state as string) || (raw.state as string),
      addresses: addresses as string[],
      rawPayload: raw,
    };
  });
}

// Parse profile from raw response
function parseProfile(
  data: unknown,
  queryLabel: string
): PersonProfileState | null {
  if (!data || typeof data !== "object") return null;

  const response = data as Record<string, unknown>;
  // Enformion returns "persons" array
  const results = (response.persons || response.results || response.Results || []) as unknown[];
  const first = results[0] as Record<string, unknown>;

  console.log("[parseProfile] Raw response:", JSON.stringify(response).substring(0, 500));
  console.log("[parseProfile] Found", results.length, "results");

  if (!first) return null;

  const name = (first.name as Record<string, unknown>) || {};
  
  // Enformion returns addresses with different field names
  const rawAddresses = (first.addresses as unknown[]) || [];
  const addresses = rawAddresses.map((addr: unknown) => {
    const a = addr as Record<string, unknown>;
    return {
      street: (a.street as string) || (a.addressLine1 as string) || "",
      city: a.city as string,
      state: a.state as string,
      zip: (a.zip as string) || (a.postalCode as string),
      type: a.type as string,
      isCurrent: a.isCurrent as boolean,
      dateRange: a.dateRange as string,
    };
  });

  // Enformion returns phoneNumbers, not phones
  const rawPhones = (first.phoneNumbers as unknown[]) || (first.phones as unknown[]) || [];
  const phones = rawPhones.map((phone: unknown) => {
    const p = phone as Record<string, unknown>;
    return {
      number: (p.number as string) || (p.phoneNumber as string) || "",
      type: p.type as string,
      carrier: p.carrier as string,
      isCurrent: p.isCurrent as boolean,
    };
  });

  // Enformion returns emailAddresses, not emails
  const rawEmails = (first.emailAddresses as unknown[]) || (first.emails as unknown[]) || [];
  const emails = rawEmails.map((email: unknown) => {
    const e = email as Record<string, unknown>;
    return {
      address: (e.address as string) || (e.emailAddress as string) || "",
      type: e.type as string,
      isCurrent: e.isCurrent as boolean,
    };
  });

  // Helper to extract name from object or string
  const extractName = (obj: unknown): string => {
    if (typeof obj === "string") return obj;
    if (typeof obj === "object" && obj) {
      const n = obj as Record<string, unknown>;
      return `${n.firstName || ""} ${n.lastName || ""}`.trim();
    }
    return "";
  };

  // Helper to extract address string from object or string
  const extractAddress = (obj: unknown): string => {
    if (typeof obj === "string") return obj;
    if (typeof obj === "object" && obj) {
      const a = obj as Record<string, unknown>;
      return [a.city, a.state].filter(Boolean).join(", ");
    }
    return "";
  };

  // Parse associates
  const associates = ((first.associates as unknown[]) || []).map((a: unknown) => {
    const assoc = a as Record<string, unknown>;
    return {
      name: extractName(assoc.name),
      relationship: (assoc.relationship as string) || (assoc.relationshipType as string) || "",
      address: extractAddress(assoc.address),
      age: assoc.age as number,
    };
  });

  // Parse relatives
  const relatives = ((first.relatives as unknown[]) || []).map((r: unknown) => {
    const rel = r as Record<string, unknown>;
    return {
      name: extractName(rel.name),
      relationship: (rel.relationship as string) || (rel.relationshipType as string) || "",
      address: extractAddress(rel.address),
      age: rel.age as number,
    };
  });

  // Parse neighbors
  const neighbors = ((first.neighbors as unknown[]) || []).map((n: unknown) => {
    const neighbor = n as Record<string, unknown>;
    return {
      name: extractName(neighbor.name),
      address: extractAddress(neighbor.address),
      age: neighbor.age as number,
    };
  });

  // Parse AKAs (also known as)
  const rawAkas = (first.akas as unknown[]) || [];
  const akas = rawAkas.map((aka: unknown) => {
    if (typeof aka === "string") {
      return { fullName: aka };
    }
    const a = aka as Record<string, unknown>;
    return {
      firstName: a.firstName as string,
      lastName: a.lastName as string,
      middleName: a.middleName as string,
      fullName: extractName(a) || (a.fullName as string),
    };
  });

  // Parse workplaces
  const workplaces = ((first.workPlace as unknown[]) || (first.workplaces as unknown[]) || []).map((w: unknown) => {
    const workplace = w as Record<string, unknown>;
    return {
      company: (workplace.company as string) || (workplace.name as string),
      title: workplace.title as string,
      address: extractAddress(workplace.address),
      phone: workplace.phone as string,
      industry: workplace.industry as string,
    };
  });

  // Parse indicators
  const rawIndicators = (first.indicators as Record<string, unknown>) || {};
  const indicators = {
    isDeceased: rawIndicators.isDeceased as boolean,
    isBusiness: rawIndicators.isBusiness as boolean,
    hasProperty: rawIndicators.hasProperty as boolean,
    hasVehicle: rawIndicators.hasVehicle as boolean,
    hasCriminalRecord: rawIndicators.hasCriminalRecord as boolean,
    hasBankruptcy: rawIndicators.hasBankruptcy as boolean,
    hasLien: rawIndicators.hasLien as boolean,
    hasJudgment: rawIndicators.hasJudgment as boolean,
  };

  // Parse properties
  const properties = ((first.properties as unknown[]) || []).map((p: unknown) => {
    const prop = p as Record<string, unknown>;
    const addr = prop.address as Record<string, unknown> || {};
    return {
      address: (addr.addressLine1 as string) || (addr.street as string),
      city: addr.city as string,
      state: addr.state as string,
      zip: (addr.zip as string) || (addr.postalCode as string),
      propertyType: prop.propertyType as string,
      bedrooms: prop.bedrooms as number,
      bathrooms: prop.bathrooms as number,
      sqft: prop.squareFootage as number,
      lotSize: prop.lotSize as string,
      yearBuilt: prop.yearBuilt as number,
      assessedValue: prop.assessedValue as number,
      marketValue: prop.marketValue as number,
      ownerName: extractName(prop.ownerName),
      purchaseDate: prop.purchaseDate as string,
      purchasePrice: prop.purchasePrice as number,
    };
  });

  // Parse vehicles
  const vehicles = ((first.vehicles as unknown[]) || []).map((v: unknown) => {
    const veh = v as Record<string, unknown>;
    return {
      year: veh.year as number,
      make: veh.make as string,
      model: veh.model as string,
      vin: veh.vin as string,
      plate: veh.licensePlate as string,
      state: veh.state as string,
      color: veh.color as string,
      type: veh.vehicleType as string,
    };
  });

  // Parse criminal records
  const criminalRecords = ((first.criminalRecords as unknown[]) || []).map((c: unknown) => {
    const crime = c as Record<string, unknown>;
    return {
      caseNumber: crime.caseNumber as string,
      offense: crime.offense as string,
      offenseType: crime.offenseType as string,
      offenseDate: crime.offenseDate as string,
      court: crime.court as string,
      county: crime.county as string,
      state: crime.state as string,
      disposition: crime.disposition as string,
      dispositionDate: crime.dispositionDate as string,
      sentence: crime.sentence as string,
      severity: crime.severity as string,
    };
  });

  // Parse bankruptcies
  const bankruptcies = ((first.bankruptcies as unknown[]) || []).map((b: unknown) => {
    const bank = b as Record<string, unknown>;
    return {
      caseNumber: bank.caseNumber as string,
      chapter: bank.chapter as string,
      filingDate: bank.filingDate as string,
      dischargeDate: bank.dischargeDate as string,
      court: bank.court as string,
      status: bank.status as string,
      assets: bank.assets as number,
      liabilities: bank.liabilities as number,
    };
  });

  // Parse liens
  const liens = ((first.liens as unknown[]) || []).map((l: unknown) => {
    const lien = l as Record<string, unknown>;
    return {
      type: lien.type as string,
      amount: lien.amount as number,
      filingDate: lien.filingDate as string,
      releaseDate: lien.releaseDate as string,
      creditor: lien.creditor as string,
      court: lien.court as string,
      status: lien.status as string,
    };
  });

  // Parse judgments
  const judgments = ((first.judgments as unknown[]) || []).map((j: unknown) => {
    const judg = j as Record<string, unknown>;
    return {
      type: judg.type as string,
      amount: judg.amount as number,
      filingDate: judg.filingDate as string,
      court: judg.court as string,
      plaintiff: judg.plaintiff as string,
      status: judg.status as string,
    };
  });

  // Parse professional licenses
  const professionalLicenses = ((first.professionalLicenses as unknown[]) || []).map((l: unknown) => {
    const lic = l as Record<string, unknown>;
    return {
      type: lic.type as string,
      licenseNumber: lic.licenseNumber as string,
      status: lic.status as string,
      issueDate: lic.issueDate as string,
      expirationDate: lic.expirationDate as string,
      state: lic.state as string,
      profession: lic.profession as string,
    };
  });

  // Parse marriages
  const marriages = ((first.marriages as unknown[]) || []).map((m: unknown) => {
    const mar = m as Record<string, unknown>;
    return {
      spouseName: extractName(mar.spouse) || (mar.spouseName as string),
      marriageDate: mar.marriageDate as string,
      county: mar.county as string,
      state: mar.state as string,
    };
  });

  // Parse divorces
  const divorces = ((first.divorces as unknown[]) || []).map((d: unknown) => {
    const div = d as Record<string, unknown>;
    return {
      spouseName: extractName(div.spouse) || (div.spouseName as string),
      divorceDate: div.divorceDate as string,
      filingDate: div.filingDate as string,
      county: div.county as string,
      state: div.state as string,
    };
  });

  // Parse voter registration
  const voterRaw = (first.voters as unknown[]) || [];
  const voterFirst = voterRaw[0] as Record<string, unknown> || {};
  const voterRegistration = voterRaw.length > 0 ? {
    registrationDate: voterFirst.registrationDate as string,
    party: voterFirst.party as string,
    status: voterFirst.status as string,
    county: voterFirst.county as string,
    state: voterFirst.state as string,
  } : undefined;

  // Parse social media
  const socialProfiles = ((first.socialMedia as unknown[]) || []).map((s: unknown) => {
    const social = s as Record<string, unknown>;
    return {
      platform: social.platform as string,
      url: social.url as string,
      username: social.username as string,
    };
  });

  // Parse education
  const education = ((first.education as unknown[]) || []).map((e: unknown) => {
    const edu = e as Record<string, unknown>;
    return {
      school: edu.school as string,
      degree: edu.degree as string,
      field: edu.fieldOfStudy as string,
      year: edu.graduationYear as string,
    };
  });

  const profile: PersonMatch = {
    enformionId: first.tahoeId as string,
    fullName: `${name.firstName || ""} ${name.middleName ? name.middleName + " " : ""}${name.lastName || ""}`.trim(),
    firstName: name.firstName as string,
    lastName: name.lastName as string,
    middleName: name.middleName as string,
    suffix: name.suffix as string,
    prefix: name.prefix as string,
    age: first.age as number,
    dateOfBirth: (first.dob as string) || (first.dateOfBirth as string),
    gender: first.gender as string,
    addresses,
    phones,
    emails,
    associates,
    relatives,
    neighbors,
    akas,
    workplaces,
    indicators,
    photos: (first.photos as string[]) || [],
    publicFirstSeenDate: first.publicFirstSeenDate as string,
    dobLastSeen: first.dobLastSeen as string,
    // New fields
    properties,
    vehicles,
    criminalRecords,
    bankruptcies,
    liens,
    judgments,
    professionalLicenses,
    marriages,
    divorces,
    voterRegistration,
    socialProfiles,
    education,
  };

  const candidate: PersonSearchCandidate = {
    id:
      (first.tahoeId as string) ||
      (first.enformionId as string) ||
      "unknown",
    firstName: name.firstName as string,
    lastName: name.lastName as string,
    middleName: name.middleName as string,
    age: first.age as number,
    rawPayload: first,
  };

  return { candidate, profile, queryLabel };
}

// Parse contact matches from raw response
function parseContactMatches(data: unknown): EnformionContactMatch[] {
  if (!data || typeof data !== "object") return [];

  const response = data as Record<string, unknown>;
  // Enformion returns "persons" array
  const results = (response.persons || response.results || response.Results || []) as unknown[];

  console.log("[parseContactMatches] Raw response:", JSON.stringify(response).substring(0, 500));
  console.log("[parseContactMatches] Found", results.length, "results");

  return results.map((item: unknown, index: number) => {
    const raw = item as Record<string, unknown>;
    const name = (raw.name as Record<string, unknown>) || {};
    
    // Get first address from addresses array
    const addresses = (raw.addresses as unknown[]) || [];
    const address = (addresses[0] as Record<string, unknown>) || (raw.address as Record<string, unknown>);
    
    // Enformion uses phoneNumbers/emailAddresses
    const phones = (raw.phoneNumbers as unknown[]) || (raw.phones as unknown[]) || [];
    const emails = (raw.emailAddresses as unknown[]) || (raw.emails as unknown[]) || [];

    return {
      id:
        (raw.tahoeId as string) ||
        (raw.enformionId as string) ||
        `match-${index}`,
      fullName: `${name.firstName || ""} ${name.lastName || ""}`.trim(),
      firstName: name.firstName as string,
      lastName: name.lastName as string,
      address: address
        ? {
            street: (address.street as string) || (address.addressLine1 as string),
            city: address.city as string,
            state: address.state as string,
            zip: (address.zip as string) || (address.postalCode as string),
          }
        : undefined,
      phones: phones.map((p: unknown) => {
        const phone = p as Record<string, unknown>;
        return {
          number: (phone.number as string) || (phone.phoneNumber as string) || "",
          type: phone.type as string,
        };
      }),
      emails: emails.map((e: unknown) => {
        const email = e as Record<string, unknown>;
        return {
          address: (email.address as string) || (email.emailAddress as string) || "",
        };
      }),
      enformionId: raw.tahoeId as string,
    };
  });
}

// ============================================
// Public API
// ============================================

export async function searchPersonCandidates(
  query: SearchQuery
): Promise<PersonSearchCandidate[]> {
  const payload = buildPersonSearchPayload(query);
  payload.mode = "name";
  const data = await performEnformionRequest("person_candidates", payload);
  return parseCandidates(data);
}

export async function fetchPersonProfile(
  candidate: PersonSearchCandidate,
  queryPayload: Record<string, unknown>
): Promise<PersonProfileState | null> {
  const rawPayload = candidate.rawPayload;
  const enformionId =
    (rawPayload.tahoeId as string) ||
    (rawPayload.enformionId as string) ||
    (rawPayload.id as string) ||
    (candidate.id.startsWith("G-") ? candidate.id : null);

  if (!enformionId) {
    throw new EnformionServiceError("Missing enformionId in candidate");
  }

  const payload: Record<string, unknown> = {
    enformionId,
  };

  // Include original search params
  if (queryPayload.FirstName) payload.FirstName = queryPayload.FirstName;
  if (queryPayload.LastName) payload.LastName = queryPayload.LastName;

  const data = await performEnformionRequest("person_profile", payload);
  const queryLabel = `${candidate.firstName} ${candidate.lastName}`.trim();
  return parseProfile(data, queryLabel);
}

export async function lookupContactMatches(
  query: SearchQuery
): Promise<EnformionContactMatch[]> {
  let operation: EnformionOperation;
  let payload: Record<string, unknown>;

  switch (query.mode) {
    case "phone":
      operation = "reverse_phone";
      payload = buildPhonePayload(query);
      payload.mode = "phone";
      break;
    case "email":
      operation = "email_lookup";
      payload = buildEmailPayload(query);
      payload.mode = "email";
      break;
    case "address":
      operation = "address_lookup";
      payload = buildAddressPayload(query);
      payload.mode = "address";
      break;
    default:
      return [];
  }

  const data = await performEnformionRequest(operation, payload);
  return parseContactMatches(data);
}

// ============================================
// AI Profile Search Service
// ============================================

class AIProfileSearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIProfileSearchError";
  }
}

export async function runAIProfileSearch(
  query: string,
  model: string = "gpt-4o"
): Promise<string> {
  try {
  const url = getFunctionsUrl("ai-profile-search");
  const headers = await getAuthHeaders();

  const payload = {
    model,
    messages: [{ role: "user", content: query }],
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
      let errorMessage = "AI search failed";
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.error || errorData.message || errorData.details || errorMessage;
      } catch {
        const errorText = await response.text();
        if (errorText) errorMessage = errorText;
      }
    throw new AIProfileSearchError(errorMessage);
  }

  const data = (await response.json()) as AIProfileSearchResponse;
  if (!data.content) {
    throw new AIProfileSearchError("Invalid AI search response");
  }

  return data.content;
  } catch (error) {
    if (error instanceof AIProfileSearchError) {
      throw error;
    }
    // Handle network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new AIProfileSearchError(
        "Network error: Unable to connect to AI search service. Please check your internet connection."
      );
    }
    throw new AIProfileSearchError(
      error instanceof Error ? error.message : "An unexpected error occurred"
    );
  }
}

