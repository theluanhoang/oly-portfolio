# Kế Hoạch SEO - OLY Portfolio

## 1. Metadata & Open Graph

### 1.1 Core Metadata
- [x] Title tags động cho từng trang (Home, Projects, Products, About, Contact, Project Detail, Product Detail)
- [x] Meta descriptions tối ưu (150-160 ký tự)
- [x] Meta keywords (tùy chọn, không bắt buộc)
- [x] Canonical URLs cho tất cả trang
- [x] Language alternates (hreflang) cho en/vi

### 1.2 Open Graph Tags
- [x] og:title
- [x] og:description
- [x] og:image (1200x630px)
- [x] og:url
- [x] og:type
- [x] og:locale và og:locale:alternate
- [x] og:site_name

### 1.3 Twitter Cards
- [ ] twitter:card (summary_large_image) - **Đã loại bỏ (không sử dụng social media)**
- [ ] twitter:title - **Đã loại bỏ**
- [ ] twitter:description - **Đã loại bỏ**
- [ ] twitter:image - **Đã loại bỏ**
- [ ] twitter:site - **Đã loại bỏ**

### 1.4 Additional Meta Tags
- [x] viewport meta tag (đã có)
- [x] charset (đã có)
- [x] theme-color
- [x] author (có trong code, render khi có author trong config)
- [x] robots meta (noindex/nofollow nếu cần)

## 2. Structured Data (JSON-LD)

### 2.1 Organization Schema
- [x] Organization schema với logo, contact info, social profiles
- [ ] LocalBusiness schema (nếu phù hợp) - **Không cần thiết (không phải local business)**

### 2.2 Website Schema
- [x] WebSite schema với searchAction
- [x] BreadcrumbList schema cho tất cả trang có breadcrumb

### 2.3 Content Schemas
- [x] Article schema cho project/product detail pages
- [ ] ImageObject schema cho gallery images - **Có thể thêm sau nếu cần (không bắt buộc)**
- [x] CollectionPage schema cho projects/products listing

### 2.4 Creative Work Schemas
- [x] CreativeWork schema cho projects
- [x] Product schema cho products (nếu phù hợp)

## 3. Technical SEO

### 3.1 Robots.txt
- [x] Tạo /app/robots.ts hoặc /public/robots.txt
- [x] Allow/disallow rules
- [x] Sitemap reference

### 3.2 Sitemap
- [x] Dynamic sitemap.xml generation
- [x] Include all locales (en/vi)
- [x] Include all projects và products
- [x] Priority và changefreq settings
- [x] lastmod dates

### 3.3 XML Sitemap Index
- [ ] Sitemap index nếu có nhiều sitemap files - **Không cần (số lượng URLs < 50,000)**

### 3.4 URL Structure
- [x] Clean URLs (đã có với slug)
- [x] Consistent trailing slashes (Next.js tự xử lý)
- [x] URL length optimization (URLs đã ngắn gọn với slug)

## 4. International SEO (i18n)

### 4.1 Hreflang Implementation
- [x] Hreflang tags trong <head> (đã có qua Next.js Metadata API)
- [x] Hreflang trong sitemap (đã thêm vào sitemap.xml route handler)
- [x] X-default locale (đã implement trong getAlternates và sitemap)

### 4.2 Language Detection
- [x] Proper lang attribute (đã có trong layout.tsx)
- [x] Content-Language header (đã thêm vào middleware)

## 5. Image SEO

### 5.1 Image Optimization
- [x] Alt text cho tất cả images
- [x] Descriptive filenames (helper functions đã có)
- [x] Image dimensions trong metadata
- [x] Lazy loading (đã có với OptimizedImage component)

### 5.2 Image Structured Data
- [x] ImageObject schema (đã tích hợp vào project/product pages)
- [ ] Image sitemap (không cần thiết - images đã có trong sitemap chính)

## 6. Performance & Core Web Vitals

### 6.1 Page Speed
- [x] Image optimization (đã có với sharp)
- [x] Font optimization (đã có với localFont, display: swap)
- [x] Code splitting (dynamic imports cho TiptapEditor, MoreProjects, GoogleMap)
- [x] Lazy loading components (client-only components, non-critical components)

### 6.2 Core Web Vitals
- [x] LCP optimization (preload hero images, minimize render-blocking)
- [x] FID/INP optimization (defer non-critical JS, optimize event handlers)
- [x] CLS optimization (image dimensions, aspect ratios, reserved space)

## 7. Content SEO

### 7.1 Semantic HTML
- [x] Proper heading hierarchy (h1-h6)
- [x] Semantic HTML5 elements
- [x] ARIA labels nếu cần

