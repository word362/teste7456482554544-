import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, artist } = await req.json();
    
    if (!title || !artist) {
      return new Response(
        JSON.stringify({ error: 'Título e artista são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar cache
    const cacheKey = `lyrics:${title.toLowerCase()}:${artist.toLowerCase()}`;
    const { data: cached } = await supabase
      .from('search_cache')
      .select('results')
      .eq('query', cacheKey)
      .single();

    if (cached?.results) {
      console.log('✅ Letra encontrada no cache');
      return new Response(
        JSON.stringify({ lyrics: cached.results.lyrics }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar letra usando Lovable AI
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    console.log(`🎵 Buscando letra: ${title} - ${artist}`);
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente especializado em encontrar letras de músicas. Retorne apenas a letra completa da música solicitada, sem comentários adicionais, prefácios ou explicações. Se não encontrar a letra exata, retorne "Letra não encontrada".'
          },
          {
            role: 'user',
            content: `Encontre a letra completa da música "${title}" do artista "${artist}". Retorne apenas a letra, formatada com quebras de linha entre as estrofes.`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ Erro na API Lovable AI:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos ao seu workspace Lovable.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error('Erro ao buscar letra com Lovable AI');
    }

    const aiData = await aiResponse.json();
    const lyrics = aiData.choices?.[0]?.message?.content || 'Letra não encontrada';

    // Salvar no cache
    await supabase
      .from('search_cache')
      .upsert({
        query: cacheKey,
        results: { lyrics, title, artist }
      }, {
        onConflict: 'query'
      });

    console.log('✅ Letra encontrada e salva no cache');

    return new Response(
      JSON.stringify({ lyrics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro em buscar-letra:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        lyrics: 'Erro ao buscar letra. Tente novamente mais tarde.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
