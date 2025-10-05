import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { stockSymbol, stockName, currentPrice, changePercent, analysisType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    
    if (analysisType === 'news') {
      systemPrompt = `You are a financial news analyst specializing in Indian stock markets. Generate realistic, recent news and events for ${stockName} (${stockSymbol}). Include:
- 3-5 news items with dates from the last week
- Each news item should have: title, brief content, source, sentiment (positive/negative/neutral), and date
- Make news relevant to current price (₹${currentPrice}) and change (${changePercent}%)
- Format as JSON array with fields: title, content, source, sentiment, date`;
    } else if (analysisType === 'prediction') {
      systemPrompt = `You are an expert stock analyst specializing in technical and fundamental analysis of Indian stocks. For ${stockName} (${stockSymbol}):
- Current Price: ₹${currentPrice}
- 24h Change: ${changePercent}%

Provide detailed prediction analysis including:
1. Short-term outlook (1-5 days)
2. Medium-term outlook (1-3 months)
3. Key support and resistance levels
4. Technical indicators analysis
5. Risk factors
6. Confidence score (0-100)

Format as JSON with: prediction, timeframe, supportLevel, resistanceLevel, technicalSignals, riskFactors, confidenceScore`;
    } else {
      systemPrompt = `You are a comprehensive stock market analyst. Provide detailed analysis for ${stockName} (${stockSymbol}) including technical patterns, trend analysis, and structural insights.`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze ${stockName} (${stockSymbol})` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisResult = data.choices[0].message.content;

    return new Response(JSON.stringify({ analysis: analysisResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in stock-analysis:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});