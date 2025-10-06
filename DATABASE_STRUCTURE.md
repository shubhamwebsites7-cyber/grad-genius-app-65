# Database Structure

## Database Platform
- **PostgreSQL** - Primary database
- **Lovable Cloud** - Managed through Supabase
- **Row Level Security** - Enabled on all tables

## Schema Overview

### Core Tables
1. `profiles` - User profile information
2. `exams` - Available exams catalog
3. `subjects` - Exam subjects
4. `topics` - Subject topics
5. `user_exam_enrollments` - User exam tracking
6. `user_exam_progress` - Topic completion tracking
7. `subscriptions` - User subscription management
8. `user_feedback` - Feedback and ratings
9. `exam_requests` - User-submitted exam requests

---

## Table Schemas

### 1. `profiles`
User profile and account information.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_email_verified BOOLEAN DEFAULT FALSE
);
```

**Columns:**
- `id` - User UUID (references auth.users)
- `email` - User email address
- `full_name` - User's full name
- `avatar_url` - Profile picture URL
- `created_at` - Account creation timestamp
- `updated_at` - Last profile update
- `role` - User role (user/admin)
- `is_email_verified` - Email verification status

**RLS Policies:**
- Users can read their own profile
- Users can update their own profile
- Admins can read all profiles

---

### 2. `exams`
Master catalog of available exams.

```sql
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  enrolled_students TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_approved BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `id` - Unique exam identifier
- `name` - Exam name/title
- `type` - Exam type/category
- `description` - Exam description
- `enrolled_students` - Number of enrolled students (text)
- `is_active` - Exam availability status
- `is_approved` - Admin approval status
- `created_by` - User who created exam
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**RLS Policies:**
- Public read access for approved exams
- Authenticated users can create exams
- Admins can approve/reject exams

---

### 3. `subjects`
Subjects within each exam.

```sql
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `id` - Unique subject identifier
- `exam_id` - Parent exam reference
- `name` - Subject name
- `description` - Subject description
- `order_index` - Display order
- `created_at` - Creation timestamp

**RLS Policies:**
- Public read access
- Admins can create/update subjects

---

### 4. `topics`
Individual topics within subjects.

```sql
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  importance TEXT CHECK (importance IN ('low', 'medium', 'high')),
  resources JSONB,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `id` - Unique topic identifier
- `subject_id` - Parent subject reference
- `exam_id` - Parent exam reference
- `name` - Topic name
- `description` - Topic description
- `difficulty` - Topic difficulty level
- `importance` - Topic importance level
- `resources` - Study resources (JSON)
- `order_index` - Display order
- `created_at` - Creation timestamp

**RLS Policies:**
- Public read access
- Admins can create/update topics

---

### 5. `user_exam_enrollments`
Tracks which exams users are studying.

```sql
CREATE TABLE user_exam_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  target_date DATE,
  notes TEXT,
  UNIQUE(user_id, exam_id)
);
```

**Columns:**
- `id` - Unique enrollment identifier
- `user_id` - User reference
- `exam_id` - Exam reference
- `enrolled_at` - Enrollment timestamp
- `target_date` - User's target exam date
- `notes` - User notes about exam

**RLS Policies:**
- Users can read their own enrollments
- Users can create enrollments
- Users can delete their own enrollments

---

### 6. `user_exam_progress`
Tracks completion status of individual topics.

```sql
CREATE TABLE user_exam_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  last_studied_at TIMESTAMPTZ,
  notes TEXT,
  confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
  UNIQUE(user_id, topic_id)
);
```

**Columns:**
- `id` - Unique progress record
- `user_id` - User reference
- `exam_id` - Exam reference
- `subject_id` - Subject reference
- `topic_id` - Topic reference
- `is_completed` - Completion status
- `completed_at` - Completion timestamp
- `last_studied_at` - Last study session
- `notes` - User notes about topic
- `confidence_level` - User's confidence (1-5)

**RLS Policies:**
- Users can read their own progress
- Users can update their own progress

---

### 7. `subscriptions`
User subscription and payment tracking.

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT CHECK (plan_type IN ('free', 'basic', 'premium')),
  status TEXT CHECK (status IN ('active', 'cancelled', 'expired')),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  payment_method TEXT,
  amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `id` - Subscription identifier
