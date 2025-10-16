import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, SearchX } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <title>404 - Page Not Found | Examtrakr</title>
        <meta name="description" content="The page you're looking for doesn't exist." />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navigation />
        
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-2xl w-full text-center space-y-8">
            {/* 404 Icon */}
            <div className="relative">
              <SearchX className="h-32 w-32 mx-auto text-muted-foreground/40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-8xl font-bold text-primary/20">404</span>
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Page Not Found
              </h1>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Oops! The page you're looking for doesn't exist or has been moved.
              </p>
              {location.pathname && (
                <p className="text-sm text-muted-foreground font-mono bg-muted px-4 py-2 rounded-lg inline-block">
                  {location.pathname}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                variant="hero" 
                size="lg"
                asChild
                className="w-full sm:w-auto min-w-[160px]"
              >
                <Link to="/">
                  <Home className="h-5 w-5 mr-2" />
                  Go to Home
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate(-1)}
                className="w-full sm:w-auto min-w-[160px]"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Go Back
              </Button>
            </div>

            {/* Help Text */}
            <div className="pt-8 border-t">
              <p className="text-sm text-muted-foreground">
                Need help? Visit our{" "}
                <Link to="/support" className="text-primary hover:underline font-medium">
                  Support Page
                </Link>{" "}
                or explore our{" "}
                <Link to="/exams" className="text-primary hover:underline font-medium">
                  Available Exams
                </Link>
              </p>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default NotFound;
