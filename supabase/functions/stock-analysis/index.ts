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
    let userPrompt = '';
    
    if (analysisType === 'news') {
      systemPrompt = `You are a financial news analyst. You MUST respond with ONLY valid JSON, no markdown, no code blocks, no explanations.`;
      userPrompt = `Generate 3-5 realistic news items for ${stockName} (${stockSymbol}) with current price ₹${currentPrice} and change ${changePercent}%. 
      
Return ONLY a JSON array in this EXACT format:
[
  {
    "title": "News headline here",
    "content": "Brief news content here",
    "source": "News source name",
    "sentiment": "positive",
    "date": "2025-10-04"
  }
]

Remember: Return ONLY the JSON array, nothing else.`;
    } else if (analysisType === 'prediction') {
      systemPrompt = `You are a stock analyst. You MUST respond with ONLY valid JSON, no markdown, no code blocks, no explanations.`;
      userPrompt = `Analyze ${stockName} (${stockSymbol}) with current price ₹${currentPrice} and change ${changePercent}%.

Return ONLY a JSON object in this EXACT format:
{
  "prediction": "Short prediction text here",
  "timeframe": "1-5 days",
  "supportLevel": ${Math.round(currentPrice * 0.95)},
  "resistanceLevel": ${Math.round(currentPrice * 1.05)},
  "technicalSignals": ["Signal 1", "Signal 2", "Signal 3"],
  "riskFactors": ["Risk 1", "Risk 2"],
  "confidenceScore": 75
}

Remember: Return ONLY the JSON object, nothing else.`;
    } else {
      systemPrompt = `You are a stock analyst. Return only valid JSON.`;
      userPrompt = `Analyze ${stockName} (${stockSymbol})`;
    }

    console.log('Calling AI with analysis type:', analysisType);
    
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
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    let analysisResult = data.choices[0].message.content;
    
    console.log('Raw AI response:', analysisResult);
    
    // Clean up the response - remove markdown code blocks if present
    analysisResult = analysisResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Validate it's valid JSON
    try {
      JSON.parse(analysisResult);
    } catch (parseError) {
      console.error('Invalid JSON from AI:', analysisResult);
      throw new Error('AI returned invalid JSON format');
    }

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