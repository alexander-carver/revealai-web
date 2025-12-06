# SEO Setup Guide for RevealAI

## ✅ What's Been Done

1. **Comprehensive Metadata** - Added full SEO metadata to `app/layout.tsx`:
   - Title templates
   - Rich descriptions
   - Keywords including "reveal ai" and "revealai"
   - Open Graph tags for social sharing
   - Twitter Card metadata
   - Robots directives

2. **Structured Data (JSON-LD)** - Added to homepage:
   - SoftwareApplication schema
   - WebSite schema with search action
   - Organization schema

3. **Sitemap** - Created `app/sitemap.ts` with all main pages

4. **Robots.txt** - Created `app/robots.ts` to guide search engine crawlers

5. **Page-Specific Metadata** - Added metadata layouts for:
   - `/search` - People Search
   - `/records` - Records Search
   - `/username` - Username Search
   - `/vehicle` - Vehicle Lookup
   - `/privacy` - Privacy & Data Removal
   - `/unclaimed` - Unclaimed Money

## 🔧 What You Need to Do

### 1. Get Your Domain
- Register `revealai.com` (or your preferred domain)
- Recommended registrars: Namecheap, Google Domains, Cloudflare

### 2. Update Domain URLs
Once you have your domain, update these files:

**Files to update:**
- `app/layout.tsx` - Replace `https://revealai.com` with your actual domain (3 places)
- `app/sitemap.ts` - Replace `https://revealai.com` with your actual domain
- `app/robots.ts` - Replace `https://revealai.com` with your actual domain
- `app/page.tsx` - Replace `https://revealai.com` in structured data (3 places)

**Quick find/replace:**
```bash
# Replace all instances of "https://revealai.com" with your actual domain
# Example: "https://www.revealai.com" or "https://revealai.io"
```

### 3. Connect Domain to Vercel
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain (e.g., `revealai.com` and `www.revealai.com`)
3. Follow DNS instructions:
   - Add A record pointing to Vercel's IP
   - Or add CNAME record pointing to `cname.vercel-dns.com`
4. Vercel will automatically provision SSL certificate

### 4. Set Up Google Search Console
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your property (your domain)
3. Verify ownership (DNS record or HTML file)
4. Submit your sitemap: `https://yourdomain.com/sitemap.xml`
5. Request indexing for your homepage

### 5. Set Up Bing Webmaster Tools
1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Add your site
3. Verify ownership
4. Submit sitemap

### 6. Add Social Media Links (Optional)
Update `app/layout.tsx` and `app/page.tsx` with your actual social media URLs:
- Twitter handle: `@revealai` (update if different)
- Facebook page URL
- LinkedIn company page URL
- Instagram URL

### 7. Create a Favicon
Add a favicon at `app/favicon.ico` or use Next.js's built-in favicon support.

### 8. Monitor & Optimize
- Check Google Search Console weekly for:
  - Search performance
  - Indexing issues
  - Mobile usability
- Monitor Core Web Vitals
- Track keyword rankings for "reveal ai" and "revealai"

## 🎯 SEO Best Practices Going Forward

1. **Content Updates**: Regularly update your homepage content
2. **Blog Posts**: Consider adding a blog with SEO-optimized articles about:
   - "How to do a background check"
   - "How to find someone online"
   - "What is a people search"
   - etc.

3. **Backlinks**: Get backlinks from:
   - App Store listing
   - Product directories
   - Press releases
   - Guest posts

4. **Local SEO** (if applicable):
   - Add location-based keywords
   - Create location pages if you serve specific areas

## 📊 Expected Timeline

- **Week 1-2**: Domain setup, Google Search Console verification
- **Week 2-4**: Initial indexing, first impressions
- **Month 2-3**: Start seeing rankings improve
- **Month 3-6**: Significant improvement for branded searches ("reveal ai")
- **Month 6+**: Compete for broader keywords

## 🔍 Keywords to Target

Primary:
- "reveal ai"
- "revealai"
- "reveal ai people search"
- "revealai people search"

Secondary:
- "people search"
- "background check"
- "public records search"
- "find people online"
- "reverse phone lookup"

## 📝 Next Steps Checklist

- [ ] Register domain
- [ ] Update all domain URLs in code
- [ ] Connect domain to Vercel
- [ ] Set up Google Search Console
- [ ] Set up Bing Webmaster Tools
- [ ] Submit sitemap
- [ ] Add social media links
- [ ] Create/update favicon
- [ ] Test site on mobile devices
- [ ] Check page speed (use PageSpeed Insights)
- [ ] Set up analytics (Google Analytics, Vercel Analytics)

