# Old Onboarding Components - Archived

## Date Archived
December 2024

## Components Archived
1. **WelcomeModal** (`welcome-modal.tsx`)
   - Shown to new users on first visit
   - Displays benefits and features
   - Includes warning about removing personal info
   - Uses localStorage key: `revealai_welcome_seen`

2. **AppleDeviceModal** (`apple-device-modal.tsx`)
   - Shown to users on Apple devices (iOS/macOS)
   - Prompts users to download the mobile app
   - Uses localStorage key: `revealai_apple_modal_dismissed`

## Previous Usage
Both modals were previously imported and used in:
- `app/page.tsx` (main landing page)

## Notes
- These components have been removed from active use
- localStorage keys may still exist in user browsers but won't affect new onboarding

---

## NEW ONBOARDING SYSTEM (December 2024)

A new comprehensive onboarding flow has been implemented in:
- `components/shared/onboarding-flow.tsx`

### New Features:
1. **3 Animated Onboarding Screens**
   - Screen 1: "Unlock the Full Picture of Anyone Online" - Photo gallery animation with social sources
   - Screen 2: "Explore New Connections" - Chat bubble and profile reveal animation
   - Screen 3: "Dive Deeper into People" - Keyhole/orbit animation showing data categories

2. **Simple Search Screen** after onboarding screens

3. **Loading Animation** with orbiting avatars

4. **Redesigned Paywall** matching mobile app design
   - Blue theme with video header
   - Yearly ($49.99/year) and Weekly ($6.99/week) plans
   - Clean, professional layout

### localStorage Keys Used:
- `revealai_onboarding_completed` - Tracks if user has completed onboarding

### Images Needed (placeholders currently in place):
- `emma-1.jpg`, `emma-2.jpg`, `emma-3.jpg` - Photos for Screen 1
- `olivia-avatar.jpg` - Avatar for Screen 2
- `person-3-avatar.jpg` - Avatar for Screen 3

