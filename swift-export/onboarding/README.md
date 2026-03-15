# Onboarding Flow

Isolated onboarding flow components extracted from the RevealAI web app.

## Overview

This folder contains a complete, self-contained onboarding experience with 3 screens:

1. **Screen1** - "Unlock the Full Picture": Shows Sarah Johnson demo with animated photo reveal and social sources (Instagram, LinkedIn, Bumble, Tinder)
2. **Screen2** - "Explore New Connections": Shows Sean Combs profile demo with bio and social icons
3. **Screen3** - "Dive Deeper into People": Orbit animation demo transitioning from keyhole view to orbiting information items

Additional utility screens:
- **SearchScreen** - Simple name input screen
- **LoadingScreen** - Search progress with orbit animation

## File Structure

```
onboarding/
├── components/
│   ├── Screen1.tsx          # "Unlock the Full Picture" - Sarah Johnson
│   ├── Screen2.tsx          # "Explore New Connections" - Sean Combs
│   ├── Screen3.tsx          # "Dive Deeper into People" - Orbit animation
│   ├── SearchScreen.tsx     # Name input screen
│   └── LoadingScreen.tsx    # Progress with orbit animation
├── OnboardingFlow.tsx       # Main wrapper component
├── index.ts                 # Barrel exports
├── styles.css               # Orbit animations and custom styles
├── ASSETS.md                # Required image assets documentation
└── README.md                # This file
```

## React Usage

### Basic Usage

```tsx
import { OnboardingFlow } from "./onboarding";

function App() {
  const handleComplete = () => {
    // Navigate to main app or show paywall
    console.log("Onboarding complete!");
  };

  return <OnboardingFlow onComplete={handleComplete} />;
}
```

### Import Styles

Add this import to your global CSS or layout file:

```tsx
import "./onboarding/styles.css";
```

### Use Individual Screens

```tsx
import { Screen1, Screen2, Screen3 } from "./onboarding";

// Use screens independently
<Screen1 onContinue={() => setStep(2)} />
<Screen2 onContinue={() => setStep(3)} />
<Screen3 onComplete={() => finishOnboarding()} />
```

## Swift Conversion Guide

These components are designed to be easily convertible to SwiftUI.

### Key Conversion Notes

1. **Animations**:
   - Screen1: Use `withAnimation(.easeOut(duration: 0.5))` for staggered reveals
   - Screen2: Use `opacity` + `offset` with sequential `DispatchQueue.main.asyncAfter`
   - Screen3: Keyhole → Orbit transition with `matchedGeometryEffect` or simple opacity fade
   - LoadingScreen: `Timer` for progress + `rotationEffect` for orbit ring

2. **Orbit Animation (SwiftUI)**:
   ```swift
   // For orbit items positioned around a center
   ForEach(0..<8) { index in
       let angle = Double(index) * 45.0 * .pi / 180
       OrbitItem()
           .offset(
               x: cos(angle) * 100,
               y: sin(angle) * 100
           )
   }
   .rotationEffect(.degrees(orbitRotation))
   .animation(.linear(duration: 20).repeatForever(autoreverses: false), value: orbitRotation)
   ```

3. **Images**: See `ASSETS.md` for required image assets

4. **Colors**:
   - Background gray: `Color(hex: "#F5F5F5")`
   - LinkedIn: `Color(hex: "#0077B5")`
   - Bumble: `Color(hex: "#FFC629")`
   - Tinder gradient: `LinearGradient(colors: [#FD297B, #FF5864])`
   - Spotify: `Color(hex: "#1DB954")`
   - Button border: `Color.blue`

5. **SF Symbols Replacements**:
   - ArrowRight → `arrow.right`
   - Instagram → Custom gradient icon or `photo.artframe`
   - LinkedIn → Custom icon or `briefcase.fill`
   - X (Twitter) → `xmark` or custom
   - Facebook → Custom icon
   - Search → `magnifyingglass`

### SwiftUI Screen Structure

Each screen follows this pattern:

```swift
struct Screen1: View {
    let onContinue: () -> Void
    @State private var animationPhase = 0

    var body: some View {
        VStack(spacing: 0) {
            // Card area (flex-1)
            ScrollView {
                // Demo content
            }

            // Text & button area
            VStack(spacing: 16) {
                Text("Title")
                    .font(.title2.bold())

                Text("Description")
                    .font(.body)
                    .foregroundColor(.gray)

                // Pagination dots
                HStack(spacing: 8) {
                    Circle().fill(Color.gray800) // Active
                    Circle().fill(Color.gray300)
                    Circle().fill(Color.gray300)
                }

                Button(action: onContinue) {
                    HStack {
                        Text("Next")
                        Image(systemName: "arrow.right")
                    }
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.gray900)
                    .cornerRadius(16)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.blue, lineWidth: 2)
                    )
                }
            }
            .padding()
        }
    }
}
```

## Dependencies

### React Dependencies
- `lucide-react` - Icons
- `next/image` - Image component
- Tailwind CSS - Styling classes

### Swift Dependencies
- None (pure SwiftUI)

## Customization

### Changing Demo Names

Edit the component files directly:

- **Screen1**: Change "Sarah Johnson" text
- **Screen2**: Change "Sean Combs" text and bio

### Changing Colors

All brand colors are inline. For Swift conversion, extract them to a `Colors.swift` file:

```swift
extension Color {
    static let linkedIn = Color(hex: "#0077B5")
    static let bumble = Color(hex: "#FFC629")
    // etc.
}
```

### Animation Timing

Each screen has animation timing defined at the top of the component:

```typescript
// Screen1: phases 0-8 with 300ms delays
// Screen2: CSS animation delays (0.2s, 0.6s, 1s)
// Screen3: phases 0-5 with 600ms delays
// LoadingScreen: 60ms progress interval, step changes at 800ms intervals
```

## License

Internal use only - RevealAI
