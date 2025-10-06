# Backend Structure

## Technology Stack
- **Lovable Cloud** - Integrated backend service powered by Supabase
- **PostgreSQL** - Primary database
- **Supabase Auth** - Authentication service
- **Supabase Storage** - File storage
- **Edge Functions** - Serverless backend logic

## Supabase Integration

### Client Configuration (`src/integrations/supabase/client.ts`)
```typescript
Supabase URL: https://bjndsotwbzmuqwdikdaq.supabase.co
Features:
- Auto refresh tokens
- Persistent sessions
- Session detection in URL
- LocalStorage for session storage
```

### Type Definitions (`src/integrations/supabase/database.types.ts`)
- Auto-generated TypeScript types from database schema
- Full type safety for all database operations
- Enums for user roles, subscription types, difficulty levels

## Authentication System

### Auth Flow
1. **Sign Up** - Email/password registration
2. **Email Verification** - Confirm email address
3. **Sign In** - Login with credentials
4. **Session Management** - Auto-refresh and persistence
5. **Password Reset** - Forgot password flow
6. **Sign Out** - Clear session and tokens

### Auth Context (`src/contexts/AuthContext.tsx`)
Provides:
- `user` - Current user object
- `session` - Active session
- `loading` - Auth state loading
- `signOut()` - Sign out method

### Protected Routes
- Dashboard access requires authentication
- Profile page requires authentication
- Admin panel requires admin role
- Automatic redirect to login for unauthenticated users

## API Integration

### Supabase Client Operations
All database operations use the Supabase client:

```typescript
// Read data
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', 'value');

// Insert data
const { data, error } = await supabase
  .from('table_name')
  .insert([{ column: 'value' }]);

// Update data
const { data, error } = await supabase
  .from('table_name')
  .update({ column: 'new_value' })
  .eq('id', 'value');

// Delete data
const { data, error } = await supabase
  .from('table_name')
  .delete()
  .eq('id', 'value');
```

## Key Backend Features

### 1. User Management
- User registration and authentication
- Email verification
- Password management
- Profile updates
- Subscription tracking

### 2. Exam Management
- Create, read, update exams
- Exam enrollment tracking
- Progress monitoring
- Subject and topic organization

### 3. Progress Tracking
- Real-time progress updates
- Completion percentage calculation
- Last studied tracking
- Study streak monitoring

### 4. Admin Functions
- User management
- Exam approval/rejection
- Content moderation
- Analytics and reporting

### 5. Feedback System
- User feedback collection
- Rating submissions
- Support ticket creation
- Feature requests

## Security

### Row Level Security (RLS)
- Enabled on all tables
- Users can only access their own data
- Admin role has elevated permissions
- Public read access for exam catalog

### Authentication Security
- JWT tokens for session management
- Automatic token refresh
- Secure password hashing
- Email verification required

### API Security
- All requests authenticated via Supabase client
- Row level security enforces data access
- SQL injection prevention
- XSS protection

## Data Flow

### User Registration Flow
1. User submits signup form
2. Supabase creates auth user
3. Trigger creates profile record
4. Email verification sent
5. User confirms email
6. Account activated

### Exam Enrollment Flow
1. User selects exam to track
2. Record created in user_exam_enrollments
3. Progress records initialized
4. Dashboard updated with new exam
5. Real-time sync across devices

### Progress Update Flow
1. User marks topic as studied
2. Frontend updates UI optimistically
3. Backend updates user_exam_progress
4. Completion percentage recalculated
5. Dashboard reflects new progress

## Error Handling
- Supabase errors caught and displayed
- Toast notifications for user feedback
- Console logging for debugging
- Graceful fallbacks for failed requests

## Performance Optimization
- React Query for data caching
- Automatic background refetching
- Optimistic updates for better UX
- Pagination for large datasets
- Lazy loading for images and components

## Environment Variables
No environment variables needed - Supabase credentials embedded in client configuration for Lovable Cloud integration.
