import { supabase } from "@/integrations/supabase/client";

export const seedStocks = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('seed-stocks');
    
    if (error) {
      console.error('Error seeding stocks:', error);
      return { success: false, error };
    }
    
    console.log('Stocks seeded successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error calling seed function:', error);
    return { success: false, error };
  }
};