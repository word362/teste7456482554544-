import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MusicCard } from './MusicCard';
import { TrendingUp } from 'lucide-react';
import { Card } from './ui/card';

interface Track {
  id: string;
  titulo: string;
  artista: string;
  thumbnail: string | null;
  video_id: string;
  play_count: number;
}

export const TopTracks = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTopTracks();
  }, []);

  const loadTopTracks = async () => {
    try {
      const { data, error } = await supabase
        .from('historico_escuta')
        .select(`
          musica_id,
          musicas (
            id,
            titulo,
            artista,
            thumbnail,
            video_id
          )
        `)
        .order('ouvido_em', { ascending: false });

      if (error) throw error;

      // Count plays per track
      const trackCounts = data.reduce((acc: any, item: any) => {
        const musicId = item.musica_id;
        if (!acc[musicId]) {
          acc[musicId] = {
            ...item.musicas,
            play_count: 0
          };
        }
        acc[musicId].play_count++;
        return acc;
      }, {});

      // Convert to array and sort by play count
      const topTracks = Object.values(trackCounts)
        .sort((a: any, b: any) => b.play_count - a.play_count)
        .slice(0, 10);

      setTracks(topTracks as Track[]);
    } catch (error) {
      console.error('Erro ao carregar músicas mais tocadas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border-border/50">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Mais Tocadas</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-square bg-muted/30 rounded-lg animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (tracks.length === 0) {
    return (
      <Card className="p-8 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border-border/50">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Mais Tocadas</h2>
        </div>
        <p className="text-muted-foreground text-center py-8">
          Nenhuma música tocada ainda. Comece a ouvir!
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-8 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border-border/50 shadow-elegant">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10 shadow-glow">
          <TrendingUp className="h-6 w-6 text-primary animate-pulse" />
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Mais Tocadas no Site
          </h2>
          <p className="text-sm text-muted-foreground">As músicas mais populares entre os usuários</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {tracks.map((track, index) => (
          <div 
            key={track.id}
            className="relative group animate-fade-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="absolute -top-2 -left-2 z-10 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground shadow-glow">
              {index + 1}
            </div>
            <MusicCard
              track={track}
              onPlay={() => {
                console.log("Tocar:", track);
              }}
            />
            <div className="mt-2 text-xs text-muted-foreground text-center">
              {track.play_count} {track.play_count === 1 ? 'reprodução' : 'reproduções'}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
