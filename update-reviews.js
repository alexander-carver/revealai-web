// Script to update reviews to only show 3
const fs = require('fs');
const filePath = '/Users/alexandercarver/Documents/RevealAI/revealai-web/app/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the 5 reviews with only 3
const oldReviews = `              {
                name: "Jessica M.",
                location: "Austin, TX",
                image: "/reviews/review-1.png",
                content: "I was reconnecting with an old college friend and couldn't find them anywhere. RevealAI found their current info in seconds. We're meeting up next week! Totally worth it.",
                rating: 5,
                useCase: "Finding old friends",
              },
              {
                name: "Amanda K.",
                location: "Denver, CO",
                image: "/reviews/review-2.png",
                content: "Used this before a first date from a dating app. Found out the guy had a completely fake profile. Dodged a major bullet. Every single person should use this.",
                rating: 5,
                useCase: "Dating safety",
              },
              {
                name: "Robert T.",
                location: "Seattle, WA",
                image: "/reviews/review-3.png",
                content: "As a landlord, I use RevealAI to vet potential tenants. It's saved me from several bad situations. The background info is thorough and accurate.",
                rating: 5,
                useCase: "Tenant screening",
              },
              {
                name: "David L.",
                location: "Chicago, IL",
                image: "/reviews/review-4.png",
                content: "My neighbor's been acting suspicious. RevealAI helped me find public records I didn't know existed. Now I have peace of mind knowing who lives next door.",
                rating: 5,
                useCase: "Neighbor check",
              },
              {
                name: "Michelle W.",
                location: "Atlanta, GA",
                image: "/reviews/review-5.png",
                content: "I hired a babysitter and wanted to be extra careful. This gave me everything I needed to feel safe leaving my kids. Can't put a price on that peace of mind.",
                rating: 5,
                useCase: "Caregiver verification",
              },`;

const newReviews = `              {
                name: "Jessica M.",
                location: "Austin, TX",
                image: "/reviews/review-1.png",
                content: "I was reconnecting with an old college friend and couldn't find them anywhere. RevealAI found their current info in seconds. We're meeting up next week! Totally worth it.",
                rating: 5,
                useCase: "Finding old friends",
              },
              {
                name: "Amanda K.",
                location: "Denver, CO",
                image: "/reviews/review-2.png",
                content: "Used this before a first date from a dating app. Found out the guy had a completely fake profile. Dodged a major bullet. Every single person should use this.",
                rating: 5,
                useCase: "Dating safety",
              },
              {
                name: "Robert T.",
                location: "Seattle, WA",
                image: "/reviews/review-3.png",
                content: "As a landlord, I use RevealAI to vet potential tenants. It's saved me from several bad situations. The background info is thorough and accurate.",
                rating: 5,
                useCase: "Tenant screening",
              },`;

content = content.replace(oldReviews, newReviews);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Updated reviews to show only 3');
