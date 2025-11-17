import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Limpa o título removendo termos desnecessários
 */
function cleanTitle(title: string, artist: string): string {
  let cleaned = title;
  
  // Remove o nome do artista se estiver no início
  const artistLower = artist.toLowerCase();
  if (cleaned.toLowerCase().startsWith(artistLower)) {
    cleaned = cleaned.substring(artist.length).trim();
  }
  
  // Remove separadores iniciais
  cleaned = cleaned.replace(/^[\-\|\s]+/, '').trim();
  
  // Remove termos comuns
  const termsToRemove = [
    /\(clipe oficial\)/gi,
    /\(clipe\)/gi,
    /\(official video\)/gi,
    /\(official audio\)/gi,
    /\(official\)/gi,
    /\[official video\]/gi,
    /\[official audio\]/gi,
    /\[official\]/gi,
    /feat\.?\s+[^)]+/gi,
    /ft\.?\s+[^)]+/gi,
    /featuring\s+[^)]+/gi,
    /\s*-\s*topic/gi,
    /vevo/gi,
    /\s*\|\s*/g,
    /\s*\/\s*/g,
  ];
  
  for (const term of termsToRemove) {
    cleaned = cleaned.replace(term, '');
  }
  
  return cleaned.trim();
}

/**
 * Limpa o nome do artista removendo termos desnecessários
 */
function cleanArtist(artist: string): string {
  let cleaned = artist;
  
  const termsToRemove = [
    /oficial/gi,
    /official/gi,
    /vevo/gi,
    /\s*-\s*topic/gi,
  ];
  
  for (const term of termsToRemove) {
    cleaned = cleaned.replace(term, '');
  }
  
  return cleaned.trim();
}

/**
 * Cria slug para URL
 */
function createSlug(text: string): string {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .replace(/\s+/g, '-');
}

async function buscarVagalume(artist: string, title: string): Promise<string | null> {
  const cleanArt = cleanArtist(artist);
  const cleanTit = cleanTitle(title, artist);
  
  // Tentativa 1: artista limpo + título limpo
  const urls = [
    `https://www.vagalume.com.br/${createSlug(cleanArt)}/${createSlug(cleanTit)}.html`,
    `https://www.vagalume.com.br/${createSlug(cleanArt + ' ' + cleanTit)}.html`,
    `https://www.vagalume.com.br/${createSlug(cleanTit)}.html`,
    `https://www.vagalume.com.br/${createSlug(artist + ' ' + title)}.html`,
  ];
  
  for (let i = 0; i < urls.length; i++) {
    try {
      const url = urls[i];
      console.log(`Vagalume tentativa ${i + 1}:`, url);
      
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      
      if (!response.ok) {
        console.log(`Vagalume tentativa ${i + 1} falhou: ${response.status}`);
        continue;
      }
      
      const html = await response.text();
      const match = html.match(/<div[^>]*id="lyrics"[^>]*>([\s\S]*?)<\/div>/i);
      
      if (!match) {
        console.log(`Vagalume tentativa ${i + 1}: HTML encontrado mas sem letra`);
        continue;
      }
      
      const lyrics = match[1]
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .trim();
      
      if (lyrics.length > 50) {
        console.log(`✓ Vagalume tentativa ${i + 1} SUCESSO!`);
        return lyrics;
      }
    } catch (e) {
      console.log(`Vagalume tentativa ${i + 1} erro:`, e instanceof Error ? e.message : String(e));
    }
  }
  
  return null;
}

