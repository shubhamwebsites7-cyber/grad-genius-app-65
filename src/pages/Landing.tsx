import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckSquare, 
  Target, 
  Timer,
  BarChart3,
  Trophy,
  Shield,
  Smartphone,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useState } from 'react';

const features = [
  {
    icon: CheckSquare,
    title: 'Daily To-Do',
    description: 'Plan your day with priority levels — High, Medium, and Low — and stay on top of what matters.',
  },
  {
    icon: Timer,
    title: 'Pomodoro Focus',
    description: 'Run 25/5 or 45/15 sessions, attach a task, and see your full day on a 24-hour timeline.',
  },
  {
    icon: Trophy,
    title: 'Leaderboard',
    description: 'See completed-task rankings across today, this week, and this month.',
  },
  {
    icon: Target,
    title: 'Goals & Notes',
    description: 'Capture your next 3-month goals, daily reminders, tips, and learnings — all in one place.',
  },
];

const stats = [
  { value: '4', label: 'Core Tools' },
  { value: '100%', label: 'Free to Use' },
  { value: 'PWA', label: 'Install as App' },
  { value: 'Cloud', label: 'Synced Securely' },
];

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary flex items-center justify-center">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-foreground">GoalGrip</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-4">
              <ThemeToggle />
              <Link to="/auth">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link to="/auth">
                <Button size="sm">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Mobile Navigation */}
            <div className="flex sm:hidden items-center gap-2">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="sm:hidden border-t bg-background py-4 space-y-3">
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-center">
                  Login
                </Button>
              </Link>
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 border-b">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/50 text-muted-foreground text-xs sm:text-sm mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            A focused productivity workspace
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-foreground">
            Plan your day. Focus deeply. <br className="hidden sm:block" />
            Track real progress.
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            GoalGrip is a clean, distraction-free workspace for your to-dos, pomodoro sessions,
            goals, and leaderboard — built for the web, installable as an app.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="px-6">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="px-6">Login</Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-foreground">Everything you need. Nothing you don't.</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Four simple tools that work together to help you finish what matters.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <Card key={index} className="border bg-card hover:border-primary/40 transition-colors">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t bg-muted/30">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { icon: Smartphone, title: 'Install as an app', desc: 'Works on the web, installs as a PWA, and ships to Android via TWA.' },
            { icon: Shield, title: 'Secure & private', desc: 'Email + password authentication, encrypted cloud sync, your data only.' },
            { icon: BarChart3, title: 'Real progress', desc: 'Honest charts and rankings — see what actually moved.' },
          ].map((b, i) => (
            <div key={i} className="flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-background border flex items-center justify-center">
                <b.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">Start building your day with intention.</h2>
          <p className="text-muted-foreground mb-8">
            Free to use. No credit card required. Sign up and start in under a minute.
          </p>
          <Link to="/auth">
            <Button size="lg" className="px-8">
              Create your free account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 sm:px-6 lg:px-8 border-t">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Target className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">GoalGrip</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <span>© {new Date().getFullYear()} GoalGrip</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
