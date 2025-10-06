# Design Document

## Overview

This design outlines the implementation approach for updating all branding assets in the web application from placeholder icons to the official "Lokey & Co Homestead" branding. The solution involves organizing the provided logo variations, generating required favicon sizes, updating component references, and ensuring proper asset optimization for web performance.

## Architecture

### Asset Organization Structure

```
public/
├── favicon.ico                    # Main favicon (32x32)
├── favicon-16x16.png             # Small favicon
├── favicon-32x32.png             # Standard favicon
├── icon-192.png                  # PWA icon (small)
├── icon-512.png                  # PWA icon (large)
├── apple-touch-icon.png          # iOS home screen icon (180x180)
├── og-image.png                  # Open Graph image (1200x630)
├── twitter-image.png             # Twitter card image (1200x600)
└── branding/
    ├── logo-light.png            # Light version (for dark backgrounds)
    ├── logo-dark.png             # Dark version (for light backgrounds)
    ├── logo-shield-light.png     # Shield only - light
    ├── logo-shield-dark.png      # Shield only - dark
    └── logo-full.png             # Full logo with text
```

### Component Updates

The following components will be updated to use the new branding:

1. **Navigation.tsx** - Replace Command icon with logo shield
2. **index.html** - Update favicon and meta tag references
3. **manifest.json** - Update PWA icon references
4. **Footer.tsx** (if exists) - Update any logo references

## Components and Interfaces

### 1. Image Asset Preparation

**Input:** Raw logo images from user
**Output:** Optimized, properly sized web assets

**Process:**
- Extract the shield logo from the full logo for use as favicon/icon
- Create multiple sizes: 16x16, 32x32, 192x192, 512x512 for favicons/PWA
- Create 180x180 for Apple touch icon
- Create 1200x630 for Open Graph
- Create 1200x600 for Twitter cards
- Optimize all images for web (compress without quality loss)
- Ensure transparent backgrounds where appropriate

### 2. Navigation Component Update

**Current Implementation:**
```tsx
<Command className="w-5 h-5 text-primary" />
<span className="font-bold text-base">Lokey & C0.</span>
```

**New Implementation:**
```tsx
<img 
  src="/branding/logo-shield-light.png" 
  alt="Lokey & Co" 
  className="w-5 h-5"
/>
<span className="font-bold text-base">Lokey & C0.</span>
```

**Considerations:**
- Use shield-only version for compact navigation
- Ensure proper sizing in both expanded and scrolled states
- Maintain aspect ratio
- Add proper alt text for accessibility
- Consider using the full logo on larger screens if space permits

### 3. HTML Head Updates

**Favicon Links:**
```html
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
```

**Open Graph Updates:**
```html
<meta property="og:image" content="/og-image.png" />
<meta name="twitter:image" content="/twitter-image.png" />
```

### 4. PWA Manifest Updates

**Icon Configuration:**
```json
{
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

## Data Models

### Asset Metadata

```typescript
interface BrandAsset {
  path: string;           // File path in public directory
  size: string;           // Dimensions (e.g., "192x192")
  format: string;         // File format (png, ico, svg)
  purpose: string;        // Usage context (favicon, pwa, og, navigation)
  variant: 'light' | 'dark' | 'neutral';  // Color variant
}
```

## Error Handling

### Missing Assets
- **Issue:** Required asset size not available
- **Solution:** Generate from highest quality source image
- **Fallback:** Use closest available size with browser scaling

### Format Compatibility
- **Issue:** Browser doesn't support PNG favicons
- **Solution:** Provide .ico fallback
- **Implementation:** Include both formats in HTML head

### Loading Failures
- **Issue:** Image fails to load
- **Solution:** Provide alt text and consider SVG fallback for logos
- **Implementation:** Use proper error handling in img tags

### Performance Issues
- **Issue:** Large image files slow down page load
- **Solution:** Optimize all images, use appropriate formats
- **Implementation:** Compress PNGs, use WebP where supported

## Testing Strategy

### Visual Testing
1. **Browser Tab Icon**
   - Verify favicon appears in Chrome, Firefox, Safari, Edge
   - Check multiple tab scenario
   - Verify on different OS (Windows, macOS, Linux)

2. **Navigation Logo**
   - Verify logo displays correctly in header
   - Test scrolled state (condensed navigation)
   - Test responsive breakpoints (mobile, tablet, desktop)
   - Verify dark/light theme compatibility

3. **PWA Installation**
   - Install app on Android device
   - Install app on iOS device
   - Verify home screen icon
   - Check splash screen branding

4. **Social Media Sharing**
   - Share link on Facebook - verify OG image
   - Share link on Twitter - verify Twitter card
   - Share link on LinkedIn - verify preview
   - Test on mobile and desktop

### Technical Testing
1. **Asset Loading**
   - Verify all assets load without 404 errors
   - Check network tab for proper caching
   - Verify file sizes are optimized
   - Test on slow 3G connection

2. **Accessibility**
   - Verify alt text is present and descriptive
   - Check color contrast ratios
   - Test with screen readers

3. **Performance**
   - Measure page load time impact
   - Verify Lighthouse score doesn't degrade
   - Check Core Web Vitals (LCP, CLS)

### Cross-Browser Testing
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

## Implementation Notes

### Image Optimization Tools
- Use ImageOptim, TinyPNG, or similar for compression
- Consider WebP format for modern browsers with PNG fallback
- Maintain transparency where needed
- Ensure proper color profiles

### Responsive Considerations
- Use appropriate sizes for different screen densities (@1x, @2x, @3x)
- Consider using srcset for responsive images if needed
- Ensure logos scale properly on high-DPI displays

### Caching Strategy
- Set appropriate cache headers for static assets
- Consider cache busting if updating existing assets
- Update service worker cache if PWA is implemented

### Accessibility
- Provide meaningful alt text for all logo images
- Ensure sufficient color contrast
- Don't rely solely on logos for navigation (keep text labels)

### Brand Consistency
- Use the same logo variant consistently across similar contexts
- Maintain proper spacing and sizing ratios
- Follow brand guidelines for minimum sizes and clear space
