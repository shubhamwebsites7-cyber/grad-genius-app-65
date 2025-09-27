import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./pages/ProtectedRoute";
import { EnvCheck } from "./components/EnvCheck";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import CalendarView from "./pages/CalendarView";
import Weight from "./pages/Weight";
import Todo from "./pages/Todo";
import Goals from "./pages/Goals";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <EnvCheck />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<CalendarView />} />
              <Route path="calories" element={<CalendarView />} />
              <Route path="weight" element={<Weight />} />
              <Route path="todo" element={<Todo />} />
              <Route path="goals" element={<Goals />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
