import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/AppHeader';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle2, ListChecks, Clock } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>TaskFlow — Simple Task & To-Do Manager</title>
        <meta name="description" content="TaskFlow helps you capture tasks, set priorities and due dates, and finish what matters. Free, fast and private." />
        <meta property="og:title" content="TaskFlow — Simple Task & To-Do Manager" />
        <meta property="og:description" content="Capture tasks, set priorities and due dates, and finish what matters." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <AppHeader />
      <main className="container mx-auto px-4 py-16">
        <section className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Get your day done, one task at a time
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Capture everything on your mind, set priorities and due dates, and check things off.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button size="lg" asChild>
              <Link to={user ? '/tasks' : '/auth'}>{user ? 'Open my tasks' : 'Get started free'}</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-3">
          {[
            { icon: ListChecks, title: 'Organised lists', text: 'Group tasks by priority and see what is left.' },
            { icon: Clock, title: 'Due dates', text: 'Never lose track of a deadline again.' },
            { icon: CheckCircle2, title: 'Instant sync', text: 'Your tasks are saved securely to your account.' },
          ].map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-lg border border-border bg-card p-6">
              <Icon className="h-6 w-6 text-primary" />
              <h2 className="mt-3 font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
};

export default Index;
