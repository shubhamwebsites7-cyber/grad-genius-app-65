import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./pages/ProtectedRoute";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import Privacy from "./pages/Privacy";
import Todo from "./pages/Todo";
import Goals from "./pages/Goals";
import Pomodoro from "./pages/Pomodoro";
import Leaderboard from "./pages/Leaderboard";
import AdminTasks from "./pages/AdminTasks";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Todo />} />
            <Route path="todo" element={<Todo />} />
            <Route path="goals" element={<Goals />} />
            <Route path="pomodoro" element={<Pomodoro />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="admin-tasks" element={<AdminTasks />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
