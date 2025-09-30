# CRITICAL FIX - Deploy Immediately

## Step 1: Fix vercel.json

The current `vercel.json` configuration is causing JavaScript files to be served as HTML.

Replace the ENTIRE contents of `vercel.json` with:

```json
{
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

## Step 2: Set Environment Variables in Vercel Dashboard

**IMMEDIATELY** after deploying, set these in your Vercel dashboard:

1. Go to: https://vercel.com/dashboard
2. Select your project "track-my-gain"
3. Go to Settings > Environment Variables
4. Add these variables:

```
VITE_SUPABASE_URL=https://jzindaoigqrryvssgmwf
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
