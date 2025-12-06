// ============================================
// Search Query Types
// ============================================

export type SearchMode = "name" | "phone" | "email" | "address";

export interface SearchQuery {
  mode: SearchMode;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phone?: string;
  email?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

// ============================================
// Person Search Types (Enformion)
// ============================================

export interface PersonSearchCandidate {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  age?: number;
  city?: string;
  state?: string;
  addresses?: string[];
  rawPayload: Record<string, unknown>;
}

export interface PersonMatch {
  enformionId?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  suffix?: string;
  prefix?: string;
  age?: number;
  dateOfBirth?: string;
  gender?: string;
  addresses?: PersonAddress[];
  phones?: PersonPhone[];
  emails?: PersonEmail[];
  associates?: PersonAssociate[];
  relatives?: PersonRelative[];
  neighbors?: PersonNeighbor[];
  akas?: PersonAka[];
  education?: PersonEducation[];
  employment?: PersonEmployment[];
  workplaces?: PersonWorkplace[];
  socialProfiles?: PersonSocialProfile[];
  photos?: string[];
  indicators?: PersonIndicators;
  publicFirstSeenDate?: string;
  dobLastSeen?: string;
  // Property & Assets
  properties?: PersonProperty[];
  vehicles?: PersonVehicle[];
  // Legal Records
  criminalRecords?: PersonCriminalRecord[];
  bankruptcies?: PersonBankruptcy[];
  liens?: PersonLien[];
  judgments?: PersonJudgment[];
  // Licenses
  professionalLicenses?: PersonLicense[];
  // Life Events
  marriages?: PersonMarriage[];
  divorces?: PersonDivorce[];
  // Voter Info
  voterRegistration?: PersonVoter;
}

export interface PersonAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  type?: string;
  isCurrent?: boolean;
  dateRange?: string;
}

export interface PersonPhone {
  number: string;
  type?: string;
  carrier?: string;
  isCurrent?: boolean;
}

export interface PersonEmail {
  address: string;
  type?: string;
  isCurrent?: boolean;
}

export interface PersonAssociate {
  name: string;
  relationship?: string;
  address?: string;
  age?: number;
}

export interface PersonRelative {
  name: string;
  relationship?: string;
  address?: string;
  age?: number;
}

export interface PersonNeighbor {
  name: string;
  address?: string;
  age?: number;
}

export interface PersonAka {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  fullName?: string;
}

export interface PersonEducation {
  school?: string;
  degree?: string;
  field?: string;
  year?: string;
}

export interface PersonEmployment {
  company?: string;
  title?: string;
  industry?: string;
  dateRange?: string;
}

export interface PersonWorkplace {
  company?: string;
  title?: string;
  address?: string;
  phone?: string;
  industry?: string;
}

export interface PersonIndicators {
  isDeceased?: boolean;
  isBusiness?: boolean;
  hasProperty?: boolean;
  hasVehicle?: boolean;
  hasCriminalRecord?: boolean;
  hasBankruptcy?: boolean;
  hasLien?: boolean;
  hasJudgment?: boolean;
}

export interface PersonSocialProfile {
  platform: string;
  url: string;
  username?: string;
}

export interface PersonProperty {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lotSize?: string;
  yearBuilt?: number;
  assessedValue?: number;
  marketValue?: number;
  ownerName?: string;
  purchaseDate?: string;
  purchasePrice?: number;
}

export interface PersonVehicle {
  year?: number;
  make?: string;
  model?: string;
  vin?: string;
  plate?: string;
  state?: string;
  color?: string;
  type?: string;
}

export interface PersonCriminalRecord {
  caseNumber?: string;
  offense?: string;
  offenseType?: string;
  offenseDate?: string;
  court?: string;
  county?: string;
  state?: string;
  disposition?: string;
  dispositionDate?: string;
  sentence?: string;
  severity?: string;
}

export interface PersonBankruptcy {
  caseNumber?: string;
  chapter?: string;
  filingDate?: string;
  dischargeDate?: string;
  court?: string;
  status?: string;
  assets?: number;
  liabilities?: number;
}

