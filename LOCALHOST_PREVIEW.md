# Localhost Preview – When You Get Error -102 (Connection Refused)

**If Cursor’s Simple Browser shows `Error Code: -102` or `ERR_CONNECTION_REFUSED` at http://localhost:3000**, use this.

## Why it happens

- Cursor’s built-in Simple Browser often **cannot reach `localhost`** (sandbox/network).
- The dev server might not be running, or it crashed.
- Something else might be using port 3000.

## What to do every time

### 1. Start the dev server in a real terminal

In a **normal terminal** (not Cursor’s background run):

```bash
cd /path/to/revealai-web
npm run dev
```

Wait until you see something like:

```text
▲ Next.js 16.x.x
- Local:        http://localhost:3000
✓ Ready in 3.2s
```

### 2. Open in an external browser (not Cursor’s Simple Browser)

- **Chrome / Safari / Edge:** open **http://localhost:3000** in the address bar.

Cursor’s Simple Browser often fails with -102 even when the server is running. **Use Chrome or Safari for preview.**

### 3. Optional: use the preview script

From the project root:

```bash
./scripts/dev-preview.sh
```

This frees port 3000 if needed, then starts `npm run dev`. Then open **http://localhost:3000** in Chrome/Safari.

## If port 3000 is in use

```bash
# See what’s on 3000 (macOS/Linux)
lsof -i :3000

# Kill the process (replace PID with the number from lsof)
kill -9 <PID>
```

Then run `npm run dev` again.

## Quick checklist

1. [ ] Run `npm run dev` in a normal terminal and wait for “Ready”.
2. [ ] Open **http://localhost:3000** in **Chrome or Safari** (not Cursor Simple Browser).
3. [ ] If -102 persists, run `./scripts/dev-preview.sh` and try again in an external browser.
