import { Heart, Play, RefreshCw } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MusicCard } from "@/components/MusicCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePlayerStore } from "@/lib/playerStore";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

const Favorites = () => {
  const { user } = useAuth();
  const { playTrack, setQueue } = usePlayerStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: favorites, isLoading } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("favoritos")
        .select(`
          id,
          created_at,
          musica_id,
          musicas (
            id,
            titulo,
            artista,
            thumbnail,
            video_id,
            duracao
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return data.map(fav => ({
        id: fav.musicas.id,
        title: fav.musicas.titulo,
        artist: fav.musicas.artista,
        thumbnail: fav.musicas.thumbnail || "",
        videoId: fav.musicas.video_id,
        favorito_id: fav.id,
        favorited_at: fav.created_at
      }));
    },
    enabled: !!user?.id,
  });

  // Configurar sincronização em tempo real
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('favoritos-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'favoritos',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Sincronizando favoritos...', payload);
          setIsSyncing(true);
          
          // Invalida a query para recarregar os dados
          queryClient.invalidateQueries({ queryKey: ["favorites", user.id] });
          
          // Mostra toast de sincronização
          const eventType = payload.eventType;
          if (eventType === 'INSERT') {
            toast({
              title: "✨ Favorito adicionado",
              description: "Sua música foi sincronizada com sucesso!",
            });
          } else if (eventType === 'DELETE') {
            toast({
              title: "🗑️ Favorito removido",
              description: "A música foi removida dos seus favoritos.",
            });
          }
          
          setTimeout(() => setIsSyncing(false), 1000);
        }
      )
      .subscribe();

    console.log('🎵 Sincronização em tempo real ativada para favoritos');

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, toast]);

  const handlePlayAll = () => {
    if (!favorites || favorites.length === 0) return;
    
    setQueue(favorites);
    playTrack(favorites[0]);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-32">
        <div className="flex items-center gap-3">
          <Heart className="h-8 w-8 text-primary animate-pulse" />
          <h1 className="text-4xl font-bold">Minhas Músicas Favoritas</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-card rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Heart className="h-8 w-8 text-primary fill-primary" />
          <div>
            <h1 className="text-4xl font-bold">Minhas Músicas Favoritas</h1>
            <p className="text-muted-foreground mt-1">
              Suas músicas curtidas em um só lugar
            </p>
          </div>
        </div>
        
        {favorites && favorites.length > 0 && (
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm flex items-center gap-2">
              {isSyncing && <RefreshCw className="h-3 w-3 animate-spin" />}
              {favorites.length} {favorites.length === 1 ? 'música' : 'músicas'}
            </Badge>
            <Button 
              onClick={handlePlayAll}
              className="gap-2"
              size="lg"
            >
              <Play className="h-5 w-5" />
              Tocar Todas
            </Button>
          </div>
        )}
      </div>

      {favorites && favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((track: any) => (
            <MusicCard
              key={track.id}
              track={{
                id: track.id,
                titulo: track.title,
                artista: track.artist,
                thumbnail: track.thumbnail,
                video_id: track.videoId,
              }}
              onPlay={() => playTrack(track)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-6 relative">
            <Heart className="h-24 w-24 text-muted-foreground/20" />
            <Heart className="h-16 w-16 text-muted-foreground/40 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Nenhum favorito ainda</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Comece a curtir suas músicas favoritas! Clique no coração ao lado de qualquer música para adicioná-la aqui.
          </p>
          <Button variant="outline" onClick={() => window.location.href = '/search'}>
            Descobrir Músicas
          </Button>
        </div>
      )}
    </div>
  );
};

export default Favorites;
