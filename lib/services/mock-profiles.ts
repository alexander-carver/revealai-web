import type { PersonProfileState, PersonSearchCandidate } from "@/lib/types";

export function interceptMockProfile(
  enformionId: string,
  queryPayload: Record<string, unknown>,
  candidate: PersonSearchCandidate
): PersonProfileState | null {
  const mocks: Record<string, PersonProfileState["profile"]> = {
    "emma-smith": {
      enformionId: "emma-smith",
      fullName: "Emma Rose Smith",
      firstName: "Emma",
      lastName: "Smith",
      age: 32,
      dateOfBirth: "1992-03-15",
      addresses: [
        { street: "1420 Wynkoop St", city: "Denver", state: "CO", zip: "80202", isCurrent: true, dateRange: "2019 - Present" },
        { street: "2450 Colorado Ave", city: "Boulder", state: "CO", zip: "80302", isCurrent: false, dateRange: "2010 - 2014" }
      ],
      phones: [
        { number: "(303) 555-0198", type: "Mobile", carrier: "Verizon", isCurrent: true },
        { number: "(720) 555-0842", type: "Landline", isCurrent: false }
      ],
      emails: [
        { address: "emma.rose.smith@gmail.com", isCurrent: true },
        { address: "esmith92@colorado.edu", isCurrent: false }
      ],
      properties: [
        { address: "1420 Wynkoop St Unit 4B", city: "Denver", state: "CO", zip: "80202", propertyType: "Condominium", bedrooms: 2, bathrooms: 2, sqft: 1250, yearBuilt: 2008, marketValue: 650000, ownerName: "Emma Rose Smith" }
      ],
      vehicles: [
        { year: 2021, make: "Subaru", model: "Crosstrek", vin: "4S4GTAAD6M*******", state: "CO" }
      ],
      criminalRecords: [],
      employment: [
        { company: "TechFlow Solutions", title: "Senior Marketing Manager", dateRange: "2019 - Present" },
        { company: "Peak Digital Agency", title: "Marketing Coordinator", dateRange: "2015 - 2019" }
      ],
      education: [
        { school: "University of Colorado Boulder", degree: "Bachelor of Arts", field: "Marketing and Communications", year: "2014" }
      ],
      socialProfiles: [
        { platform: "Instagram", url: "https://instagram.com/emmasmith_co", username: "@emmasmith_co" },
        { platform: "LinkedIn", url: "https://linkedin.com/in/emmasmith-denver" },
        { platform: "Tinder", url: "https://tinder.com/@emmasmith92" }
      ],
      photos: ["/emma-3.png", "/emma-2.png", "/emma-4.png", "/emma-1.png"],
      akas: [{ fullName: "Emma R. Smith" }, { fullName: "Emma Rose Smith" }]
    },
    "kyle-anderson": {
      enformionId: "kyle-anderson",
      fullName: "Kyle James Anderson",
      firstName: "Kyle",
      lastName: "Anderson",
      age: 34,
      dateOfBirth: "1989-11-04",
      addresses: [
        { street: "842 E 4th St", city: "Austin", state: "TX", zip: "78702", isCurrent: true, dateRange: "2021 - Present" },
        { street: "1200 N State St", city: "Chicago", state: "IL", zip: "60610", isCurrent: false, dateRange: "2015 - 2021" }
      ],
      phones: [{ number: "(512) 555-0122", type: "Mobile", carrier: "AT&T", isCurrent: true }],
      emails: [
        { address: "kyle.anderson89@gmail.com", isCurrent: true },
        { address: "kyle@elevate-fitness-atx.com", type: "Work", isCurrent: true }
      ],
      properties: [],
      vehicles: [{ year: 2018, make: "Ford", model: "F-150", state: "TX" }],
      criminalRecords: [
        { caseNumber: "CR-2016-0421", offense: "DUI - First Offense", offenseType: "Misdemeanor", offenseDate: "2016-04-12", court: "Cook County Circuit Court", state: "IL", county: "Cook", severity: "Misdemeanor" }
      ],
      liens: [
        { filingDate: "2020-11-15", amount: 4500, creditor: "State of Illinois Dept of Revenue", type: "State Tax Lien" }
      ],
      employment: [{ company: "Elevate Fitness ATX", title: "Owner / Head Trainer", dateRange: "2021 - Present" }],
      education: [{ school: "University of Illinois", degree: "B.S. Kinesiology", year: "2011" }],
      socialProfiles: [
        { platform: "Instagram", url: "https://instagram.com/kyle.fits", username: "@kyle.fits" },
        { platform: "Facebook", url: "https://facebook.com/kyleanderson" }
      ],
      photos: ["/kyle-1.png", "/kyle-2.png", "/kyle-3.png"],
      akas: [{ fullName: "Kyle J. Anderson" }]
    },
    "donald-trump": {
      enformionId: "donald-trump",
      fullName: "Donald John Trump",
      firstName: "Donald",
      lastName: "Trump",
      age: 77,
      dateOfBirth: "1946-06-14",
      addresses: [
        { street: "1100 S Ocean Blvd", city: "Palm Beach", state: "FL", zip: "33480", isCurrent: true, dateRange: "2019 - Present" },
        { street: "725 5th Ave", city: "New York", state: "NY", zip: "10022", isCurrent: false, dateRange: "1983 - 2019" }
      ],
      phones: [],
      emails: [],
      properties: [
        { address: "1100 S Ocean Blvd (Mar-a-Lago)", city: "Palm Beach", state: "FL", zip: "33480", propertyType: "Commercial / Club", ownerName: "Donald J. Trump" }
      ],
      vehicles: [],
      criminalRecords: [
        { caseNumber: "IND-71543-23", offense: "Falsifying Business Records in the First Degree (34 counts)", offenseType: "Felony", offenseDate: "2023-04-04", court: "New York Supreme Court", state: "NY", county: "New York", severity: "Felony" }
      ],
      judgments: [
        { filingDate: "2024-02-16", amount: 354900000, plaintiff: "State of New York", type: "Civil Fraud Judgment" }
      ],
      employment: [
        { company: "The Trump Organization", title: "Chairman / President", dateRange: "1971 - Present" },
        { company: "United States Government", title: "President of the United States", dateRange: "2017 - 2021" }
      ],
      education: [
        { school: "University of Pennsylvania", degree: "B.S. Economics", year: "1968" }
      ],
      socialProfiles: [
        { platform: "Truth Social", url: "https://truthsocial.com/@realDonaldTrump", username: "@realDonaldTrump" },
        { platform: "X", url: "https://x.com/realDonaldTrump", username: "@realDonaldTrump" }
      ],
      photos: ["/mock/trump1.jpg", "/mock/trump2.jpg", "/mock/trump3.jpg"],
      akas: [{ fullName: "Donald J. Trump" }]
    },
    "mrbeast": {
      enformionId: "mrbeast",
      fullName: "Jimmy Donaldson",
      firstName: "Jimmy",
      lastName: "Donaldson",
      age: 25,
      dateOfBirth: "1998-05-07",
      addresses: [
        { city: "Greenville", state: "NC", isCurrent: true }
      ],
      phones: [],
      emails: [],
      properties: [],
      vehicles: [],
      criminalRecords: [],
      employment: [
        { company: "MrBeast YouTube", title: "Creator / CEO", dateRange: "2012 - Present" },
        { company: "Feastables", title: "Founder", dateRange: "2022 - Present" }
      ],
      socialProfiles: [
        { platform: "YouTube", url: "https://youtube.com/@MrBeast", username: "@MrBeast" },
        { platform: "Instagram", url: "https://instagram.com/mrbeast", username: "@mrbeast" }
      ],
      photos: ["/mock/mrbeast1.jpg", "/mock/mrbeast2.jpg", "/mock/mrbeast3.jpg"],
      akas: [{ fullName: "MrBeast" }]
    },
    "jeffrey-epstein": {
      enformionId: "jeffrey-epstein",
      fullName: "Jeffrey Edward Epstein",
      firstName: "Jeffrey",
      lastName: "Epstein",
      indicators: { isDeceased: true },
      dateOfBirth: "1953-01-20",
      addresses: [
        { street: "9 E 71st St", city: "New York", state: "NY", zip: "10021", isCurrent: false },
        { street: "358 El Brillo Way", city: "Palm Beach", state: "FL", zip: "33480", isCurrent: false }
      ],
      phones: [],
      emails: [],
      properties: [
        { address: "9 E 71st St", city: "New York", state: "NY", zip: "10021", ownerName: "Jeffrey Epstein" }
      ],
      vehicles: [],
      criminalRecords: [
        { offense: "Sex Trafficking of Minors", offenseType: "Federal Felony", offenseDate: "2019-07-06", court: "SDNY", state: "NY", severity: "Felony" },
        { offense: "Procuring a Person Under 18 for Prostitution", offenseType: "State Charge", offenseDate: "2008-06-30", court: "Florida State Court", state: "FL", severity: "Felony" }
      ],
      employment: [
        { company: "J. Epstein & Co.", title: "Founder", dateRange: "1982 - 2019" }
      ],
      socialProfiles: [],
      photos: ["/mock/jefferyepstein1.jpg"],
      akas: [{ fullName: "Jeffery Epstein" }]
    },
    "elon-musk": {
      enformionId: "elon-musk",
      fullName: "Elon Reeve Musk",
      firstName: "Elon",
      lastName: "Musk",
      age: 52,
      dateOfBirth: "1971-06-28",
      addresses: [
        { city: "Boca Chica", state: "TX", isCurrent: true },
        { city: "Los Angeles", state: "CA", isCurrent: false }
      ],
      phones: [],
      emails: [],
      properties: [],
      vehicles: [],
      criminalRecords: [],
      employment: [
        { company: "Tesla, Inc.", title: "CEO", dateRange: "2008 - Present" },
        { company: "SpaceX", title: "CEO / Chief Engineer", dateRange: "2002 - Present" },
        { company: "X Corp", title: "Owner / CTO", dateRange: "2022 - Present" }
      ],
      socialProfiles: [
        { platform: "X", url: "https://x.com/elonmusk", username: "@elonmusk" }
      ],
      photos: ["/mock/elonmusk2.jpg", "/mock/elonmusk3.jpg"],
      akas: [{ fullName: "Elon R. Musk" }]
    },
    "dua-lipa": {
      enformionId: "dua-lipa",
      fullName: "Dua Lipa",
      firstName: "Dua",
      lastName: "Lipa",
      age: 28,
      dateOfBirth: "1995-08-22",
      addresses: [
        { city: "London", state: "UK", isCurrent: true }
      ],
      phones: [],
      emails: [],
      properties: [],
      vehicles: [],
      criminalRecords: [],
      employment: [
        { company: "Warner Records", title: "Recording Artist", dateRange: "2015 - Present" }
      ],
      socialProfiles: [
        { platform: "Instagram", url: "https://instagram.com/dualipa", username: "@dualipa" }
      ],
      photos: ["/mock/dualipa1.jpg", "/mock/dualipa2.jpg", "/mock/dualipa3.jpg"],
      akas: []
    },
    "andrew-tate": {
      enformionId: "andrew-tate",
      fullName: "Emory Andrew Tate III",
      firstName: "Andrew",
      lastName: "Tate",
      age: 37,
      dateOfBirth: "1986-12-01",
      addresses: [
        { city: "Bucharest", state: "Romania", isCurrent: true }
      ],
      phones: [],
      emails: [],
      properties: [],
      vehicles: [],
      criminalRecords: [
        { offense: "Human Trafficking, Rape, Organized Crime", offenseType: "Felony", offenseDate: "2023-06-20", court: "Romanian Court", state: "International", severity: "Felony" }
      ],
      employment: [
        { company: "The Real World / Hustler's University", title: "Founder", dateRange: "2021 - Present" }
      ],
      socialProfiles: [
        { platform: "X", url: "https://x.com/Cobratate", username: "@Cobratate" }
      ],
      photos: ["/mock/andrewtate1.jpg", "/mock/andrewtate2.jpg", "/mock/andrewtate3.jpg"],
      akas: [{ fullName: "Emory Andrew Tate III" }]
    },
    "taylor-swift": {
      enformionId: "taylor-swift",
      fullName: "Taylor Alison Swift",
      firstName: "Taylor",
      lastName: "Swift",
      age: 34,
      dateOfBirth: "1989-12-13",
      addresses: [
        { city: "New York", state: "NY", isCurrent: true },
        { city: "Nashville", state: "TN", isCurrent: false }
      ],
      phones: [],
      emails: [],
      properties: [],
      vehicles: [],
      criminalRecords: [],
      employment: [
        { company: "Republic Records", title: "Recording Artist", dateRange: "2018 - Present" }
      ],
      socialProfiles: [
        { platform: "Instagram", url: "https://instagram.com/taylorswift", username: "@taylorswift" }
      ],
      photos: ["/mock/taylorswift1.jpg", "/mock/taylorswift2.jpg"],
      akas: []
    },
    "lebron-james": {
      enformionId: "lebron-james",
      fullName: "LeBron Raymone James",
      firstName: "LeBron",
      lastName: "James",
      age: 39,
      dateOfBirth: "1984-12-30",
      addresses: [
        { city: "Los Angeles", state: "CA", isCurrent: true }
      ],
      phones: [],
      emails: [],
      properties: [],
      vehicles: [],
      criminalRecords: [],
      employment: [
        { company: "Los Angeles Lakers", title: "Professional Athlete", dateRange: "2018 - Present" }
      ],
      socialProfiles: [
        { platform: "Instagram", url: "https://instagram.com/kingjames", username: "@kingjames" }
      ],
      photos: ["/mock/lebronjames1.jpg", "/mock/lebronjames2.jpg"],
      akas: [{ fullName: "King James" }]
    }
  };

  const profile = mocks[enformionId];
  if (!profile) return null;

  return {
    queryLabel: profile.fullName || candidate.firstName + " " + candidate.lastName,
    candidate,
    profile
  };
}
