import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Utensils, 
  Weight, 
  CheckSquare, 
  Target, 
  Dumbbell, 
  Flame,
  TrendingUp,
  Calendar,
  Shield,
  Smartphone,
  ArrowRight,
  Star,
  Zap
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const features = [
  {
    icon: Utensils,
    title: 'Calorie Tracking',
    description: 'Track your daily meals across morning, afternoon, dinner, and evening with customizable calorie goals.',
    color: 'text-orange-500'
  },
  {
    icon: Weight,
    title: 'Weight Monitoring',
    description: 'Log your weight daily and visualize your progress with beautiful interactive charts.',
    color: 'text-blue-500'
  },
  {
    icon: CheckSquare,
    title: 'Smart To-Do List',
    description: 'Manage tasks with priority levels (High, Medium, Low) and smart limits to stay focused.',
    color: 'text-green-500'
  },
  {
    icon: Target,
    title: 'Goals & Lifestyle Tips',
    description: 'Set personal goals, track completion, and save health & lifestyle tips for motivation.',
    color: 'text-purple-500'
  },
  {
    icon: Dumbbell,
    title: 'Exercise Tracking',
    description: 'Track your workouts, maintain streaks, and build consistent exercise habits.',
    color: 'text-red-500'
  },
  {
    icon: Flame,
    title: 'Streak System',
    description: 'Build and maintain streaks for consistent progress. Never break the chain!',
    color: 'text-amber-500'
  }
];

const stats = [
  { value: '5+', label: 'Core Features' },
  { value: '100%', label: 'Free to Use' },
  { value: 'PWA', label: 'Install as App' },
  { value: '24/7', label: 'Cloud Sync' }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Target className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                GoalGrip
              </span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link to="/auth">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Your All-in-One Health & Productivity Companion
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                Take Control of
              </span>
              <br />
              <span className="text-foreground">Your Daily Goals</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Track calories, monitor weight, manage tasks, set goals, and build exercise habits — 
              all in one beautiful, intuitive app designed to help you succeed.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white text-lg px-8 py-6 rounded-xl shadow-lg">
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-5 w-5" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need to
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Succeed</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to help you build better habits and achieve your health goals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-card">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Why Choose
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> GoalGrip?</span>
              </h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Smartphone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Install as Mobile App</h3>
                    <p className="text-muted-foreground">Works offline and can be installed on your phone like a native app.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Visual Progress Tracking</h3>
                    <p className="text-muted-foreground">Beautiful charts and graphs to visualize your journey over time.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Daily Streak Motivation</h3>
                    <p className="text-muted-foreground">Build habits with our streak system that keeps you motivated.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Secure & Private</h3>
                    <p className="text-muted-foreground">Your data is encrypted and synced securely across all devices.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl"></div>
              <Card className="relative bg-card border-0 shadow-2xl">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                          <Utensils className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                          <div className="font-medium">Today's Calories</div>
                          <div className="text-sm text-muted-foreground">1,850 / 2,200 kcal</div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-primary">84%</div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                          <CheckSquare className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <div className="font-medium">Tasks Completed</div>
                          <div className="text-sm text-muted-foreground">5 of 7 tasks done</div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-green-500">71%</div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                          <Flame className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                          <div className="font-medium">Current Streak</div>
                          <div className="text-sm text-muted-foreground">Keep it going!</div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-amber-500">12 🔥</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 bg-gradient-to-r from-primary to-accent overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0tNiA2aC0ydi00aDJ2NHptMC02aC0ydi00aDJ2NHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
            <CardContent className="relative p-8 sm:p-12 text-center text-white">
              <div className="flex justify-center mb-6">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">
                      <Star className="h-4 w-4 text-amber-300 fill-amber-300" />
                    </div>
                  ))}
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to Transform Your Life?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                Join thousands of users who are already achieving their goals with GoalGrip. 
                Start your journey today — it's completely free!
              </p>
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="text-primary font-semibold text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all">
                  Create Free Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Target className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                GoalGrip
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} GoalGrip. Built with ❤️ for your success.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
