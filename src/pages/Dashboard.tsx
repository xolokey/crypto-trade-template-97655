import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Search, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StockCard } from "@/components/stocks/StockCard";
import { Watchlist } from "@/components/stocks/Watchlist";
import { useStocks } from "@/hooks/useStocks";
import { seedStocks } from "@/lib/seedStocks";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    niftyStocks,
    sensexStocks,
    searchResults,
    searchStocks,
    loading,
    refreshStocks,
  } = useStocks();

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

  // Refresh stocks every 30 seconds
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      searchStocks(searchQuery.trim());
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
              <p className="text-xs text-muted-foreground">Indian Stock Market</p>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="container py-8 px-4 max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back</h2>
          <p className="text-muted-foreground">Track your favorite Indian stocks and get AI-powered insights</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search stocks by name or symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-card/50 backdrop-blur border-border/50"
            />
          </div>
        </form>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Search Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {searchResults.map((stock) => (
                <StockCard key={stock.id} stock={stock} />
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="nifty" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-card/50 backdrop-blur">
            <TabsTrigger value="nifty">Nifty 50</TabsTrigger>
            <TabsTrigger value="sensex">Sensex 30</TabsTrigger>
            <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          </TabsList>

          <TabsContent value="nifty" className="mt-6">
            <h2 className="text-2xl font-bold mb-6">Nifty 50 Stocks</h2>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading stocks...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {niftyStocks.map((stock) => (
                  <StockCard key={stock.id} stock={stock} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sensex" className="mt-6">
            <h2 className="text-2xl font-bold mb-6">Sensex 30 Stocks</h2>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading stocks...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sensexStocks.map((stock) => (
                  <StockCard key={stock.id} stock={stock} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="watchlist" className="mt-6">
            <Watchlist userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}