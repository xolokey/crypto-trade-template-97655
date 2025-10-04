import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Sample Nifty 50 stocks with realistic data
const nifty50Stocks = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd', sector: 'Oil & Gas', price: 2456.75, change: 1.25 },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services Ltd', sector: 'IT', price: 3845.20, change: -0.35 },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', sector: 'Banking', price: 1672.90, change: 0.85 },
  { symbol: 'INFY.NS', name: 'Infosys Ltd', sector: 'IT', price: 1456.30, change: 1.15 },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Ltd', sector: 'Banking', price: 1089.45, change: -0.42 },
  { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever Ltd', sector: 'FMCG', price: 2567.80, change: 0.65 },
  { symbol: 'ITC.NS', name: 'ITC Ltd', sector: 'FMCG', price: 456.25, change: 1.82 },
  { symbol: 'SBIN.NS', name: 'State Bank of India', sector: 'Banking', price: 623.15, change: 2.10 },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd', sector: 'Telecom', price: 1523.40, change: -0.28 },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance Ltd', sector: 'Finance', price: 6845.90, change: 1.45 },
];

// Sample Sensex 30 stocks
const sensex30Stocks = [
  { symbol: 'RELIANCE.BO', name: 'Reliance Industries Ltd', sector: 'Oil & Gas', price: 2456.75, change: 1.25 },
  { symbol: 'TCS.BO', name: 'Tata Consultancy Services Ltd', sector: 'IT', price: 3845.20, change: -0.35 },
  { symbol: 'HDFCBANK.BO', name: 'HDFC Bank Ltd', sector: 'Banking', price: 1672.90, change: 0.85 },
  { symbol: 'INFY.BO', name: 'Infosys Ltd', sector: 'IT', price: 1456.30, change: 1.15 },
  { symbol: 'ICICIBANK.BO', name: 'ICICI Bank Ltd', sector: 'Banking', price: 1089.45, change: -0.42 },
  { symbol: 'HINDUNILVR.BO', name: 'Hindustan Unilever Ltd', sector: 'FMCG', price: 2567.80, change: 0.65 },
  { symbol: 'ITC.BO', name: 'ITC Ltd', sector: 'FMCG', price: 456.25, change: 1.82 },
  { symbol: 'SBIN.BO', name: 'State Bank of India', sector: 'Banking', price: 623.15, change: 2.10 },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting to seed stocks...')

    // Insert Nifty 50 stocks
    for (const stock of nifty50Stocks) {
      const { error } = await supabaseClient
        .from('stocks')
        .upsert({
          symbol: stock.symbol,
          name: stock.name,
          exchange: 'NSE',
          sector: stock.sector,
          current_price: stock.price,
          change_percent: stock.change,
          volume: Math.floor(Math.random() * 10000000) + 1000000,
          is_nifty_50: true,
          is_sensex_30: false,
          last_updated: new Date().toISOString(),
        }, {
          onConflict: 'symbol',
        })

      if (error) {
        console.error(`Error inserting ${stock.symbol}:`, error)
      } else {
        console.log(`Inserted/Updated: ${stock.symbol}`)
      }
    }

    // Insert Sensex 30 stocks
    for (const stock of sensex30Stocks) {
      const { error } = await supabaseClient
        .from('stocks')
        .upsert({
          symbol: stock.symbol,
          name: stock.name,
          exchange: 'BSE',
          sector: stock.sector,
          current_price: stock.price,
          change_percent: stock.change,
          volume: Math.floor(Math.random() * 10000000) + 1000000,
          is_nifty_50: false,
          is_sensex_30: true,
          last_updated: new Date().toISOString(),
        }, {
          onConflict: 'symbol',
        })

      if (error) {
        console.error(`Error inserting ${stock.symbol}:`, error)
      } else {
        console.log(`Inserted/Updated: ${stock.symbol}`)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Stocks seeded successfully',
        nifty50Count: nifty50Stocks.length,
        sensex30Count: sensex30Stocks.length,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})