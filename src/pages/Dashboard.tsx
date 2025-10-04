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
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Lokey & C0.</h1>
          </div>
          <Button onClick={handleSignOut} variant="outline" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="container py-8 px-4">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search stocks by name or symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Search Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((stock) => (
                <StockCard key={stock.id} stock={stock} />
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="nifty" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="nifty">Nifty 50</TabsTrigger>
            <TabsTrigger value="sensex">Sensex 30</TabsTrigger>
            <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          </TabsList>

          <TabsContent value="nifty" className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Nifty 50 Stocks</h2>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading stocks...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {niftyStocks.map((stock) => (
                  <StockCard key={stock.id} stock={stock} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sensex" className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Sensex 30 Stocks</h2>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading stocks...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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