- `user_id` - User reference
- `plan_type` - Subscription tier
- `status` - Current subscription status
- `start_date` - Subscription start
- `end_date` - Subscription expiry
- `payment_method` - Payment method used
- `amount` - Subscription cost
- `currency` - Currency code
- `created_at` - Record creation
- `updated_at` - Last update

**RLS Policies:**
- Users can read their own subscription
- Admins can manage all subscriptions

---

### 8. `user_feedback`
User feedback, ratings, and support requests.

```sql
CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  user_name TEXT,
  feedback_type TEXT CHECK (feedback_type IN ('bug', 'feature', 'improvement', 'other')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
```

**Columns:**
- `id` - Feedback identifier
- `user_id` - User reference (nullable for anonymous)
- `user_email` - User email
- `user_name` - User name
- `feedback_type` - Type of feedback
- `subject` - Feedback subject
- `message` - Feedback message
- `rating` - User rating (1-5)
- `status` - Review status
- `created_at` - Submission timestamp
- `resolved_at` - Resolution timestamp

**RLS Policies:**
- Users can create feedback
- Users can read their own feedback
- Admins can read and update all feedback

---

### 9. `exam_requests`
User requests for new exams to be added.

```sql
CREATE TABLE exam_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  exam_name TEXT NOT NULL,
  exam_type TEXT NOT NULL,
  description TEXT,
  justification TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);
```

**Columns:**
- `id` - Request identifier
- `user_id` - Requesting user
- `exam_name` - Requested exam name
- `exam_type` - Requested exam type
- `description` - Exam description
- `justification` - Why exam is needed
- `status` - Request status
- `created_at` - Request timestamp
- `reviewed_at` - Review timestamp
- `reviewed_by` - Admin who reviewed

**RLS Policies:**
- Authenticated users can create requests
- Users can read their own requests
- Admins can manage all requests

---

## Database Functions & Triggers

### Auto-create Profile on User Signup
```sql
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Update Timestamps
```sql
CREATE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Indexes for Performance

```sql
-- User lookups
CREATE INDEX idx_profiles_email ON profiles(email);

-- Exam queries
CREATE INDEX idx_exams_is_active ON exams(is_active);
CREATE INDEX idx_exams_is_approved ON exams(is_approved);

-- Subject and topic lookups
CREATE INDEX idx_subjects_exam_id ON subjects(exam_id);
CREATE INDEX idx_topics_subject_id ON topics(subject_id);
CREATE INDEX idx_topics_exam_id ON topics(exam_id);

-- User progress queries
CREATE INDEX idx_user_exam_enrollments_user_id ON user_exam_enrollments(user_id);
CREATE INDEX idx_user_exam_progress_user_id ON user_exam_progress(user_id);
CREATE INDEX idx_user_exam_progress_topic_id ON user_exam_progress(topic_id);

-- Feedback queries
CREATE INDEX idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX idx_user_feedback_status ON user_feedback(status);
```

---

## Setup SQL Files

### Initial Setup
- `SUPABASE_SETUP.sql` - Initial database schema
- `ADMIN_SETUP.sql` - Admin user configuration
- `FEEDBACK_SETUP.sql` - Feedback system setup
- `FEEDBACK_SETUP_UPDATE.sql` - Feedback table updates
- `PRICING_MIGRATION.sql` - Pricing and subscription setup
- `TOPIC_DIFFICULTY_RATINGS.sql` - Topic metadata setup

---

## Data Relationships

```
auth.users (Supabase Auth)
  ├── profiles (1:1)
  ├── exams (1:many) [created_by]
  ├── user_exam_enrollments (1:many)
  ├── user_exam_progress (1:many)
  ├── subscriptions (1:many)
  ├── user_feedback (1:many)
  └── exam_requests (1:many)

exams
  ├── subjects (1:many)
  ├── topics (1:many)
  ├── user_exam_enrollments (1:many)
  └── user_exam_progress (1:many)

subjects
  ├── topics (1:many)
  └── user_exam_progress (1:many)

topics
  └── user_exam_progress (1:many)
```

---

## Backup and Maintenance

### Recommended Practices
- Regular automated backups through Lovable Cloud
- Periodic data cleanup for old progress records
- Monitor table sizes and index performance
- Regular RLS policy audits
- Archive old feedback and requests

### Data Retention
- User profiles: Indefinite (until account deletion)
- Exam progress: Indefinite
- Feedback: 2 years recommended
- Exam requests: 1 year recommended
- Audit logs: 90 days recommended
