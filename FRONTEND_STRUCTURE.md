# Frontend Structure

## Technology Stack
- React 18.3.1 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router DOM v6 for routing
- React Query for data fetching
- Shadcn/ui components
- Lucide React for icons

## Project Architecture

### Entry Point
- `src/main.tsx` - Application entry point with ThemeProvider wrapper
- `src/App.tsx` - Main app component with routing configuration
- `index.html` - HTML template

### Routing Structure
```
/ - Landing page (Index.tsx)
/login - User login
/signup - User registration
/verify-email - Email verification
/dashboard - User dashboard (protected)
/exams - Browse all exams
/exams/:id - Individual exam details
/exams/:examId/section/:sectionId/resources - Section resources
/profile - User profile (protected)
/admin - Admin dashboard (protected)
/pricing - Pricing plans
/about - About page
/contact - Contact page
/support - Support page
/feedback - User feedback
/faq - Frequently asked questions
/terms - Terms of service
/privacy - Privacy policy
/refund - Refund policy
/add-exam - Add new exam (protected)
```

## Pages (`src/pages/`)

### Public Pages
- **Index.tsx** - Landing page with hero, features, testimonials
- **Login.tsx** - User authentication
- **Signup.tsx** - New user registration
- **VerifyEmail.tsx** - Email verification flow
- **Exams.tsx** - Browse exams (3 per row on laptop, 9 per page)
- **ExamDetail.tsx** - Detailed exam view with subjects and topics
- **About.tsx** - About the platform
- **Contact.tsx** - Contact form
- **FAQ.tsx** - Frequently asked questions
- **Pricing.tsx** - Subscription plans
- **Terms.tsx** - Terms of service
- **Privacy.tsx** - Privacy policy
- **Refund.tsx** - Refund policy
- **Support.tsx** - Support resources
- **Feedback.tsx** - User feedback form
- **NotFound.tsx** - 404 error page

### Protected Pages
- **Dashboard.tsx** - User dashboard with enrolled exams and progress
- **Profile.tsx** - User profile management
- **SectionResources.tsx** - Study resources for exam sections
- **AddExam.tsx** - Add new exams (user contribution)
- **AdminDashboard.tsx** - Admin panel

## Components Structure (`src/components/`)

### Core Components
- **Navigation.tsx** - Main navigation bar
- **Footer.tsx** - Site footer
- **ThemeProvider.tsx** - Dark/light theme context
- **ThemeToggle.tsx** - Theme switcher button
- **ProtectedRoute.tsx** - Route guard for authenticated pages

### Dashboard Components (`dashboard/`)
- **DashboardLoadingSkeleton.tsx** - Loading state for dashboard

### Exam Detail Components (`exam-detail/`)
- **ExamHeader.tsx** - Exam title and stats
- **ExamFilters.tsx** - Filter subjects and topics
- **ExamProgress.tsx** - Progress tracking UI
- **LoadingSkeleton.tsx** - Loading state for exam details
- **ExamsLoadingSkeleton.tsx** - Loading state for exam list

### Landing Page Components (`landing/`)
- **HeroSection.tsx** - Hero section with CTA
- **FeaturesSection.tsx** - Platform features
- **HowItWorksSection.tsx** - Step-by-step guide
- **PopularExamsSection.tsx** - Popular exams showcase
- **StatsSection.tsx** - Platform statistics
- **TestimonialsSection.tsx** - User testimonials
- **TrustSection.tsx** - Trust indicators
- **FAQSection.tsx** - FAQ accordion
- **CTASection.tsx** - Call to action

### Profile Components (`profile/`)
- **ProfileInfoCard.tsx** - User information display
- **SubscriptionCard.tsx** - Subscription status
- **SupportCard.tsx** - Support links
- **ProfileLoadingSkeleton.tsx** - Loading state

### Modals
- **AddExamModal.tsx** - Modal for adding exams
- **RequestExamModal.tsx** - Modal for requesting new exams
- **ChangePasswordDialog.tsx** - Password change dialog

### UI Components (`ui/`)
Complete Shadcn/ui component library including:
- Buttons, Cards, Dialogs, Forms
- Input, Select, Checkbox, Radio
- Toast, Alert, Badge, Separator
- Accordion, Tabs, Tooltip
- Progress, Skeleton, Avatar
- Navigation Menu, Dropdown Menu
- And 30+ more reusable components

## Hooks (`src/hooks/`)
- **useAuth.tsx** - Authentication state and methods
- **useImageOptimization.tsx** - Image optimization utilities
- **use-mobile.tsx** - Mobile device detection
- **use-toast.ts** - Toast notification hook

## Contexts (`src/contexts/`)
- **AuthContext.tsx** - Global authentication context with user state, session, and sign out

## Utilities (`src/utils/`)
- **imageOptimization.ts** - Image loading and optimization helpers

## Styling

### Design System
- **src/index.css** - Global styles and CSS variables
- **tailwind.config.ts** - Tailwind configuration with custom colors
- Semantic color tokens (primary, secondary, success, etc.)
- Dark/light mode support
- Custom animations and transitions

### Design Principles
- HSL color system for all colors
- Semantic tokens instead of direct colors
- Responsive design (mobile-first)
- Consistent spacing and typography
- Accessible color contrast ratios

## State Management
- React Context for auth state
- React Query for server state
- Local component state with useState
- URL state with React Router

## Key Features
1. **Authentication** - Email/password with Supabase Auth
2. **Exam Tracking** - Progress tracking for enrolled exams
3. **Dark Mode** - System, light, and dark theme support
4. **Responsive Design** - Mobile, tablet, and desktop optimized
5. **Real-time Updates** - Live progress synchronization
6. **SEO Optimized** - Meta tags, sitemap, robots.txt
7. **PWA Ready** - Service worker and manifest
