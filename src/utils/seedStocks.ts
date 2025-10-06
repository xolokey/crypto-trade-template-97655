import { supabase } from '@/integrations/supabase/client';
import { nseStocks } from '@/data/nseStocks';

export const seedStocksDatabase = async () => {
  try {
    console.log('Starting to seed stocks database...');
    
    // Check if stocks already exist
    const { data: existingStocks, error: checkError } = await supabase
      .from('stocks')
      .select('symbol')
      .limit(50);

    if (checkError) {
      console.error('Error checking existing stocks:', checkError);
      throw checkError;
    }

    // If we already have many stocks, skip seeding
    if (existingStocks && existingStocks.length > 50) {
      console.log('Stocks already seeded, skipping...');
      return { success: true, message: 'Database already contains stocks' };
    }

    // Prepare stock data for insertion
    const stocksToInsert = nseStocks.map(stock => ({
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      exchange: 'NSE',
      is_nifty_50: stock.isNifty50 || false,
      is_sensex_30: stock.isSensex30 || false,
      market_cap: null, // Will be updated with real-time data
      current_price: null, // Will be updated with real-time data
      change_percent: null // Will be updated with real-time data
    }));

    // Insert in batches to avoid timeout
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < stocksToInsert.length; i += batchSize) {
      const batch = stocksToInsert.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('stocks')
        .upsert(batch, { 
          onConflict: 'symbol',
          ignoreDuplicates: true 
        });

      if (insertError) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError);
        // Continue with next batch even if one fails
        continue;
      }

      insertedCount += batch.length;
      console.log(`Inserted batch ${i / batchSize + 1}, total: ${insertedCount} stocks`);
    }

    console.log(`Successfully seeded ${insertedCount} stocks!`);
    return { 
      success: true, 
      message: `Successfully seeded ${insertedCount} stocks`,
      count: insertedCount 
    };

  } catch (error) {
    console.error('Error seeding stocks:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error',
      error 
    };
  }
};
