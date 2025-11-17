import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MusicCard } from "@/components/MusicCard";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlayerStore } from "@/lib/playerStore";
import { Music, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { playTrack, setQueue } = usePlayerStore();
  const { user } = useAuth();

  const { data: recentTracks, isLoading: isLoadingRecent } = useQuery({
    queryKey: ["recentTracks", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("historico_escuta")
        .select(`
          id,
          ouvido_em,
          musicas (
            id,
            titulo,
            artista,
            thumbnail,
            video_id
          )
        `)
        .order("ouvido_em", { ascending: false })
        .limit(6);

      if (error) throw error;
      return data?.map((item: any) => item.musicas).filter(Boolean) || [];
    },
    enabled: !!user,
  });

  const { data: featuredTracks, isLoading: isLoadingFeatured } = useQuery({
    queryKey: ["featuredTracks"],
    queryFn: async () => {
      // Buscar músicas mais tocadas
      const { data, error } = await supabase
        .from("historico_escuta")
        .select(`
          musica_id,
          musicas (
            id,
            titulo,
            artista,
            thumbnail,
            video_id
          )
        `);

      if (error) throw error;

      // Contar reproduções por música
      const trackCounts = data.reduce((acc: any, item: any) => {
        const musicId = item.musica_id;
        if (!acc[musicId] && item.musicas) {
          acc[musicId] = {
            ...item.musicas,
            play_count: 0
          };
        }
        if (acc[musicId]) {
          acc[musicId].play_count++;
        }
        return acc;
      }, {});

      // Converter para array e ordenar por contagem
      return Object.values(trackCounts)
        .sort((a: any, b: any) => b.play_count - a.play_count)
        .slice(0, 6);
    },
  });

  const handlePlayTrack = (track: any, trackList: any[]) => {
    const trackData = {
      id: track.id,
      title: track.titulo,
      artist: track.artista,
      thumbnail: track.thumbnail,
      videoId: track.video_id,
    };
    
    const queueData = trackList.map((item: any) => ({
      id: item.id,
      title: item.titulo,
      artist: item.artista,
      thumbnail: item.thumbnail,
      videoId: item.video_id,
    }));
    
    setQueue(queueData);
    playTrack(trackData);
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="text-5xl font-bold mb-2">Bem-vindo de volta</h1>
        <p className="text-muted-foreground text-lg">Vamos encontrar algo para você ouvir</p>
      </div>

      {/* Recently Played */}
      {user && (
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Tocadas recentemente</h2>
          </div>
          {isLoadingRecent ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-44" />
              ))}
            </div>
          ) : recentTracks && recentTracks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {recentTracks.map((track: any) => (
                <MusicCard
                  key={track.id}
                  track={track}
                  onPlay={() => handlePlayTrack(track, recentTracks)}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhuma música tocada recentemente</p>
          )}
        </section>
      )}

      {/* Featured */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Music className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Em destaque</h2>
        </div>
        {isLoadingFeatured ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-44" />
            ))}
          </div>
        ) : featuredTracks && featuredTracks.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredTracks.map((track: any) => (
              <MusicCard
                key={track.id}
                track={track}
                onPlay={() => handlePlayTrack(track, featuredTracks)}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Nenhuma música em destaque</p>
        )}
      </section>
    </div>
  );
};

export default Index;