export interface PersonLien {
  type?: string;
  amount?: number;
  filingDate?: string;
  releaseDate?: string;
  creditor?: string;
  court?: string;
  status?: string;
}

export interface PersonJudgment {
  type?: string;
  amount?: number;
  filingDate?: string;
  court?: string;
  plaintiff?: string;
  status?: string;
}

export interface PersonLicense {
  type?: string;
  licenseNumber?: string;
  status?: string;
  issueDate?: string;
  expirationDate?: string;
  state?: string;
  profession?: string;
}

export interface PersonMarriage {
  spouseName?: string;
  marriageDate?: string;
  county?: string;
  state?: string;
}

export interface PersonDivorce {
  spouseName?: string;
  divorceDate?: string;
  filingDate?: string;
  county?: string;
  state?: string;
}

export interface PersonVoter {
  registrationDate?: string;
  party?: string;
  status?: string;
  county?: string;
  state?: string;
}

export interface PersonProfileState {
  candidate: PersonSearchCandidate;
  profile: PersonMatch;
  queryLabel: string;
}

// ============================================
// Contact Lookup Types
// ============================================

export interface EnformionContactMatch {
  id: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  address?: PersonAddress;
  phones?: PersonPhone[];
  emails?: PersonEmail[];
  enformionId?: string;
}

// ============================================
// Records Search Types
// ============================================

export interface RecordsSearchRequest {
  person: {
    firstName: string;
    lastName: string;
    dob?: string;
    city?: string;
    state?: string;
  };
  jurisdictions?: string[];
}

export interface RecordsSearchResponse {
  records: CourtRecord[];
  provider?: string;
  tookMs?: number;
}

export interface CourtRecord {
  id: string;
  category: string;
  caseNumber?: string;
  filedDate?: string;
  status?: string;
  jurisdiction?: string;
  description?: string;
  raw?: Record<string, unknown>;
}

// ============================================
// Username Search Types
// ============================================

export interface UsernameSearchRequest {
  username: string;
}

export interface UsernameSearchResponse {
  username: string;
  profiles: UsernameProbe[];
  provider?: string;
  tookMs?: number;
}

export interface UsernameProbe {
  site: string;
  display: string;
  url?: string;
  status?: number;
  exists: boolean;
  confidence: number;
  error?: string;
}

// ============================================
// Vehicle / VIN Decoder Types
// ============================================

export interface VinDecodedVehicle {
  vin: string;
  values: Record<string, string>;
  modelYear?: string;
  make?: string;
  model?: string;
  trim?: string;
  series?: string;
  bodyClass?: string;
  vehicleType?: string;
  manufacturer?: string;
  plantCountry?: string;
  plantState?: string;
  plantCity?: string;
  fuelType?: string;
  driveType?: string;
  transmission?: string;
  doors?: string;
  engineConfiguration?: string;
  engineCylinders?: string;
  engineHP?: string;
  engineKW?: string;
  engineDisplacementL?: string;
  errorText?: string;
}

export interface NHTSADecodeResponse {
  Results: NHTSAResult[];
}

export interface NHTSAResult {
  [key: string]: string | number | null;
}

// ============================================
// Privacy / Remove Me Types
// ============================================

export interface RemoveMePayload {
  userId: string;
  optOut: boolean;
  client: string;
  requestedAt: string;
}

export interface RemoveMeResponse {
  status?: string;
  error?: string;
}

export interface ExposureScoreData {
  score: number;
  maxScore: number;
  categories: ExposureCategory[];
}

export interface ExposureCategory {
  name: string;
  exposed: boolean;
  severity: "low" | "medium" | "high";
  description: string;
}

// ============================================
// AI Profile Search Types
// ============================================

export interface AIProfileSearchPayload {
  model: string;
  messages: AIProfileSearchMessage[];
}

export interface AIProfileSearchMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIProfileSearchResponse {
  content: string;
}

// ============================================
// Unclaimed Money Types
// ============================================

export interface UnclaimedMoneyState {
  code: string;
  name: string;
  url: string;
}

// ============================================
// API Error Types
// ============================================

export interface ApiError {
  error?: string;
  details?: string;
  message?: string;
  statusCode?: number;
}

// ============================================
// Generic Response Types
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

