# Onboarding Image Generation Prompts

Use these prompts in ChatGPT (DALL·E) or similar AI image generators to create realistic photos for the onboarding screens.

## Image Requirements
- **Format**: PNG
- **Aspect Ratio**: Portrait/vertical orientation (will be cropped to fit)
- **Style**: Realistic, professional, natural lighting
- **Quality**: High resolution (at least 800x1000px recommended)

---

## Screen 1: Sarah Johnson Photos (3 images)

### Image 1: `sarah-1.png`
**Prompt:**
```
A professional portrait photo of a young woman in her mid-20s with long wavy reddish-blonde hair, looking over her left shoulder at the camera. She's wearing a black top with large puffy red sleeves and a voluminous, sparkly red skirt with white polka dots. The background is a beautiful outdoor park setting with lush green trees and foliage, slightly blurred. Natural daylight, professional photography style, realistic, high quality, portrait orientation.
```

### Image 2: `sarah-2.png`
**Prompt:**
```
A close-up portrait photo of a young woman in her mid-20s with reddish-blonde hair and bangs, lying down and looking directly up at the camera with a warm smile. She has freckles and prominent black winged eyeliner. Her right arm is raised, covered by a sheer, red, long-sleeved garment, with her hand partially near her forehead. The background is blurred and dark, suggesting an outdoor setting. Natural lighting, realistic, professional photography, portrait orientation, high quality.
```

### Image 3: `sarah-3.png`
**Prompt:**
```
A portrait photo of a young woman in her mid-20s with long, wavy reddish-blonde hair, looking back over her left shoulder towards the camera with a natural expression. She's wearing a black top with red puffy sleeves and a red skirt with white polka dots. The background shows an outdoor park setting with green foliage, slightly blurred. Natural daylight, realistic, professional photography style, portrait orientation, high quality.
```

**Save location**: `public/onboarding/sarah-1.png`, `sarah-2.png`, `sarah-3.png`

---

## Screen 2: Sean Combs Avatar (1 image)

### Image: `sean-avatar.png`
**Prompt:**
```
A professional circular profile picture of a man in his late 20s with dark brown or black hair, looking directly at the camera with a friendly, approachable expression. He has a warm smile and appears professional yet casual. The background is neutral and blurred. The image should be suitable for a social media profile picture. Realistic, high quality, square format, well-lit, professional headshot style.
```

**Note**: This will be displayed as a circular avatar, so ensure the face is centered and well-framed.

**Save location**: `public/onboarding/sean-avatar.png`

---

## Screen 3: Person Avatar (1 image)

### Image: `person-3-avatar.png`
**Prompt:**
```
A professional portrait photo of a man in his early 30s looking slightly upwards and to the right, wearing a dark green baseball cap and a dark green t-shirt. He has a beard and appears friendly and approachable. The background is a blurred outdoor natural landscape, possibly trees or mountains, with soft lighting. The photo should be suitable for a profile picture. Realistic, natural lighting, professional photography style, portrait orientation, high quality.
```

**Save location**: `public/onboarding/person-3-avatar.png`

---

## Tips for Best Results

1. **Consistency**: For Sarah's photos, try to use the same base prompt and vary only the pose/angle to ensure the person looks consistent across all three images.

2. **Style Variations**: If the first image doesn't match your vision, try adding:
   - "soft natural lighting" or "golden hour lighting"
   - "professional headshot" or "lifestyle photography"
   - "warm tones" or "cool tones"

3. **Refinement**: You can refine by adding:
   - "detailed, sharp focus on face"
   - "bokeh background" for blurred backgrounds
   - "modern, contemporary style"

4. **Size**: Generate at higher resolution (1024x1024 or larger) so you can crop/resize as needed.

---

## After Generating Images

1. Create the folder: `public/onboarding/`
2. Save all images with the exact filenames listed above
3. Update the component to use the actual images (currently using placeholders)

The component will automatically use these images once they're in place!

