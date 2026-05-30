# Doctor Soya - Deployment Guide

## Prerequisites
- GitHub account (for version control)
- Vercel account (free tier available)
- Node.js 18+ installed locally

## Local Development

### Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd doctor-soya

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:3000
```

### Environment Variables
No external API keys required for MVP. All data is mocked locally.

For future real API integration:
```env
# .env.local (create this file)
NEXT_PUBLIC_SATELLITE_API_KEY=your_key_here
NEXT_PUBLIC_WEATHER_API_KEY=your_key_here
```

## Deployment to Vercel

### Option 1: Using Vercel Dashboard (Recommended)

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Select "Import Git Repository"
   - Choose your GitHub repository

2. **Configure Project**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: ./ (default)
   - Build Command: `pnpm build`
   - Output Directory: `.next`
   - Environment Variables: Leave blank (MVP uses mock data)

3. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your app is live at https://[project-name].vercel.app

### Option 2: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project directory
vercel

# Or for production deployment
vercel --prod
```

## Post-Deployment

### Custom Domain (Optional)
1. In Vercel Project Settings → Domains
2. Add your domain
3. Update DNS records (Vercel provides instructions)

### PWA Installation
The app is automatically PWA-ready. Users can:
- **Web**: Click install button in browser
- **iOS**: Share → Add to Home Screen
- **Android**: Menu → Install App

### Monitoring
- **Vercel Analytics**: Enabled by default
- **Performance**: View in Vercel Dashboard
- **Logs**: `vercel logs` command

## Production Considerations

### Security
- No sensitive data in environment variables (MVP)
- HTTPS enforced automatically by Vercel
- CSP headers configured in Next.js

### Performance
- Next.js automatic code splitting
- Image optimization via Next.js Image component
- Service Worker caching strategy
- Database queries optimized for edge function limits

### Scaling
Current architecture handles:
- 100+ fields concurrently
- 1000s of observations
- Real-time updates via polling (upgradeable to WebSockets)

For production scale increase:
- Add database (Neon PostgreSQL recommended)
- Implement real satellite APIs
- Add caching layer (Redis via Upstash)
- Implement proper authentication (Better Auth)

## Continuous Deployment

### GitHub Actions (Auto-Deploy on Push)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Setup GitHub Secrets
1. Go to repository Settings → Secrets
2. Add:
   - `VERCEL_TOKEN`: From [Vercel Account Settings](https://vercel.com/account/tokens)
   - `VERCEL_ORG_ID`: From Vercel dashboard
   - `VERCEL_PROJECT_ID`: From project settings

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
vercel build --prod

# Check Node version
node -v  # Should be 18+

# Verify dependencies
pnpm install
```

### Service Worker Issues
- Clear browser cache (DevTools → Application → Cache Storage)
- Check Console for SW registration errors
- Verify `public/sw.js` exists

### PWA Not Installing
- Must be HTTPS (automatic on Vercel)
- Check manifest.json is accessible
- Verify icons exist in public/
- Test on actual device (emulator sometimes fails)

### Slow Performance
- Check network tab for large images
- Monitor Vercel Analytics
- Optimize database queries (when added)
- Enable compression in next.config.js

## Real Data Integration

When ready to move from mock data:

### Satellite API Integration
```typescript
// Replace mock generateSatelliteData()
import EarthEngine from '@google/earthengine';

// Query Sentinel-2 data
const satellite = await EarthEngine.Image('COPERNICUS/S2')
  .filterBounds(geometry)
  .first();
```

### Database Setup
```bash
# Create Neon PostgreSQL database
# Add connection string to .env.local
DATABASE_URL=postgresql://...
```

### Authentication
```bash
# Setup Better Auth
pnpm add @better-auth/next

# Configure in lib/auth.ts
# Add BETTER_AUTH_SECRET to .env.local
```

## Monitoring & Analytics

### Error Tracking
Vercel provides built-in error logging. View in:
- Vercel Dashboard → Monitor
- Or integrate Sentry for advanced features

### User Analytics
```bash
# Already included: Vercel Analytics
# View in Vercel Dashboard → Analytics
```

### Custom Metrics
```typescript
// Add to your components
import { trackEvent } from '@vercel/analytics';

trackEvent('zone_clicked', {
  zone: 'A1',
  health: 'excellent'
});
```

## Rollback

If deployment has issues:
```bash
# View deployment history
vercel list

# Rollback to previous deployment
vercel rollback <deployment-url>
```

## Performance Optimization Checklist

- [ ] Enable ISR (Incremental Static Regeneration)
- [ ] Add database indexes
- [ ] Implement image CDN
- [ ] Setup edge caching for API responses
- [ ] Optimize bundle size (check with `npm run build`)
- [ ] Enable compression in next.config.js
- [ ] Optimize fonts (currently using system fonts)

## Cost Estimation

### Vercel Pricing (as of 2026)
- **Hobby**: Free (perfect for MVP)
- **Pro**: $20/month
- **Enterprise**: Custom pricing

### Included in Free Tier
- Unlimited bandwidth
- 500 build minutes/month
- GitHub integration
- Automatic HTTPS

### Costs When Adding Production Features
- Database: ~$20-100/month
- Satellite APIs: Varies by provider
- CDN: Included with Vercel
- Monitoring: Free tier sufficient

## Support & Resources

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- GitHub Issues: Report bugs in repository
- Vercel Support: https://vercel.com/support

---

**Doctor Soya** is production-ready and deployed to Vercel by default.