### 7.2 Content Optimization
- [x] Unique content cho mỗi trang
- [x] Keyword optimization (natural)
- [x] Internal linking structure
- [x] External links (nếu có)

## 8. Mobile SEO

### 8.1 Mobile Optimization
- [ ] Responsive design (đã có)
- [ ] Mobile-friendly test
- [ ] Touch-friendly elements

## 9. Security & Trust Signals

### 9.1 Security Headers
- [ ] HTTPS (production)
- [ ] Security headers (đã có một phần)

## 10. Analytics & Monitoring

### 10.1 Tracking
- [ ] Google Analytics 4 setup
- [ ] Google Search Console verification
- [ ] Bing Webmaster Tools (tùy chọn)

### 10.2 Monitoring
- [ ] SEO monitoring tools
- [ ] Error tracking (404s, etc.)
- [ ] Performance monitoring

## 11. Social Media Integration

### 11.1 Social Sharing
- [ ] Open Graph tags (xem 1.2)
- [ ] Twitter Cards (xem 1.3)
- [ ] Social sharing buttons (tùy chọn)

## 12. Schema Markup by Page Type

### 12.1 Home Page
- [ ] Organization schema
- [ ] WebSite schema
- [ ] BreadcrumbList

### 12.2 Projects Listing
- [ ] CollectionPage schema
- [ ] BreadcrumbList

### 12.3 Project Detail
- [ ] Article/CreativeWork schema
- [ ] ImageObject cho gallery
- [ ] BreadcrumbList
- [ ] Organization reference

### 12.4 Products Listing
- [ ] CollectionPage schema
- [ ] BreadcrumbList

### 12.5 Product Detail
- [ ] Product/Article schema
- [ ] ImageObject
- [ ] BreadcrumbList

### 12.6 About Page
- [ ] AboutPage schema
- [ ] Organization schema
- [ ] BreadcrumbList

### 12.7 Contact Page
- [ ] ContactPage schema
- [ ] LocalBusiness schema (nếu phù hợp)
- [ ] BreadcrumbList

## 13. Implementation Files Structure

```
lib/seo/
  ├── metadata.ts          # Core metadata utilities
  ├── structured-data.ts   # JSON-LD schemas
  ├── constants.ts         # SEO constants (site name, etc.)
  └── types.ts            # TypeScript types

app/
  ├── robots.ts           # Robots.txt generator
  ├── sitemap.ts          # Sitemap generator
  └── [locale]/
      ├── layout.tsx      # Update với full metadata
      ├── page.tsx        # Home metadata
      ├── projects/
      │   ├── page.tsx    # Projects listing metadata
      │   └── [slug]/
      │       └── page.tsx # Project detail metadata
      ├── products/
      │   ├── page.tsx    # Products listing metadata
      │   └── [slug]/
      │       └── page.tsx # Product detail metadata
      ├── about/
      │   └── page.tsx    # About metadata
      └── contact/
          └── page.tsx    # Contact metadata
```

## 14. Environment Variables Needed

- [ ] NEXT_PUBLIC_SITE_URL (base URL)
- [ ] NEXT_PUBLIC_SITE_NAME
- [ ] NEXT_PUBLIC_DEFAULT_OG_IMAGE
- [ ] NEXT_PUBLIC_TWITTER_HANDLE (nếu có)
- [ ] NEXT_PUBLIC_FACEBOOK_APP_ID (nếu có)

## 15. Testing & Validation

### 15.1 Validation Tools
- [ ] Google Rich Results Test
- [ ] Schema.org Validator
- [ ] Facebook Sharing Debugger
- [ ] Twitter Card Validator
- [ ] Google Search Console
- [ ] Lighthouse SEO audit

### 15.2 Manual Checks
- [ ] All pages có unique title/description
- [ ] All images có alt text
- [ ] Hreflang tags correct
- [ ] Canonical URLs correct
- [ ] Sitemap accessible và valid
- [ ] Robots.txt accessible

## 16. Priority Implementation Order

1. **Phase 1: Core Metadata**
   - Metadata utilities
   - Title & descriptions cho tất cả pages
   - Canonical URLs
   - Basic Open Graph

2. **Phase 2: Technical SEO**
   - Robots.txt
   - Sitemap
   - Hreflang tags

3. **Phase 3: Structured Data**
   - Organization schema
   - WebSite schema
   - BreadcrumbList
   - Page-specific schemas

4. **Phase 4: Advanced**
   - Twitter Cards
   - Image optimization
   - Analytics setup
   - Performance optimization

5. **Phase 5: Monitoring**
   - Search Console setup
   - Analytics verification
   - Ongoing monitoring
