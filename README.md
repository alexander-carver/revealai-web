# RevealAI Web

A modern web application for people search, background checks, and privacy tools. Built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **People Search** - Search by name, phone, email, or address using Enformion data
- **AI-Powered Research** - Natural language queries for deep profile research
- **Records Search** - Court records, criminal history, and public filings
- **Username Search** - Find social profiles across 100+ platforms
- **Vehicle Lookup** - VIN decoder using NHTSA database
- **Privacy Tools** - Exposure score, data broker removal guides, opt-out management
- **Unclaimed Money** - State-by-state official search routing

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom shadcn/ui-inspired components
- **State Management**: React Query (TanStack Query)
- **Backend**: Supabase (Auth, Edge Functions, Database)
- **Payments**: Stripe / Superwall (placeholder ready)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project (existing backend)

### Installation

1. Navigate to the web app directory:
   ```bash
   cd revealai-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

4. Update `.env.local` with your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
revealai-web/
├── app/                    # Next.js App Router pages
│   ├── (app)/              # Main application routes (with nav)
│   │   ├── search/         # People Search
│   │   ├── records/        # Court Records
│   │   ├── username/       # Username Search
│   │   ├── vehicle/        # VIN Decoder
│   │   ├── privacy/        # Privacy Tools
│   │   ├── unclaimed/      # Unclaimed Money
│   │   └── settings/       # Account Settings
│   ├── login/              # Authentication
│   └── layout.tsx          # Root layout
├── components/
│   ├── ui/                 # Base UI components (Button, Input, Card, etc.)
│   ├── shared/             # Shared components (Navigation, Paywall, etc.)
│   └── features/           # Feature-specific components
├── lib/
│   ├── supabase/           # Supabase client configuration
│   ├── services/           # API service functions
│   ├── types/              # TypeScript interfaces
│   └── utils.ts            # Utility functions
└── hooks/                  # React hooks (useAuth, useSubscription)
```

## API Integration

The web app connects to existing Supabase Edge Functions:

| Function | Purpose |
|----------|---------|
| `enformion-search` | People search, reverse phone/email/address |
| `ai-profile-search` | AI-powered profile research |
| `enformion-records` | Court records search |
| `username-search` | Social platform username lookup |
| `remove-from-search` | Privacy opt-out management |

## Subscription Tiers

- **Free**: Limited searches, basic features
- **Pro Weekly**: $9.99/week - Unlimited access
- **Pro Yearly**: $49.99/year - Unlimited access (best value)

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

### Manual

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public key |
| `STRIPE_SECRET_KEY` | Stripe secret key (server-side) |

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Private - All rights reserved

