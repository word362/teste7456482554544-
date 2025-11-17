import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useCallback } from "react";
import { MusicCard } from "@/components/MusicCard";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { usePlayerStore } from "@/lib/playerStore";

interface MusicResult {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  videoId: string;
}

const Search = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MusicResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    if (!session) {
      toast({
        title: "Erro",
        description: "Você precisa estar autenticado para buscar músicas.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('buscar-musica', {
        body: { query: searchQuery }
      });

      if (error) throw error;

      setResults(data?.results || []);
      
      if (data?.fromCache) {
        console.log('✅ Resultados do cache');
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      toast({
        title: "Erro ao buscar",
        description: "Não foi possível buscar as músicas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, session]);

  // Debounce com useEffect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query) {
        handleSearch(query);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query, handleSearch]);

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">Buscar</h1>
      
      <div className="relative max-w-2xl">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Busque por músicas, artistas ou álbuns..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-12 bg-card border-border text-lg"
        />
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Buscando músicas...</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">
            {results.length} resultado{results.length > 1 ? 's' : ''} encontrado{results.length > 1 ? 's' : ''}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {results.map((track) => (
              <MusicCard
                key={track.videoId}
                track={{
                  id: track.videoId,
                  titulo: track.title,
                  artista: track.artist,
                  thumbnail: track.thumbnail,
                  video_id: track.videoId
                }}
                onPlay={() => {
                  const { playTrack, setQueue } = usePlayerStore.getState();
                  setQueue(results.map(r => ({
                    id: r.videoId,
                    title: r.title,
                    artist: r.artist,
                    thumbnail: r.thumbnail,
                    videoId: r.videoId
                  })));
                  playTrack({
                    id: track.videoId,
                    title: track.title,
                    artist: track.artist,
                    thumbnail: track.thumbnail,
                    videoId: track.videoId
                  });
                }}
              />
            ))}
          </div>
        </div>
      )}

      {!loading && query && results.length === 0 && (
        <div className="text-center py-20">
          <p className="text-muted-foreground">Nenhum resultado encontrado para "{query}"</p>
        </div>
      )}

      {!loading && !query && (
        <div className="text-center py-20">
          <p className="text-muted-foreground">Comece a buscar suas músicas favoritas</p>
        </div>
      )}
    </div>
  );
};

export default Search;