async function buscarLetras(artist: string, title: string): Promise<string | null> {
  const cleanArt = cleanArtist(artist);
  const cleanTit = cleanTitle(title, artist);
  
  const urls = [
    `https://www.letras.mus.br/${createSlug(cleanArt)}/${createSlug(cleanTit)}/`,
    `https://www.letras.mus.br/${createSlug(cleanArt + ' ' + cleanTit)}/`,
    `https://www.letras.mus.br/${createSlug(cleanTit)}/`,
    `https://www.letras.mus.br/${createSlug(artist + ' ' + title)}/`,
  ];
  
  for (let i = 0; i < urls.length; i++) {
    try {
      const url = urls[i];
      console.log(`Letras.mus.br tentativa ${i + 1}:`, url);
      
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      
      if (!response.ok) {
        console.log(`Letras tentativa ${i + 1} falhou: ${response.status}`);
        continue;
      }
      
      const html = await response.text();
      const match = html.match(/<div[^>]*class="[^"]*lyric-original[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      
      if (!match) {
        console.log(`Letras tentativa ${i + 1}: HTML encontrado mas sem letra`);
        continue;
      }
      
      const lyrics = match[1]
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .trim();
      
      if (lyrics.length > 50) {
        console.log(`✓ Letras tentativa ${i + 1} SUCESSO!`);
        return lyrics;
      }
    } catch (e) {
      console.log(`Letras tentativa ${i + 1} erro:`, e instanceof Error ? e.message : String(e));
    }
  }
  
  return null;
}

async function buscarYouTubeTranscript(videoId: string): Promise<string | null> {
  try {
    console.log('YouTube Transcript:', videoId);
    
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!response.ok) {
      console.log('YouTube: Falha ao carregar página do vídeo');
      return null;
    }
    
    const html = await response.text();
    
    const captionsMatch = html.match(/"captionTracks":\[(.*?)\]/);
    if (!captionsMatch) {
      console.log('YouTube: Vídeo sem legendas disponíveis');
      return null;
    }

    // Tentar encontrar legenda em português primeiro
    const fullCaptionsData = captionsMatch[0];
    let urlMatch = fullCaptionsData.match(/"languageCode":"pt[^"]*"[^}]*"baseUrl":"(.*?)"/);
    
    // Se não encontrar em português, pegar qualquer idioma
    if (!urlMatch) {
      console.log('YouTube: Legenda em português não encontrada, tentando qualquer idioma');
      urlMatch = fullCaptionsData.match(/"baseUrl":"(.*?)"/);
    }
    
    if (!urlMatch) {
      console.log('YouTube: Não foi possível extrair URL das legendas');
      return null;
    }

    const captionUrl = urlMatch[1].replace(/\\u0026/g, '&');
    console.log('YouTube: URL da legenda encontrada');
    
    const transcriptRes = await fetch(captionUrl);
    if (!transcriptRes.ok) {
      console.log('YouTube: Falha ao baixar transcrição');
      return null;
    }

    const xml = await transcriptRes.text();
    const matches = xml.matchAll(/<text[^>]*>(.*?)<\/text>/g);
    
    let transcript = '';
    for (const match of matches) {
      const text = match[1]
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
      if (text) transcript += text + '\n';
    }

    if (transcript.trim().length > 50) {
      console.log('✓ YouTube Transcript SUCESSO!');
      return transcript.trim();
    }
    
    console.log('YouTube: Transcrição muito curta');
    return null;
  } catch (e) {
    console.log('YouTube erro:', e instanceof Error ? e.message : String(e));
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Auth required');

    const { title, artist, videoId } = await req.json();
    
    console.log('\n=== BUSCA DE LETRA ===');
    console.log('Título original:', title);
    console.log('Artista original:', artist);
    console.log('Video ID:', videoId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Cache baseado em título e artista limpos
    const cleanArt = cleanArtist(artist);
    const cleanTit = cleanTitle(title, artist);
    const cacheKey = `lyrics_${createSlug(cleanArt)}_${createSlug(cleanTit)}`;
    
    console.log('Título limpo:', cleanTit);
    console.log('Artista limpo:', cleanArt);
    console.log('Cache key:', cacheKey);

    const { data: cached } = await supabase
      .from('search_cache')
      .select('results')
      .eq('query', cacheKey)
      .single();

    if (cached?.results) {
      console.log('✓ Letra encontrada no CACHE');
      return new Response(
        JSON.stringify({ lyrics: cached.results, source: 'cache' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let lyrics: string | null = null;
    let source = '';

    // Tentar Vagalume primeiro
    lyrics = await buscarVagalume(artist, title);
    if (lyrics) source = 'Vagalume';

    // Se não encontrou, tentar Letras.mus.br
    if (!lyrics) {
      lyrics = await buscarLetras(artist, title);
      if (lyrics) source = 'Letras.mus.br';
    }

    // Se não encontrou e tem videoId, tentar YouTube
    if (!lyrics && videoId) {
      lyrics = await buscarYouTubeTranscript(videoId);
      if (lyrics) source = 'YouTube';
    }

    if (!lyrics) {
      console.log('✗ Letra não encontrada em nenhuma fonte');
      return new Response(
        JSON.stringify({ lyrics: 'Letra não encontrada', source: 'none' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Salvar no cache com TTL de 30 dias
    await supabase.from('search_cache').upsert({
      query: cacheKey,
      results: lyrics,
    }, { onConflict: 'query' });

    console.log('✓ Letra salva no cache');
    console.log('Fonte final:', source);
    console.log('======================\n');

    return new Response(
      JSON.stringify({ lyrics, source }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('ERRO GERAL:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao buscar letra' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
