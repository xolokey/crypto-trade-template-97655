import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '@/config/env';

// Initialize Gemini AI
let genAI: GoogleGenerativeAI | null = null;

if (env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
}

// Try multiple model names in order of preference
const MODEL_NAMES = [
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-pro-latest', 
  'gemini-1.5-pro',
  'gemini-pro'
];

let cachedModelName: string | null = null;

export const getGeminiModel = async () => {
  if (!genAI) {
    throw new Error('Gemini API key not configured');
  }
  
  // If we already found a working model, use it
  if (cachedModelName) {
    return genAI.getGenerativeModel({ model: cachedModelName });
  }
  
  // Try each model until one works
  for (const modelName of MODEL_NAMES) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      // Test if the model is accessible
      console.log(`Trying model: ${modelName}`);
      cachedModelName = modelName;
      console.log(`✅ Successfully using model: ${modelName}`);
      return model;
    } catch (error) {
      console.log(`❌ Model ${modelName} not available, trying next...`);
      continue;
    }
  }
  
  // If all fail, default to gemini-pro
  console.log('Using fallback model: gemini-pro');
  cachedModelName = 'gemini-pro';
  return genAI.getGenerativeModel({ model: 'gemini-pro' });
};

export const isGeminiAvailable = () => {
  return !!env.GEMINI_API_KEY && !!genAI;
};

// Stock analysis prompt templates
export const STOCK_ANALYSIS_PROMPTS = {
  technical: (stockData: any) => `
    Analyze the technical indicators for ${stockData.symbol} (${stockData.name}):
    Current Price: ₹${stockData.price}
    Day Change: ${stockData.change}%
    Volume: ${stockData.volume}
    52W High: ₹${stockData.high52w}
    52W Low: ₹${stockData.low52w}
    
    Provide a concise technical analysis including:
    1. Price trend analysis
    2. Support and resistance levels
    3. Volume analysis
    4. Short-term outlook (1-2 weeks)
    
    Keep the response under 200 words and focus on actionable insights.
  `,
  
  fundamental: (stockData: any) => `
    Provide fundamental analysis for ${stockData.symbol} (${stockData.name}):
    Current Price: ₹${stockData.price}
    Market Cap: ${stockData.marketCap}
    P/E Ratio: ${stockData.pe}
    Sector: ${stockData.sector}
    
    Analyze:
    1. Company's financial health
    2. Sector performance
    3. Growth prospects
    4. Investment recommendation
    
    Keep the response under 200 words and provide clear investment guidance.
  `,
  
  news: (stockData: any, newsItems: any[]) => `
    Analyze the impact of recent news on ${stockData.symbol}:
    Current Price: ₹${stockData.price}
    
    Recent News:
    ${newsItems.map(item => `- ${item.title}`).join('\n')}
    
    Provide:
    1. News sentiment analysis
    2. Potential price impact
    3. Key factors to watch
    4. Risk assessment
    
    Keep the response under 200 words and focus on market implications.
  `
};

export const generateStockAnalysis = async (
  type: keyof typeof STOCK_ANALYSIS_PROMPTS,
  stockData: any,
  additionalData?: any
) => {
  if (!isGeminiAvailable()) {
    throw new Error('Gemini AI is not available. Please configure VITE_GEMINI_API_KEY.');
  }

  try {
    const model = await getGeminiModel();
    const prompt = STOCK_ANALYSIS_PROMPTS[type](stockData, additionalData);
    
    console.log('Generating analysis for:', stockData.symbol, 'Type:', type);
    console.log('Using model:', cachedModelName || 'gemini-pro');
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log('✅ Analysis generated successfully');
    return text;
  } catch (error: any) {
    console.error('Gemini API error details:', {
      message: error?.message,
      status: error?.status,
      statusText: error?.statusText,
      error: error
    });
    
    // Provide more specific error messages
    if (error?.message?.includes('API key') || error?.message?.includes('API_KEY')) {
      throw new Error('Invalid Gemini API key. Get a new one at: https://makersuite.google.com/app/apikey');
    } else if (error?.message?.includes('quota') || error?.message?.includes('QUOTA')) {
      throw new Error('API quota exceeded. Please try again later or upgrade your plan.');
    } else if (error?.message?.includes('blocked') || error?.message?.includes('BLOCKED')) {
      throw new Error('Content was blocked by safety filters. Try a different stock.');
    } else if (error?.message?.includes('404') || error?.message?.includes('not found')) {
      throw new Error('Gemini API model not accessible. Your API key may need to be regenerated. Visit: https://makersuite.google.com/app/apikey');
    } else if (error?.message?.includes('403') || error?.message?.includes('permission')) {
      throw new Error('Permission denied. Please regenerate your API key at: https://makersuite.google.com/app/apikey');
    } else {
      throw new Error(`Failed to generate analysis: ${error?.message || 'Unknown error'}. Try regenerating your API key.`);
    }
  }
};

export const generatePortfolioInsights = async (portfolioData: any[]) => {
  if (!isGeminiAvailable()) {
    throw new Error('Gemini AI is not available. Please configure VITE_GEMINI_API_KEY.');
  }

  const prompt = `
    Analyze this stock portfolio and provide insights:
    
    Portfolio Holdings:
    ${portfolioData.map(stock => 
      `${stock.symbol}: ₹${stock.price} (${stock.change}% change, ${stock.quantity} shares)`
    ).join('\n')}
    
    Total Portfolio Value: ₹${portfolioData.reduce((sum, stock) => sum + (stock.price * stock.quantity), 0)}
    
    Provide:
    1. Portfolio diversification analysis
    2. Risk assessment
    3. Performance summary
    4. Rebalancing recommendations
    5. Top 3 actionable insights
    
    Keep the response under 300 words and focus on practical advice.
  `;

  try {
    const model = await getGeminiModel();
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to generate portfolio insights. Please try again.');
  }
};