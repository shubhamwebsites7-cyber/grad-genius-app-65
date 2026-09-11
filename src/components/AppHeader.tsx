import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CheckCircle2 } from 'lucide-react';

export const AppHeader = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-border bg-card/60 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          TaskFlow
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild><Link to="/tasks">My Tasks</Link></Button>
              {isAdmin && (
                <Button variant="ghost" size="sm" asChild><Link to="/admin">Admin</Link></Button>
              )}
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={async () => { await signOut(); navigate('/auth'); }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Button size="sm" asChild><Link to="/auth">Sign in</Link></Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
