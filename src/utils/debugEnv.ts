// Debug utility to check environment variables
export const debugEnvironment = () => {
  console.group('🔍 Environment Variables Debug');
  
  console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing');
  console.log('Gemini API Key:', import.meta.env.VITE_GEMINI_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('Alpha Vantage Key:', import.meta.env.VITE_ALPHA_VANTAGE_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('Twelve Data Key:', import.meta.env.VITE_TWELVE_DATA_API_KEY ? '✅ Set' : '❌ Missing');
  
  // Show first few characters of keys (for debugging)
  if (import.meta.env.VITE_GEMINI_API_KEY) {
    console.log('Gemini Key Preview:', import.meta.env.VITE_GEMINI_API_KEY.substring(0, 10) + '...');
  }
  if (import.meta.env.VITE_ALPHA_VANTAGE_API_KEY) {
    console.log('Alpha Vantage Key Preview:', import.meta.env.VITE_ALPHA_VANTAGE_API_KEY.substring(0, 10) + '...');
  }
  if (import.meta.env.VITE_TWELVE_DATA_API_KEY) {
    console.log('Twelve Data Key Preview:', import.meta.env.VITE_TWELVE_DATA_API_KEY.substring(0, 10) + '...');
  }
  
  console.groupEnd();
};

// Test API availability
export const testAPIAvailability = async () => {
  console.group('🧪 Testing API Availability');
  
  // Test Gemini
  if (import.meta.env.VITE_GEMINI_API_KEY) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      console.log('Gemini AI:', '✅ Initialized');
    } catch (error) {
      console.error('Gemini AI:', '❌ Error -', error);
    }
  } else {
    console.log('Gemini AI:', '⚠️ No API key');
  }
  
  // Test Alpha Vantage
  if (import.meta.env.VITE_ALPHA_VANTAGE_API_KEY) {
    try {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=RELIANCE.NS&apikey=${import.meta.env.VITE_ALPHA_VANTAGE_API_KEY}`
      );
      const data = await response.json();
      if (data['Global Quote']) {
        console.log('Alpha Vantage:', '✅ Working');
      } else if (data.Note) {
        console.log('Alpha Vantage:', '⚠️ Rate limit reached');
      } else {
        console.log('Alpha Vantage:', '❌ Invalid response', data);
      }
    } catch (error) {
      console.error('Alpha Vantage:', '❌ Error -', error);
    }
  } else {
    console.log('Alpha Vantage:', '⚠️ No API key');
  }
  
  // Test Twelve Data
  if (import.meta.env.VITE_TWELVE_DATA_API_KEY) {
    try {
      const response = await fetch(
        `https://api.twelvedata.com/quote?symbol=RELIANCE.NS&apikey=${import.meta.env.VITE_TWELVE_DATA_API_KEY}`
      );
      const data = await response.json();
      if (data.symbol) {
        console.log('Twelve Data:', '✅ Working');
      } else if (data.status === 'error') {
        console.log('Twelve Data:', '❌ Error -', data.message);
      } else {
        console.log('Twelve Data:', '❌ Invalid response', data);
      }
    } catch (error) {
      console.error('Twelve Data:', '❌ Error -', error);
    }
  } else {
    console.log('Twelve Data:', '⚠️ No API key');
  }
  
  console.groupEnd();
};