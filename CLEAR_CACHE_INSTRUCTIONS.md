# Clear Cache to See Latest Updates

## 🔄 Quick Fix: Hard Refresh

### On Desktop:
- **Windows/Linux:** `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac:** `Cmd + Shift + R`
- **Or:** Hold `Shift` and click the refresh button

### On Mobile (iPhone/Android):
- **iPhone Safari:** Hold refresh button → "Reload Without Content Blockers"
- **Android Chrome:** Menu → Settings → Privacy → Clear browsing data → Cached images/files

## 🧹 Full Cache Clear

### Chrome/Edge:
1. Press `F12` to open DevTools
2. Right-click the refresh button
3. Click **"Empty Cache and Hard Reload"**

### Safari:
1. Develop menu → **"Empty Caches"**
2. Or: `Cmd + Option + E`

### Firefox:
1. Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
2. Select "Cached Web Content"
3. Click "Clear Now"

## 🚀 Force Update (Nuclear Option)

1. Open DevTools (`F12`)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **"Clear site data"**
4. Refresh page

## ✅ Verify You're on Latest Version

After clearing cache, you should see:
- ✅ User ID in top-right header (short format: `7bd3c1e0...`)
- ✅ Header hides when scrolling down
- ✅ All 6 nav items in bottom bar (including Unclaimed Money)
- ✅ No "Go to App" button on homepage
- ✅ No "Test Payment" button in settings

## 🌐 Check Which Domain You're On

Make sure you're on: **`https://revealai-peoplesearch.com`**

If you're on a Vercel domain (like `revealai-web.vercel.app`), it will auto-redirect, but the cache might be different.

## 📱 Different Device vs Same Device

Updates should appear on **all devices** once Vercel deploys. If you're not seeing updates:
1. Hard refresh (instructions above)
2. Clear browser cache
3. Try incognito/private mode
4. Try a different browser

**Note:** Vercel deploys automatically when you push to GitHub, so all devices should get updates within 1-2 minutes of deployment.

