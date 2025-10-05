# React Vite to Next.js Migration Guide

## Overview
This guide provides a structured approach to migrate the exam learning platform from React + Vite to Next.js 14 with App Router while maintaining identical UI/UX and database functionality.

## Migration Strategy

### Phase 1: Project Setup (Week 1)
1. **Initialize Next.js Project**
   ```bash
   npx create-next-app@latest exam-learning-nextjs --typescript --tailwind --app
   cd exam-learning-nextjs
   ```

2. **Install Required Dependencies**
   ```bash
   # UI Components
   npm install @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-avatar
   npm install @radix-ui/react-checkbox @radix-ui/react-collapsible @radix-ui/react-dialog
   npm install @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-popover
   npm install @radix-ui/react-progress @radix-ui/react-select @radix-ui/react-separator
   npm install @radix-ui/react-slider @radix-ui/react-switch @radix-ui/react-tabs
   npm install @radix-ui/react-toast @radix-ui/react-tooltip
   
   # Utilities
   npm install class-variance-authority clsx tailwind-merge
   npm install lucide-react date-fns
   npm install sonner
   
   # Database & Auth
   npm install @supabase/supabase-js @supabase/ssr
   npm install @tanstack/react-query
   
   # Form Handling
   npm install react-hook-form @hookform/resolvers zod
   
   # PWA
   npm install next-pwa
   ```

3. **Configure PWA Support**
   ```javascript
   // next.config.js
   const withPWA = require('next-pwa')({
     dest: 'public',
     register: true,
     skipWaiting: true,
     disable: process.env.NODE_ENV === 'development'
   });

   module.exports = withPWA({
     reactStrictMode: true,
     images: {
       domains: ['bjndsotwbzmuqwdikdaq.supabase.co']
     }
   });
   ```

### Phase 2: File Structure Migration (Week 1-2)

#### New Next.js Structure
```
exam-learning-nextjs/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── verify-email/
│   │       └── page.tsx
│   ├── (protected)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── exams/
│   │   │   └── page.tsx
│   │   ├── exam/
│   │   │   └── [examId]/
│   │   │       └── page.tsx
│   │   ├── section/
│   │   │   └── [sectionId]/
│   │   │       └── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   ├── add-exam/
│   │   │   └── page.tsx
│   │   └── admin/
│   │       └── page.tsx
│   ├── pricing/
│   │   └── page.tsx
│   ├── support/
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx (Landing page)
│   └── not-found.tsx
├── components/
│   ├── ui/ (shadcn components)
│   ├── landing/
│   ├── exam-detail/
│   ├── profile/
│   ├── Navigation.tsx
│   ├── Footer.tsx
│   └── ThemeProvider.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts (client-side)
│   │   ├── server.ts (server-side)
│   │   └── middleware.ts
│   └── utils.ts
├── hooks/
│   ├── useAuth.tsx
│   └── use-toast.ts
├── contexts/
│   └── AuthContext.tsx
├── public/
│   ├── manifest.json
│   ├── icons/
│   └── images/
└── middleware.ts (Auth middleware)
```

### Phase 3: Database & Authentication Setup (Week 2)

#### 1. Supabase Client Configuration

**Client-side Supabase Client** (`lib/supabase/client.ts`):
```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

**Server-side Supabase Client** (`lib/supabase/server.ts`):
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

export const createClient = () => {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle middleware/server component cookie setting
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle middleware/server component cookie removal
          }
        },
      },
    }
  )
}
```

