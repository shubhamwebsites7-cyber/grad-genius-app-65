# Deployment Fixes for Track My Gain

## Issues Fixed

### 1. MIME Type Errors
- **Problem**: JavaScript files served with wrong MIME type causing module loading failures
- **Solution**: Updated `vercel.json` with proper Content-Type headers for JS/CSS files
- **Files Modified**: `vercel.json`

### 2. Content Security Policy (CSP) Violations
- **Problem**: CSP blocking eval() usage and inline scripts
- **Solution**: Added comprehensive CSP meta tag in `index.html`
- **Files Modified**: `index.html`

### 3. Supabase Authentication Issues
- **Problem**: Invalid API key causing 401 errors
- **Solution**: Enhanced Supabase client configuration with PKCE flow
- **Files Modified**: `src/integrations/supabase/client.ts`

### 4. Build Configuration
- **Problem**: Vite build not optimized for production
- **Solution**: Updated Vite config with proper ESBuild settings
- **Files Modified**: `vite.config.ts`

## Required Actions

### 1. Vercel Environment Variables
Add these environment variables in your Vercel dashboard:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**How to get these values:**
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the Project URL and anon/public key

### 2. Supabase Configuration

#### Auth Settings in Supabase Dashboard:
1. Go to Authentication > Settings
2. Set **Site URL** to: `https://track-my-gain.vercel.app`
3. Add **Redirect URLs**:
   - `https://track-my-gain.vercel.app/auth/callback`
   - `https://track-my-gain.vercel.app/auth`
4. Enable **Google Provider** if using Google OAuth

#### Google OAuth Setup (if using Google auth):
1. Go to Google Cloud Console
2. Create/select a project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://your-project-id.supabase.co/auth/v1/callback`
6. Copy Client ID and Client Secret to Supabase Auth settings

### 3. Vercel Deployment Settings

#### Build Command:
```bash
npm run build
```

#### Output Directory:
```
dist
```

#### Install Command:
```bash
npm install
```

### 4. Domain Configuration
- Ensure your custom domain (if any) is properly configured in Vercel
- Update Supabase Site URL if using custom domain

## Testing Steps

1. **Deploy to Vercel** with the updated configuration
2. **Check browser console** for any remaining errors
3. **Test authentication flow**:
   - Visit the app
   - Try to sign in
   - Check if redirect works properly
4. **Verify environment variables** are loaded correctly

## Common Issues & Solutions

### Blank Screen on Load
- Check if environment variables are set correctly
- Verify Supabase URL and key are valid
- Check browser console for JavaScript errors

### Auth Redirect Issues
- Ensure redirect URLs match exactly in Supabase settings
- Check that the callback route is properly configured
- Verify Google OAuth settings if using Google auth

### CSP Errors
- The updated CSP should resolve most issues
- If you still see CSP errors, you may need to adjust the policy further

## Files Modified

1. `vite.config.ts` - Build configuration improvements
2. `vercel.json` - MIME type headers and routing
3. `index.html` - Content Security Policy
4. `src/integrations/supabase/client.ts` - Enhanced auth configuration

## Next Steps

1. Set up environment variables in Vercel
2. Configure Supabase auth settings
3. Deploy the updated code
4. Test the authentication flow
5. Monitor for any remaining issues

The app should now work properly without the blank screen, MIME type errors, or authentication failures.
