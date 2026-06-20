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
      phones: [
        { number: "(212) 832-2000", type: "Work", carrier: "Verizon", isCurrent: false },
        { number: "(561) 832-2600", type: "Landline", carrier: "AT&T", isCurrent: true }
      ],
      emails: [
        { address: "djt@trumporg.com", type: "Work", isCurrent: true },
        { address: "president@donaldjtrump.com", isCurrent: true }
      ],
      properties: [
        { address: "1100 S Ocean Blvd (Mar-a-Lago)", city: "Palm Beach", state: "FL", zip: "33480", propertyType: "Commercial / Club", ownerName: "Donald J. Trump", marketValue: 250000000 },
        { address: "725 5th Ave (Trump Tower Penthouse)", city: "New York", state: "NY", zip: "10022", propertyType: "Condominium", ownerName: "Donald J. Trump", marketValue: 50000000 }
      ],
      vehicles: [
        { year: 2015, make: "Rolls-Royce", model: "Phantom", state: "FL" },
        { year: 1997, make: "Lamborghini", model: "Diablo VT Roadster", state: "NY" }
      ],
      criminalRecords: [
        { caseNumber: "IND-71543-23", offense: "Falsifying Business Records in the First Degree (34 counts)", offenseType: "Felony", offenseDate: "2023-04-04", court: "New York Supreme Court", state: "NY", county: "New York", severity: "Felony" },
        { caseNumber: "23-CR-257", offense: "Willful Retention of National Defense Information", offenseType: "Federal Felony", offenseDate: "2023-06-08", court: "SDFL", state: "FL", severity: "Felony" }
      ],
      judgments: [
        { filingDate: "2024-02-16", amount: 354900000, plaintiff: "State of New York", type: "Civil Fraud Judgment" },
        { filingDate: "2024-01-26", amount: 83300000, plaintiff: "E. Jean Carroll", type: "Defamation Judgment" }
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
        { street: "100 MrBeast Way", city: "Greenville", state: "NC", zip: "27858", isCurrent: true, dateRange: "2020 - Present" },
        { street: "4325 Stantonsburg Rd", city: "Greenville", state: "NC", zip: "27834", isCurrent: false, dateRange: "2016 - 2020" }
      ],
      phones: [
        { number: "(252) 555-0199", type: "Mobile", carrier: "T-Mobile", isCurrent: true }
      ],
      emails: [
        { address: "jimmy@mrbeastbusiness.com", type: "Work", isCurrent: true },
        { address: "jimmyd1998@gmail.com", isCurrent: false }
      ],
      properties: [
        { address: "100 MrBeast Way (Studio Complex)", city: "Greenville", state: "NC", zip: "27858", propertyType: "Commercial", marketValue: 12000000, ownerName: "Beast Holdings LLC" },
        { address: "142 Lakeview Dr", city: "Greenville", state: "NC", zip: "27858", propertyType: "Single Family", bedrooms: 5, bathrooms: 6, marketValue: 2400000, ownerName: "Jimmy Donaldson" }
      ],
      vehicles: [
        { year: 2021, make: "Tesla", model: "Model S Plaid", state: "NC" },
        { year: 2022, make: "Lamborghini", model: "Huracan", state: "NC" }
      ],
      criminalRecords: [],
      employment: [
        { company: "MrBeast YouTube", title: "Creator / CEO", dateRange: "2012 - Present" },
        { company: "Feastables", title: "Founder", dateRange: "2022 - Present" },
        { company: "Beast Philanthropy", title: "Founder", dateRange: "2020 - Present" }
      ],
      socialProfiles: [
        { platform: "YouTube", url: "https://youtube.com/@MrBeast", username: "@MrBeast" },
        { platform: "Instagram", url: "https://instagram.com/mrbeast", username: "@mrbeast" },
        { platform: "X", url: "https://x.com/MrBeast", username: "@MrBeast" }
      ],
      photos: ["/mock/mrbeast1.jpg", "/mock/mrbeast2.jpg", "/mock/mrbeast3.jpg"],
      akas: [{ fullName: "MrBeast" }]
    },
    "jeffrey-epstein": {
      enformionId: "jeffrey-epstein",
      fullName: "Jeffrey Edward Epstein",
      firstName: "Jeffrey",
      lastName: "Epstein",
      indicators: { isDeceased: true, isSexOffender: true },
      dateOfBirth: "1953-01-20",
      addresses: [
        { street: "9 E 71st St", city: "New York", state: "NY", zip: "10021", isCurrent: false, dateRange: "1996 - 2019" },
        { street: "358 El Brillo Way", city: "Palm Beach", state: "FL", zip: "33480", isCurrent: false, dateRange: "1990 - 2019" },
        { street: "Little St. James Island", city: "Saint Thomas", state: "VI", zip: "00802", isCurrent: false, dateRange: "1998 - 2019" },
        { street: "Zorro Ranch", city: "Stanley", state: "NM", zip: "87056", isCurrent: false, dateRange: "1993 - 2019" }
      ],
      phones: [
        { number: "(212) 555-0144", type: "Landline", isCurrent: false },
        { number: "(561) 555-0899", type: "Mobile", isCurrent: false }
      ],
      emails: [
        { address: "jeffrey@jepsteinco.com", isCurrent: false }
      ],
      properties: [
        { address: "9 E 71st St", city: "New York", state: "NY", zip: "10021", propertyType: "Townhouse", marketValue: 51000000, ownerName: "Maple Inc." },
        { address: "358 El Brillo Way", city: "Palm Beach", state: "FL", zip: "33480", propertyType: "Single Family", marketValue: 18000000, ownerName: "Jeffrey Epstein" },
        { address: "Little St. James Island", city: "Saint Thomas", state: "VI", propertyType: "Private Island", marketValue: 60000000, ownerName: "LSJ LLC" }
      ],
      vehicles: [
        { year: 2008, make: "Boeing", model: "727 (N212JE)", state: "NY", type: "Aircraft" },
        { year: 2014, make: "Gulfstream", model: "G550", state: "VI", type: "Aircraft" }
      ],
      criminalRecords: [
        { offense: "Sex Trafficking of Minors", offenseType: "Federal Felony", offenseDate: "2019-07-06", court: "SDNY", state: "NY", severity: "Felony" },
        { offense: "Procuring a Person Under 18 for Prostitution", offenseType: "State Charge", offenseDate: "2008-06-30", court: "Florida State Court", state: "FL", severity: "Felony", disposition: "Guilty Plea" }
      ],
      employment: [
        { company: "J. Epstein & Co.", title: "Founder", dateRange: "1982 - 2019" },
        { company: "Financial Trust Company", title: "Chairman", dateRange: "1990 - 2019" }
      ],
      socialProfiles: [],
      photos: ["/mock/jefferyepstein1.jpg"],
      akas: [{ fullName: "Jeffery Epstein" }, { fullName: "J. Epstein" }]
    },
    "elon-musk": {
      enformionId: "elon-musk",
      fullName: "Elon Reeve Musk",
      firstName: "Elon",
      lastName: "Musk",
      age: 52,
      dateOfBirth: "1971-06-28",
      addresses: [
        { street: "1 Rocket Rd", city: "Hawthorne", state: "CA", zip: "90250", isCurrent: false, dateRange: "2002 - 2020" },
        { street: "Starbase", city: "Boca Chica", state: "TX", zip: "78521", isCurrent: true, dateRange: "2020 - Present" },
        { street: "10911 Chalon Rd", city: "Los Angeles", state: "CA", zip: "90077", isCurrent: false, dateRange: "2012 - 2020" }
      ],
      phones: [
        { number: "(310) 363-6000", type: "Work", isCurrent: true }
      ],
      emails: [
        { address: "elon@tesla.com", type: "Work", isCurrent: true },
        { address: "elon@spacex.com", type: "Work", isCurrent: true }
      ],
      properties: [
        { address: "Starbase Facility", city: "Boca Chica", state: "TX", propertyType: "Commercial", ownerName: "Space Exploration Technologies Corp" }
      ],
      vehicles: [
        { year: 2023, make: "Tesla", model: "Cybertruck", state: "TX" },
        { year: 2010, make: "Tesla", model: "Roadster (In Space)", state: "Space" }
      ],
      criminalRecords: [],
      employment: [
        { company: "Tesla, Inc.", title: "CEO", dateRange: "2008 - Present" },
        { company: "SpaceX", title: "CEO / Chief Engineer", dateRange: "2002 - Present" },
        { company: "X Corp", title: "Owner / CTO", dateRange: "2022 - Present" },
        { company: "Neuralink", title: "Co-Founder", dateRange: "2016 - Present" },
        { company: "The Boring Company", title: "Founder", dateRange: "2016 - Present" }
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
        { street: "West Hampstead", city: "London", state: "UK", isCurrent: true, dateRange: "2018 - Present" },
        { street: "Hollywood Hills", city: "Los Angeles", state: "CA", zip: "90046", isCurrent: false, dateRange: "2021 - 2023" }
      ],
      phones: [
        { number: "(310) 555-0199", type: "Mobile", isCurrent: true }
      ],
      emails: [
        { address: "management@tapmusic.com", type: "Work", isCurrent: true }
      ],
      properties: [
        { address: "West Hampstead", city: "London", state: "UK", propertyType: "Single Family", marketValue: 8000000, ownerName: "Dua Lipa" }
      ],
      vehicles: [
        { year: 2022, make: "Porsche", model: "Taycan", state: "CA" },
        { year: 2023, make: "Range Rover", model: "Autobiography", state: "UK" }
      ],
      criminalRecords: [],
      employment: [
        { company: "Warner Records", title: "Recording Artist", dateRange: "2015 - Present" },
        { company: "Service95", title: "Founder", dateRange: "2022 - Present" }
      ],
      socialProfiles: [
        { platform: "Instagram", url: "https://instagram.com/dualipa", username: "@dualipa" },
        { platform: "X", url: "https://x.com/DUALIPA", username: "@DUALIPA" },
        { platform: "TikTok", url: "https://tiktok.com/@dualipaofficial", username: "@dualipaofficial" }
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
      indicators: { isSexOffender: true },
      addresses: [
        { street: "Voluntari", city: "Bucharest", state: "Romania", isCurrent: true, dateRange: "2017 - Present" },
        { street: "Luton", city: "Bedfordshire", state: "UK", isCurrent: false, dateRange: "2010 - 2017" }
      ],
      phones: [
        { number: "+40 722 555 198", type: "Mobile", isCurrent: true }
      ],
      emails: [
        { address: "andrew@cobratate.com", type: "Work", isCurrent: true }
      ],
      properties: [
        { address: "Tate Compound", city: "Bucharest", state: "Romania", propertyType: "Compound", ownerName: "Tate Brothers", marketValue: 7000000 }
      ],
      vehicles: [
        { year: 2022, make: "Bugatti", model: "Chiron Pur Sport", state: "Romania", color: "Copper" },
        { year: 2021, make: "Aston Martin", model: "DBS Superleggera", state: "Romania" },
        { year: 2020, make: "McLaren", model: "765LT", state: "Romania" }
      ],
      criminalRecords: [
        { offense: "Human Trafficking, Rape, Organized Crime", offenseType: "Felony", offenseDate: "2023-06-20", court: "Romanian Court", state: "International", severity: "Felony" },
        { offense: "Arrested on UK Warrant (Sexual Aggression)", offenseType: "Warrant", offenseDate: "2024-03-11", court: "Bucharest Court of Appeal", state: "International", severity: "Felony" }
      ],
      employment: [
        { company: "The Real World / Hustler's University", title: "Founder", dateRange: "2021 - Present" },
        { company: "Professional Kickboxing", title: "Athlete (ISKA Champion)", dateRange: "2007 - 2016" }
      ],
      socialProfiles: [
        { platform: "X", url: "https://x.com/Cobratate", username: "@Cobratate" },
        { platform: "Rumble", url: "https://rumble.com/c/TateSpeech", username: "@TateSpeech" }
      ],
      photos: ["/mock/andrewtate1.jpg", "/mock/andrewtate2.jpg", "/mock/andrewtate3.jpg"],
      akas: [{ fullName: "Emory Andrew Tate III" }, { fullName: "Cobra Tate" }, { fullName: "Top G" }]
    },
    "taylor-swift": {
      enformionId: "taylor-swift",
      fullName: "Taylor Alison Swift",
      firstName: "Taylor",
      lastName: "Swift",
      age: 34,
      dateOfBirth: "1989-12-13",
      addresses: [
        { street: "155 Franklin St", city: "New York", state: "NY", zip: "10013", isCurrent: true, dateRange: "2014 - Present" },
        { street: "Forest Hills", city: "Nashville", state: "TN", zip: "37215", isCurrent: true, dateRange: "2011 - Present" },
        { street: "Watch Hill", city: "Westerly", state: "RI", zip: "02891", isCurrent: true, dateRange: "2013 - Present" },
        { street: "Beverly Hills", city: "Los Angeles", state: "CA", zip: "90210", isCurrent: true, dateRange: "2015 - Present" }
      ],
      phones: [],
      emails: [
        { address: "taylornation@taylorswift.com", type: "Work", isCurrent: true }
      ],
      properties: [
        { address: "155 Franklin St", city: "New York", state: "NY", zip: "10013", propertyType: "Penthouse / Townhouse", marketValue: 50000000, ownerName: "13 Management LLC" },
        { address: "Watch Hill Estate", city: "Westerly", state: "RI", propertyType: "Single Family", marketValue: 18000000, ownerName: "High Watch LLC" },
        { address: "Samuel Goldwyn Estate", city: "Beverly Hills", state: "CA", propertyType: "Mansion", marketValue: 25000000, ownerName: "Taylor Swift" }
      ],
      vehicles: [
        { year: 2010, make: "Dassault", model: "Falcon 900", state: "TN", type: "Aircraft (N898TS)" },
        { year: 2012, make: "Dassault", model: "Falcon 7X", state: "TN", type: "Aircraft (N621MM)" }
      ],
      criminalRecords: [],
      employment: [
        { company: "Republic Records", title: "Recording Artist", dateRange: "2018 - Present" },
        { company: "Big Machine Records", title: "Recording Artist", dateRange: "2005 - 2018" },
        { company: "13 Management", title: "CEO / Founder", dateRange: "2010 - Present" }
      ],
      socialProfiles: [
        { platform: "Instagram", url: "https://instagram.com/taylorswift", username: "@taylorswift" },
        { platform: "X", url: "https://x.com/taylorswift13", username: "@taylorswift13" },
        { platform: "TikTok", url: "https://tiktok.com/@taylorswift", username: "@taylorswift" }
      ],
      photos: ["/mock/taylorswift1.jpg", "/mock/taylorswift2.jpg"],
      akas: [{ fullName: "Taylor A. Swift" }, { fullName: "Nils Sjöberg" }]
    },
    "lebron-james": {
      enformionId: "lebron-james",
      fullName: "LeBron Raymone James",
      firstName: "LeBron",
      lastName: "James",
      age: 39,
      dateOfBirth: "1984-12-30",
      addresses: [
        { street: "Brentwood", city: "Los Angeles", state: "CA", zip: "90049", isCurrent: true, dateRange: "2015 - Present" },
        { street: "Beverly Hills", city: "Los Angeles", state: "CA", zip: "90210", isCurrent: true, dateRange: "2020 - Present" },
        { street: "Bath Township", city: "Akron", state: "OH", zip: "44333", isCurrent: true, dateRange: "2003 - Present" }
      ],
      phones: [
        { number: "(213) 555-0188", type: "Mobile", isCurrent: true }
      ],
      emails: [
        { address: "lbj@springhillco.com", type: "Work", isCurrent: true }
      ],
      properties: [
        { address: "Brentwood Estate", city: "Los Angeles", state: "CA", propertyType: "Single Family", marketValue: 23000000, ownerName: "LeBron James" },
        { address: "Beverly Hills Compound", city: "Los Angeles", state: "CA", propertyType: "Mansion", marketValue: 36800000, ownerName: "LeBron James" },
        { address: "Akron Estate", city: "Akron", state: "OH", propertyType: "Single Family", marketValue: 9000000, ownerName: "LeBron James" }
      ],
      vehicles: [
        { year: 2021, make: "Porsche", model: "918 Spyder", state: "CA" },
        { year: 2022, make: "Mercedes-Maybach", model: "S650", state: "CA" },
        { year: 2023, make: "Rolls-Royce", model: "Cullinan", state: "CA" }
      ],
      criminalRecords: [],
      employment: [
        { company: "Los Angeles Lakers", title: "Professional Athlete", dateRange: "2018 - Present" },
        { company: "Cleveland Cavaliers", title: "Professional Athlete", dateRange: "2014 - 2018" },
        { company: "Miami Heat", title: "Professional Athlete", dateRange: "2010 - 2014" },
        { company: "SpringHill Company", title: "Co-Founder", dateRange: "2020 - Present" },
        { company: "Fenway Sports Group", title: "Partner / Investor", dateRange: "2021 - Present" }
      ],
      socialProfiles: [
        { platform: "Instagram", url: "https://instagram.com/kingjames", username: "@kingjames" },
        { platform: "X", url: "https://x.com/KingJames", username: "@KingJames" }
      ],
      photos: ["/mock/lebronjames1.jpg", "/mock/lebronjames2.jpg"],
      akas: [{ fullName: "King James" }, { fullName: "LeBron R. James" }]
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