**Middleware Supabase Client** (`lib/supabase/middleware.ts`):
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export const createClient = (request: NextRequest) => {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  return { supabase, response }
}
```

#### 2. Authentication Middleware (`middleware.ts`):
```typescript
import { createClient } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/signup')
  const isProtectedPage = request.nextUrl.pathname.startsWith('/dashboard') ||
                         request.nextUrl.pathname.startsWith('/exam') ||
                         request.nextUrl.pathname.startsWith('/profile') ||
                         request.nextUrl.pathname.startsWith('/admin')

  // Redirect authenticated users away from auth pages
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect unauthenticated users to login
  if (!session && isProtectedPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Phase 4: Component Migration (Week 2-3)

#### Migration Checklist for Each Component:

1. **Replace React Router with Next.js Navigation**
   ```typescript
   // Old (Vite)
   import { useNavigate, Link } from 'react-router-dom'
   const navigate = useNavigate()
   navigate('/dashboard')
   
   // New (Next.js)
   import { useRouter } from 'next/navigation'
   import Link from 'next/link'
   const router = useRouter()
   router.push('/dashboard')
   ```

2. **Update Image Imports**
   ```typescript
   // Old (Vite)
   import heroImage from '@/assets/hero-image.jpg'
   <img src={heroImage} alt="Hero" />
   
   // New (Next.js)
   import Image from 'next/image'
   import heroImage from '@/public/images/hero-image.jpg'
   <Image src={heroImage} alt="Hero" width={1920} height={1080} />
   ```

3. **Update Metadata with Next.js Metadata API**
   ```typescript
   // Old (Vite)
   import { Helmet } from 'react-helmet-async'
   <Helmet>
     <title>Page Title</title>
   </Helmet>
   
   // New (Next.js)
   // In page.tsx
   export const metadata = {
     title: 'Page Title',
     description: 'Page description'
   }
   ```

4. **Convert Client/Server Components**
   - Add `'use client'` directive to interactive components
   - Keep data-fetching components as Server Components
   - Use Server Actions for mutations

### Phase 5: Page-by-Page Migration (Week 3-4)

#### Landing Page (`app/page.tsx`)
```typescript
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'
import { HeroSection } from '@/components/landing/HeroSection'
// ... other components

export const metadata = {
  title: 'Exam Learning Platform - Master Your Exams',
  description: 'Comprehensive exam preparation platform'
}

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        <HeroSection />
        {/* Other sections */}
      </main>
      <Footer />
    </>
  )
}
```

#### Protected Pages with Server-Side Auth Check
```typescript
// app/(protected)/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = createClient()
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Fetch user data server-side
  const { data: exams } = await supabase
    .from('user_enrolled_exams')
    .select('*')
    .eq('user_id', session.user.id)

  return (
    <DashboardClient exams={exams} />
  )
}
```

### Phase 6: Database Tables Migration (Week 4)

All existing Supabase tables remain unchanged. Only the client connection changes:

**Tables to Verify:**
- ✅ exams
- ✅ subjects
- ✅ topics
- ✅ user_enrolled_exams
- ✅ user_exam_progress
- ✅ user_topic_progress
- ✅ topic_difficulty_ratings
- ✅ user_roles
- ✅ profiles

**RLS Policies:** All existing RLS policies work without changes.

**Edge Functions:** Can be called from Next.js using the same Supabase client.

### Phase 7: Environment Variables (Week 4)

Create `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://bjndsotwbzmuqwdikdaq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Phase 8: PWA Configuration (Week 4)

**manifest.json** (copy to `public/manifest.json`):
```json
{
  "name": "Exam Learning Platform",
  "short_name": "ExamPrep",
  "description": "Comprehensive exam preparation platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Phase 9: Files to Remove from Vite Project

**Remove these Vite-specific files:**
- ❌ `vite.config.ts`
- ❌ `index.html`
- ❌ `src/main.tsx`
- ❌ `src/App.tsx`
- ❌ `src/App.css`
- ❌ `public/sw.js` (Next-PWA handles this)

**Keep and migrate:**
- ✅ All components in `src/components/`
- ✅ All pages in `src/pages/` (convert to app router structure)
- ✅ All hooks in `src/hooks/`
- ✅ All contexts in `src/contexts/`
- ✅ `tailwind.config.ts` (update paths)
- ✅ `src/index.css` (rename to `app/globals.css`)
- ✅ Database types from `src/integrations/supabase/`

### Phase 10: Testing Checklist (Week 5)

- [ ] All routes accessible
- [ ] Authentication flows (login, signup, logout)
- [ ] Protected routes redirect correctly
- [ ] Database operations work (CRUD)
- [ ] File uploads to Supabase Storage
- [ ] Real-time subscriptions work
- [ ] PWA installs on mobile
- [ ] Offline functionality
- [ ] Theme switching (dark/light mode)
- [ ] All forms submit correctly
- [ ] Search and filters work
- [ ] Pagination functions properly
- [ ] Admin panel accessible to admins only

### Phase 11: Deployment (Week 5)

**Deploy to Vercel:**
```bash
npm install -g vercel
vercel login
vercel
```

**Configure Environment Variables in Vercel:**
- Add `NEXT_PUBLIC_SUPABASE_URL`
- Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Key Differences: Vite vs Next.js

| Feature | Vite | Next.js |
|---------|------|---------|
| Routing | React Router | File-based (App Router) |
| Images | Static imports | Next/Image component |
| Meta tags | React Helmet | Metadata API |
| Auth | Client-side | Server + Client |
| Data Fetching | React Query | Server Components + React Query |
| Environment | Client-side only | Server + Client |

## Performance Optimizations

1. **Use Server Components by default** - Only add `'use client'` when needed
2. **Implement loading.tsx** - Show loading states during navigation
3. **Add error.tsx** - Handle errors gracefully
4. **Use Suspense boundaries** - Stream content progressively
5. **Optimize images** - Use Next/Image with proper sizing
6. **Implement ISR** - Cache frequently accessed pages

## Common Pitfalls to Avoid

1. ❌ Don't use `useEffect` for data fetching in Server Components
2. ❌ Don't access cookies/headers in Client Components
3. ❌ Don't forget `'use client'` directive for interactive components
4. ❌ Don't mix server and client Supabase clients
5. ❌ Don't use `window` or `document` in Server Components

## Timeline Summary

- **Week 1:** Setup + Structure
- **Week 2:** Database + Auth
- **Week 3:** Component Migration
- **Week 4:** Pages + PWA
- **Week 5:** Testing + Deployment

**Total Estimated Time:** 5 weeks for complete migration

## Migration Decision

⚠️ **Important Consideration:**

Before proceeding with this migration, consider:

1. **Why migrate?** 
   - Need SSR/SSG for SEO?
   - Better performance for users?
   - Need server-side features?

2. **Current app works well** - Vite is fast and modern

3. **Migration effort** - 5 weeks of development time

4. **Breaking changes** - Requires extensive testing

**Recommendation:** Only migrate if you have specific requirements that Next.js solves better than Vite.

## Next Steps

Would you like to:
1. Proceed with the migration (start with Phase 1)?
2. Stay with Vite and improve current setup?
3. Discuss specific features you need from Next.js?
