import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const NotFound = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
    <h1 className="text-3xl font-bold">Page not found</h1>
    <p className="mt-2 text-muted-foreground">The page you are looking for does not exist.</p>
    <Button className="mt-6" asChild><Link to="/">Back home</Link></Button>
  </div>
);

export default NotFound;
