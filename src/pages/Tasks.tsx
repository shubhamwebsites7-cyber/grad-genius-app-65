import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Trash2, Loader2 } from 'lucide-react';

interface Todo {
  id: string;
  title: string;
  notes: string | null;
  is_completed: boolean;
  priority: string;
  due_date: string | null;
  created_at: string;
}

const Tasks = () => {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all');

  const load = async () => {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('is_completed', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setTodos((data as Todo[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;
    const { error } = await supabase.from('todos').insert({
      user_id: user.id,
      title: title.trim(),
      priority,
      due_date: dueDate || null,
    });
    if (error) return toast.error(error.message);
    setTitle('');
    setDueDate('');
    setPriority('medium');
    load();
  };

  const toggle = async (todo: Todo) => {
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, is_completed: !t.is_completed } : t)));
    const { error } = await supabase
      .from('todos')
      .update({ is_completed: !todo.is_completed })
      .eq('id', todo.id);
    if (error) {
      toast.error(error.message);
      load();
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (error) return toast.error(error.message);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const visible = todos.filter((t) =>
    filter === 'all' ? true : filter === 'active' ? !t.is_completed : t.is_completed
  );
  const remaining = todos.filter((t) => !t.is_completed).length;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>My Tasks — TaskFlow</title>
        <meta name="description" content="Add, complete and organise your personal tasks in TaskFlow." />
      </Helmet>
      <AppHeader />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <p className="text-sm text-muted-foreground">{remaining} task{remaining === 1 ? '' : 's'} left to do</p>

        <Card className="mt-6">
          <CardContent className="pt-6">
            <form onSubmit={addTodo} className="flex flex-col gap-3 sm:flex-row">
              <Input
                placeholder="What needs doing?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1"
              />
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="sm:w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="sm:w-40" />
              <Button type="submit">Add</Button>
            </form>
          </CardContent>
        </Card>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mt-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="done">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mt-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : visible.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Nothing here yet.</p>
          ) : (
            visible.map((todo) => (
              <Card key={todo.id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <Checkbox checked={todo.is_completed} onCheckedChange={() => toggle(todo)} />
                  <div className="min-w-0 flex-1">
                    <p className={todo.is_completed ? 'truncate line-through text-muted-foreground' : 'truncate'}>
                      {todo.title}
                    </p>
                    {todo.due_date && (
                      <p className="text-xs text-muted-foreground">
                        Due {new Date(todo.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Badge variant={todo.priority === 'high' ? 'destructive' : 'secondary'}>{todo.priority}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => remove(todo.id)} aria-label="Delete task">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Tasks;
