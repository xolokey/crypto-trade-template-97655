import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { LogOut, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStocks } from "@/hooks/useStocks";
import { seedStocks } from "@/lib/seedStocks";
import AIEnhancedDashboard from "@/components/dashboard/AIEnhancedDashboard";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { refreshStocks } = useStocks();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/auth");
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Initialize stocks and refresh every 30 seconds
  useEffect(() => {
    if (user) {
      const initializeStocks = async () => {
        // Check if we need to seed stocks
        const { data: existingStocks } = await supabase
          .from("stocks")
          .select("id")
          .limit(1);

        if (!existingStocks || existingStocks.length === 0) {
          toast({
            title: "Initializing stock data...",
            description: "Setting up Nifty 50 and Sensex 30 stocks",
          });
          await seedStocks();
        }
        
        refreshStocks();
      };
      
      initializeStocks();
      const interval = setInterval(refreshStocks, 30000);
      return () => clearInterval(interval);
    }
  }, [user, refreshStocks, toast]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Lokey & C0.</h1>
              <p className="text-xs text-muted-foreground">AI-Powered Stock Market</p>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* AI Enhanced Dashboard */}
      <AIEnhancedDashboard />
    </div>
  );
}