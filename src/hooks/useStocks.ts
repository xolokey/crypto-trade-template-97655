import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Stock {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  current_price: number;
  change_percent: number;
  volume: number;
  is_nifty_50: boolean;
  is_sensex_30: boolean;
}

export const useStocks = () => {
  const [niftyStocks, setNiftyStocks] = useState<Stock[]>([]);
  const [sensexStocks, setSensexStocks] = useState<Stock[]>([]);
  const [searchResults, setSearchResults] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshStocks = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch Nifty 50
      const { data: nifty } = await supabase
        .from("stocks")
        .select("*")
        .eq("is_nifty_50", true)
        .order("symbol");

      // Fetch Sensex 30
      const { data: sensex } = await supabase
        .from("stocks")
        .select("*")
        .eq("is_sensex_30", true)
        .order("symbol");

      setNiftyStocks(nifty || []);
      setSensexStocks(sensex || []);
    } catch (error) {
      console.error("Error fetching stocks:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchStocks = useCallback(async (query: string) => {
    try {
      const { data } = await supabase
        .from("stocks")
        .select("*")
        .or(`symbol.ilike.%${query}%,name.ilike.%${query}%`)
        .limit(20);

      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching stocks:", error);
      setSearchResults([]);
    }
  }, []);

  return {
    niftyStocks,
    sensexStocks,
    searchResults,
    searchStocks,
    loading,
    refreshStocks,
  };
};