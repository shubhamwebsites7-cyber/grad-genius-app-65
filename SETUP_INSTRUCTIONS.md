# Setup Instructions for New Features

## Overview
This document provides setup instructions for the new features added to ExamTrakr:
1. **Request New Exam** - Modal popup for users to request exams
2. **Feedback Page** - Interactive quiz-style feedback collection

## Database Setup

### Step 1: Run the SQL Script
Execute the `FEEDBACK_SETUP.sql` file in your Supabase SQL editor to create the necessary tables:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `FEEDBACK_SETUP.sql`
4. Click "Run" to execute the script

This will create:
- `user_feedback` table - Stores user feedback responses
- `exam_requests` table - Stores user exam requests
- Appropriate RLS policies for data security
- Indexes for optimal performance

### Step 2: Verify Tables
After running the script, verify the tables were created:
```sql
SELECT * FROM public.user_feedback LIMIT 1;
SELECT * FROM public.exam_requests LIMIT 1;
```

## Features Implemented

### 1. Request New Exam Modal
**Location:** Exams page (`/exams`)

**Features:**
- Mobile-friendly popup dialog
- Input validation (required fields + max length)
- Stores requests in `exam_requests` table
- Login required for submission
- Success/error toast notifications

**Usage:**
- Click "Request New Exam" button in toolbar
- Or click "Request New Exam" in the CTA section at bottom
- Fill in exam name, type, and optional reason
- Submit to database

**Database Schema:**
```sql
exam_requests (
  id UUID,
  user_id UUID (references auth.users),
  exam_name VARCHAR(100),
  exam_type VARCHAR(50),
  reason TEXT,
  status TEXT (pending/approved/rejected/implemented),
  admin_notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### 2. Interactive Feedback Page
**Location:** `/feedback` (added to navigation after Pricing)

**Features:**
- Quiz-style interactive format
- Progress bar showing completion (e.g., "1/6", "2/6")
- Auto-advance on radio button selection
- Manual advance for text questions
- 6 questions total:
  1. Helpfulness rating
  2. Ease of use
  3. Design and speed
  4. Recommendation likelihood
  5. Pricing preference
  6. Open-ended improvement suggestion
- Success screen after submission
- One submission per user (enforced by database)

**Database Schema:**
```sql
user_feedback (
  id UUID,
  user_id UUID (references auth.users, UNIQUE),
  helpfulness TEXT,
  ease_of_use TEXT,
  design_speed TEXT,
  recommendation TEXT,
  pricing_preference TEXT,
  improvement_suggestion TEXT,
  created_at TIMESTAMPTZ
)
```

## Navigation Updates
- Added "Feedback" link to main navigation (after Pricing)
- Uses MessageSquare icon
- Available on both desktop and mobile navigation

## Security Features
- Row Level Security (RLS) enabled on both tables
- Users can only view/edit their own feedback and requests
- Admins can view all feedback and manage exam requests
- Input validation and max length constraints
- Proper error handling and user feedback

## Mobile Responsiveness
- All modals are fully responsive
- Touch-friendly button sizes
- Optimized layouts for small screens
- Progress indicators visible on all devices

## Admin Access
Admins can:
- View all exam requests with status filtering
- Update request status (pending → approved/rejected/implemented)
- Add admin notes to requests
- View aggregated user feedback for insights

## Testing Checklist
- [ ] Run FEEDBACK_SETUP.sql successfully
- [ ] Test Request New Exam modal (logged in and logged out)
- [ ] Complete feedback quiz as a user
- [ ] Verify data appears in Supabase tables
- [ ] Test mobile responsiveness
- [ ] Verify RLS policies work correctly
- [ ] Test duplicate feedback submission (should fail)

## Notes
- Feedback is limited to one submission per user
- Exam requests can be submitted multiple times
- All text inputs have max length validation
- Toast notifications provide user feedback on all actions
