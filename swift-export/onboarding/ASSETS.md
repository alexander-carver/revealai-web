# Onboarding Flow - Required Assets

This document lists all image assets required by the onboarding flow components.

## Screen 1: "Unlock the Full Picture" (Sarah Johnson Demo)

| Asset | Dimensions | Description | Location |
|-------|------------|-------------|----------|
| `/sarah-1.png` | ~96x112 | Sarah Johnson photo #1 | Public root |
| `/sarah-2.png` | ~112x128 | Sarah Johnson photo #2 | Public root |
| `/sarah-3.png` | ~80x112 | Sarah Johnson photo #3 | Public root |

**Note:** These images appear in a row of 3 photos that animate in sequentially.

## Screen 2: "Explore New Connections" (Sean Combs Demo)

| Asset | Dimensions | Description | Location |
|-------|------------|-------------|----------|
| `/sean-avatar.png` | 32x32 (display) | Sean Combs circular avatar | Public root |

**Note:** This is a small circular avatar displayed next to a name badge.

## Screen 3: "Dive Deeper into People" (Orbit Animation)

| Asset | Dimensions | Description | Location |
|-------|------------|-------------|----------|
| `/person-3-avatar.png` | 56x56 min | Center avatar in keyhole/orbit view | Public root |

**Note:** This avatar appears in two contexts:
1. Inside the keyhole shape (during phases 0-2)
2. Center of the orbit animation (during phases 3-5)

## Loading Screen (Orbit Animation)

| Asset | Dimensions | Description | Location |
|-------|------------|-------------|----------|
| `/avatars/orbit-1.png` | 40x40 | Orbiting avatar #1 | `/avatars/` folder |
| `/avatars/orbit-2.png` | 40x40 | Orbiting avatar #2 | `/avatars/` folder |
| `/avatars/orbit-3.png` | 40x40 | Orbiting avatar #3 | `/avatars/` folder |
| `/avatars/orbit-4.png` | 40x40 | Orbiting avatar #4 | `/avatars/` folder |
| `/avatars/orbit-5.png` | 40x40 | Orbiting avatar #5 | `/avatars/` folder |
| `/avatars/orbit-6.png` | 40x40 | Orbiting avatar #6 | `/avatars/` folder |

**Note:** These 6 avatars orbit around a central search icon during the loading animation.

---

## Swift Asset Catalog Structure

When converting to iOS/Swift, organize your assets in Xcode like this:

```
Assets.xcassets/
├── sarah-1.imageset/
│   ├── sarah-1.png
│   └── Contents.json
├── sarah-2.imageset/
│   ├── sarah-2.png
│   └── Contents.json
├── sarah-3.imageset/
│   ├── sarah-3.png
│   └── Contents.json
├── sean-avatar.imageset/
│   ├── sean-avatar.png
│   └── Contents.json
├── person-3-avatar.imageset/
│   ├── person-3-avatar.png
│   └── Contents.json
└── OrbitAvatars/
    ├── orbit-1.imageset/
    │   ├── orbit-1.png
    │   └── Contents.json
    ├── orbit-2.imageset/
    │   ├── orbit-2.png
    │   └── Contents.json
    ... (continue for all 6)
```

## Asset Tips for Swift Conversion

1. **Use PDF/SVG where possible** - For the social media icons (Instagram, LinkedIn, Facebook), consider using SF Symbols or custom SVGs instead of raster images

2. **@2x and @3x scales** - Provide 2x and 3x versions of all avatar images for Retina displays

3. **Color assets** - The brand colors used are:
   - Instagram gradient: Purple → Pink → Orange
   - LinkedIn: `#0077B5`
   - Bumble: `#FFC629`
   - Tinder gradient: `#FD297B` → `#FF5864`
   - Spotify: `#1DB954`
   - Facebook: `#1877F2`
   - Primary button border: `#3B82F6` (blue-500)
   - Background gray: `#F5F5F5`

4. **Emoji fallbacks** - The orbit items use emoji icons (📖, 👥, 💼, 📷, 🎵, ❤️). In Swift you can use the actual emoji characters or replace with SF Symbols:
   - 📖 → `book.fill`
   - 👥 → `person.2.fill`
   - 💼 → `briefcase.fill`
   - 📷 → `camera.fill`
   - 🎵 → `music.note`
   - ❤️ → `heart.fill`
   - 🐝 → Custom Bumble icon
   - 🔥 → `flame.fill`
