import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MusicResult {
  id: string
  title: string
  artist: string
  thumbnail: string
  videoId: string
}

// Validação de input com zod
const querySchema = z.string().min(1).max(200);

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Ler query do body JSON
    const { query } = await req.json()

    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Query é obrigatória' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validar query com zod
    const validatedQuery = querySchema.parse(query.trim());

    console.log(`🔍 Buscando por: "${validatedQuery}"`)

    // Criar cliente Supabase com service role para acessar cache
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Verificar cache primeiro (otimização de velocidade)
    const { data: cachedData } = await supabase
      .from('search_cache')
      .select('results, updated_at')
      .eq('query', validatedQuery.toLowerCase())
      .single()

    // Cache válido por 24 horas
    if (cachedData) {
      const cacheAge = Date.now() - new Date(cachedData.updated_at).getTime()
      const oneDayMs = 24 * 60 * 60 * 1000
      
      if (cacheAge < oneDayMs) {
        console.log('✅ Cache hit! Retornando dados em cache')
        return new Response(
          JSON.stringify({ 
            results: cachedData.results,
            fromCache: true 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // 2. Cache miss ou expirado - fazer scraping do YouTube
    console.log('🤖 Cache miss. Fazendo scraping do YouTube...')
    
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(validatedQuery + ' música')}`
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      }
    })

    if (!response.ok) {
      throw new Error(`YouTube retornou status ${response.status}`)
    }

    const html = await response.text()

    // Extrair dados do JSON embutido no HTML do YouTube
    const ytInitialDataMatch = html.match(/var ytInitialData = ({.*?});/)
    
    if (!ytInitialDataMatch) {
      console.error('❌ Não foi possível encontrar ytInitialData no HTML')
      throw new Error('Falha ao extrair dados do YouTube')
    }

    const ytData = JSON.parse(ytInitialDataMatch[1])
    
    // Navegar pela estrutura do YouTube para encontrar vídeos
    const contents = ytData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || []
    
    const results: MusicResult[] = []
    
    for (const section of contents) {
      const items = section?.itemSectionRenderer?.contents || []
      
      for (const item of items) {
        const videoRenderer = item?.videoRenderer
        
        if (videoRenderer && results.length < 20) {
          const videoId = videoRenderer.videoId
          const title = videoRenderer.title?.runs?.[0]?.text || ''
          const channelName = videoRenderer.ownerText?.runs?.[0]?.text || 'Artista Desconhecido'
          
          // Pegar thumbnail de melhor qualidade
          const thumbnails = videoRenderer.thumbnail?.thumbnails || []
          const thumbnail = thumbnails[thumbnails.length - 1]?.url || ''
          
          results.push({
            id: videoId,
            title: title,
            artist: channelName,
            thumbnail: thumbnail.split('?')[0], // Remover parâmetros da URL
            videoId: videoId,
          })
        }
      }
    }

    console.log(`✅ Encontrados ${results.length} resultados`)

    // 3. Salvar no cache (se houver resultados)
    if (results.length > 0) {
      await supabase
        .from('search_cache')
        .upsert({
          query: validatedQuery.toLowerCase(),
          results
        }, {
          onConflict: 'query'
        })
      
      console.log(`✅ ${results.length} resultados salvos no cache`)
    }

    return new Response(
      JSON.stringify({ results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Erro:', error)
    
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Query inválida', details: error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar músicas';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
