import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayerStore } from "@/lib/playerStore";
import { useToast } from "@/hooks/use-toast";

interface Track {
  id: string;
  titulo: string;
  artista: string;
  thumbnail: string | null;
  video_id: string;
  duracao: number | null;
}

interface PlayStats {
  total_plays: number;
  unique_listeners: number;
}

const Artist = () => {
  const { artistName } = useParams<{ artistName: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { playTrack, setQueue, addToQueue } = usePlayerStore();
  const { toast } = useToast();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [stats, setStats] = useState<PlayStats>({ total_plays: 0, unique_listeners: 0 });
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (artistName) {
      loadArtistData();
      loadFavorites();
    }
  }, [artistName, session]);

  const loadArtistData = async () => {
    try {
      // Buscar músicas do artista
      const { data: tracksData, error: tracksError } = await supabase
        .from("musicas")
        .select("*")
        .ilike("artista", artistName!)
        .order("titulo");

      if (tracksError) throw tracksError;

      setTracks(tracksData || []);

      // Buscar estatísticas
      if (tracksData && tracksData.length > 0) {
        const trackIds = tracksData.map((t) => t.id);
        
        const { data: statsData, error: statsError } = await supabase
          .from("historico_escuta")
          .select("user_id")
          .in("musica_id", trackIds);

        if (!statsError && statsData) {
          const uniqueUsers = new Set(statsData.map((s) => s.user_id));
          setStats({
            total_plays: statsData.length,
            unique_listeners: uniqueUsers.size,
          });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados do artista:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do artista.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    if (!session) return;

    try {
      const { data, error } = await supabase
        .from("favoritos")
        .select("musica_id")
        .eq("user_id", session.user.id);

      if (!error && data) {
        setFavorites(new Set(data.map((f) => f.musica_id)));
      }
    } catch (error) {
      console.error("Erro ao carregar favoritos:", error);
    }
  };

  const toggleFavorite = async (trackId: string) => {
    if (!session) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para favoritar músicas.",
        variant: "destructive",
      });
      return;
    }

    const isFavorite = favorites.has(trackId);

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from("favoritos")
          .delete()
          .eq("user_id", session.user.id)
          .eq("musica_id", trackId);

        if (error) throw error;

        setFavorites((prev) => {
          const newSet = new Set(prev);
          newSet.delete(trackId);
          return newSet;
        });

        toast({
          title: "Removido dos favoritos",
          description: "Música removida dos seus favoritos.",
        });
      } else {
        const { error } = await supabase
          .from("favoritos")
          .insert({
            user_id: session.user.id,
            musica_id: trackId,
          });

        if (error) throw error;

        setFavorites((prev) => new Set(prev).add(trackId));

        toast({
          title: "Adicionado aos favoritos",
          description: "Música adicionada aos seus favoritos.",
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar favorito:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os favoritos.",
        variant: "destructive",
      });
    }
  };

  const handlePlayTrack = (track: Track) => {
    const formattedTrack = {
      id: track.id,
      title: track.titulo,
      artist: track.artista,
      thumbnail: track.thumbnail || "",
      videoId: track.video_id,
    };
    addToQueue(formattedTrack);
    playTrack(formattedTrack);
  };

  const handlePlayAll = () => {
    const formattedTracks = tracks.map((track) => ({
      id: track.id,
      title: track.titulo,
      artist: track.artista,
      thumbnail: track.thumbnail || "",
      videoId: track.video_id,
    }));
    setQueue(formattedTracks);
    if (formattedTracks.length > 0) {
      playTrack(formattedTracks[0]);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 min-h-screen">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4 md:mb-6 gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      {/* Header do Artista */}
      <div className="relative mb-6 md:mb-8 rounded-lg overflow-hidden bg-gradient-to-b from-primary/20 to-background p-4 md:p-8">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6">
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-glow">
            <span className="text-4xl md:text-6xl font-bold text-primary-foreground">
              {artistName?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="text-center md:text-left flex-1">
            <p className="text-xs md:text-sm font-semibold text-muted-foreground mb-1 md:mb-2">ARTISTA</p>
            <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold mb-3 md:mb-4">{artistName}</h1>
            <div className="flex gap-4 md:gap-6 justify-center md:justify-start text-sm">
              <div>
                <span className="font-bold text-xl md:text-2xl">{stats.total_plays}</span>
                <p className="text-xs md:text-sm text-muted-foreground">reproduções</p>
              </div>
              <div>
                <span className="font-bold text-xl md:text-2xl">{stats.unique_listeners}</span>
                <p className="text-xs md:text-sm text-muted-foreground">ouvintes</p>
              </div>
              <div>
                <span className="font-bold text-xl md:text-2xl">{tracks.length}</span>
                <p className="text-xs md:text-sm text-muted-foreground">músicas</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 md:mt-6">
          <Button
            size="lg"
            className="gap-2 rounded-full px-6 md:px-8 shadow-glow w-full md:w-auto"
            onClick={handlePlayAll}
            disabled={tracks.length === 0}
          >
            <Play className="h-5 w-5 fill-current" />
            Reproduzir Todas
          </Button>
        </div>
      </div>

      {/* Tabs de Conteúdo */}
      <Tabs defaultValue="musicas" className="w-full">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="musicas">Músicas</TabsTrigger>
          <TabsTrigger value="sobre">Sobre</TabsTrigger>
        </TabsList>

        <TabsContent value="musicas" className="mt-4 md:mt-6">
          <Card className="bg-card/40 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Todas as Músicas</CardTitle>
            </CardHeader>
            <CardContent>
              {tracks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm md:text-base">
                  Nenhuma música encontrada para este artista.
                </p>
              ) : (
                <div className="space-y-2">
                  {tracks.map((track, index) => (
                    <div
                      key={track.id}
                      className="group flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <span className="text-muted-foreground w-6 md:w-8 text-center text-xs md:text-base">
                        {index + 1}
                      </span>
                      <img
                        src={track.thumbnail || "/placeholder.svg"}
                        alt={track.titulo}
                        className="w-10 h-10 md:w-12 md:h-12 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm md:text-base">{track.titulo}</p>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">
                          {track.artista}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 md:gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 md:h-10 md:w-10"
                          onClick={() => toggleFavorite(track.id)}
                        >
                          <Heart
                            className={`h-4 w-4 md:h-5 md:w-5 ${
                              favorites.has(track.id)
                                ? "fill-primary text-primary"
                                : ""
                            }`}
                          />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 md:h-10 md:w-10"
                          onClick={() => handlePlayTrack(track)}
                        >
                          <Play className="h-4 w-4 md:h-5 md:w-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sobre" className="mt-4 md:mt-6">
          <Card className="bg-card/40 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Sobre {artistName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Estatísticas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-accent/50">
                      <p className="text-3xl font-bold text-primary">
                        {stats.total_plays}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total de Reproduções
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/50">
                      <p className="text-3xl font-bold text-primary">
                        {stats.unique_listeners}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Ouvintes Únicos
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/50">
                      <p className="text-3xl font-bold text-primary">
                        {tracks.length}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Músicas Disponíveis
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Artist;
