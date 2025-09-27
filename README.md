# Track My Gain - Personal Health Tracker

A comprehensive health and fitness tracking application built with React, TypeScript, and Supabase.

## Features

- **Calorie Tracking**: Monitor daily calorie intake with meal breakdowns
- **Weight Management**: Track weight progress over time
- **Goal Setting**: Set and track personal health goals
- **Todo Lists**: Organize daily tasks and habits
- **Streak Tracking**: Build consistency with daily streaks
- **Google Authentication**: Secure login with Google OAuth

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: Radix UI, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd track-my-gain
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env.local` file with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server
```bash
npm run dev
```

## Deployment

### Vercel

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy

## Database Setup

Run the SQL migrations in your Supabase project to set up the required tables:

- `goals` table for goal tracking
- `tips` table for health tips
- `streaks` table for streak tracking
- `calories` table for calorie tracking
- `weights` table for weight tracking
- `tasks` table for todo items

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License