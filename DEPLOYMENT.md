# Deploying to Vercel - Complete Guide

This guide will help you deploy your ExamTrakr application to Vercel.

## Prerequisites

- A [Vercel account](https://vercel.com/signup) (free tier is sufficient)
- Git repository (GitHub, GitLab, or Bitbucket)
- Node.js 18+ installed locally (for testing)

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to a Git repository**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your Git repository
   - Vercel will auto-detect Vite framework settings

3. **Configure Project**
   - **Framework Preset**: Vite (auto-detected)
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `dist` (auto-filled)
   - **Install Command**: `npm install` (auto-filled)

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for the build to complete
   - Your site will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   
4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Configuration Files

Your project includes the following deployment configuration:

### `vercel.json`
- **Rewrites**: Routes all requests to `index.html` for React Router
- **Headers**: Optimizes caching for static assets
- **Framework**: Configured for Vite

### Build Settings
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18.x or higher

## Post-Deployment Steps

### 1. **Custom Domain (Optional)**
   - Go to your project settings in Vercel
   - Navigate to "Domains"
   - Add your custom domain
   - Follow DNS configuration instructions

### 2. **Environment Variables (If needed in future)**
   - Go to Project Settings → Environment Variables
   - Add any sensitive keys (currently not needed)

### 3. **Update Supabase URL (If using custom domain)**
   - Add your Vercel domain to Supabase allowed redirect URLs
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add: `https://your-domain.vercel.app/**`

## Automatic Deployments

Vercel automatically deploys:
- **Production**: Every push to `main` branch
- **Preview**: Every pull request gets a preview URL

## Performance Optimization

Your deployment includes:
- ✅ Asset compression (Brotli/Gzip)
- ✅ Static file caching (1 year)
- ✅ Global CDN distribution
- ✅ Automatic HTTPS
- ✅ SPA routing configuration

## Monitoring & Analytics

After deployment, you can access:
- **Analytics**: Project → Analytics tab
- **Logs**: Project → Deployments → View logs
- **Performance**: Project → Speed Insights

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Test build locally: `npm run build`

### 404 on Routes
- Verify `vercel.json` includes rewrite rules
- Check that React Router is properly configured

### Supabase Connection Issues
- Verify Supabase credentials in `src/integrations/supabase/client.ts`
- Add Vercel domain to Supabase allowed URLs

## Local Testing Before Deploy

Test your build locally before deploying:

```bash
# Build the project
npm run build

# Preview the production build
npm run preview
```

Visit `http://localhost:4173` to test the production build.

## Support & Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Supabase with Vercel](https://supabase.com/docs/guides/platform/vercel)

## Quick Checklist

- [ ] Code pushed to Git repository
- [ ] Project imported to Vercel
- [ ] Build completed successfully
- [ ] Site is accessible via Vercel URL
- [ ] All routes work correctly
- [ ] Supabase authentication works
- [ ] Custom domain configured (if applicable)
- [ ] Analytics enabled (optional)

---

**Your project is now ready for Vercel deployment!** 🚀
