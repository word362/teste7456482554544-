import { useState, useEffect } from "react";
import { Plus, Music, Trash2, Edit2, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { usePlayerStore } from "@/lib/playerStore";

interface Playlist {
  id: string;
  nome: string;
  descricao: string | null;
  capa_url: string | null;
  created_at: string;
}

interface PlaylistWithTracks extends Playlist {
  tracks: Array<{
    id: string;
    titulo: string;
    artista: string;
    thumbnail: string | null;
    video_id: string;
    playlist_item_id?: string;
  }>;
}

const Playlists = () => {
  const [playlists, setPlaylists] = useState<PlaylistWithTracks[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [formData, setFormData] = useState({ nome: "", descricao: "" });
  const { toast } = useToast();
  const { session } = useAuth();
  const { setQueue, playTrack } = usePlayerStore();

  useEffect(() => {
    loadPlaylists();
  }, [session]);

  const loadPlaylists = async () => {
    if (!session) return;
    
    try {
      const { data: playlistsData, error: playlistsError } = await supabase
        .from("playlists")
        .select("*")
        .order("created_at", { ascending: false });

      if (playlistsError) throw playlistsError;

      const playlistsWithTracks = await Promise.all(
        (playlistsData || []).map(async (playlist) => {
          const { data: items, error: itemsError } = await supabase
            .from("playlist_items")
            .select(`
              id,
              musica_id,
              musicas (
                id,
                titulo,
                artista,
                thumbnail,
                video_id
              )
            `)
            .eq("playlist_id", playlist.id)
            .order("posicao");

          if (itemsError) {
            console.error("Erro ao carregar itens:", itemsError);
            return { ...playlist, tracks: [] };
          }

          const tracks = (items || [])
            .map((item: any) => ({
              ...item.musicas,
              playlist_item_id: item.id
            }))
            .filter(Boolean);

          return { ...playlist, tracks };
        })
      );

      setPlaylists(playlistsWithTracks);
    } catch (error) {
      console.error("Erro ao carregar playlists:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as playlists.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!session || !formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome da playlist é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("playlists").insert({
        user_id: session.user.id,
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Playlist criada com sucesso!",
      });

      setFormData({ nome: "", descricao: "" });
      setCreateDialogOpen(false);
      loadPlaylists();
    } catch (error) {
      console.error("Erro ao criar playlist:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a playlist.",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePlaylist = async () => {
    if (!editingPlaylist || !formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome da playlist é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("playlists")
        .update({
          nome: formData.nome.trim(),
          descricao: formData.descricao.trim() || null,
        })
        .eq("id", editingPlaylist.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Playlist atualizada com sucesso!",
      });

      setEditingPlaylist(null);
      setFormData({ nome: "", descricao: "" });
      loadPlaylists();
    } catch (error) {
      console.error("Erro ao atualizar playlist:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a playlist.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    try {
      const { error } = await supabase
        .from("playlists")
        .delete()
        .eq("id", playlistId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Playlist deletada com sucesso!",
      });

      loadPlaylists();
    } catch (error) {
      console.error("Erro ao deletar playlist:", error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar a playlist.",
        variant: "destructive",
      });
    }
  };

  const handlePlayPlaylist = (playlist: PlaylistWithTracks, startIndex: number = 0) => {
    if (playlist.tracks.length === 0) {
      toast({
        title: "Playlist vazia",
        description: "Esta playlist não tem músicas.",
        variant: "destructive",
      });
      return;
    }

    const tracks = playlist.tracks.map((track) => ({
      id: track.id,
      title: track.titulo,
      artist: track.artista,
      thumbnail: track.thumbnail || "",
      videoId: track.video_id,
    }));

    setQueue(tracks);
    playTrack(tracks[startIndex]);

    toast({
      title: "Reproduzindo playlist",
      description: `${playlist.nome} - começando da música ${startIndex + 1}`,
    });
  };

  const handleRemoveFromPlaylist = async (playlistId: string, playlistItemId: string) => {
    try {
      const { error } = await supabase
        .from("playlist_items")
        .delete()
        .eq("id", playlistItemId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Música removida da playlist.",
      });

      loadPlaylists();
    } catch (error) {
      console.error("Erro ao remover música:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a música.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando playlists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Minhas Playlists</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Playlist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Playlist</DialogTitle>
              <DialogDescription>
                Crie uma nova playlist para organizar suas músicas favoritas.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Playlist</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Minhas Favoritas"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição (opcional)</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva sua playlist..."
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setFormData({ nome: "", descricao: "" });
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreatePlaylist}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {playlists.length === 0 ? (
        <Card className="text-center py-16 bg-card/40 backdrop-blur-sm border-border/50">
          <CardContent className="flex flex-col items-center gap-4">
            <Music className="h-16 w-16 text-muted-foreground" />
            <div>
              <h3 className="text-xl font-semibold mb-2">Nenhuma playlist criada</h3>
              <p className="text-muted-foreground mb-4">
                Crie sua primeira playlist para começar a organizar suas músicas.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Playlist
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {playlists.map((playlist) => (
            <Card
              key={playlist.id}
              className="overflow-hidden bg-card/40 backdrop-blur-sm border-border/50 hover:bg-card/60 transition-all duration-300 hover:shadow-elegant"
            >
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="mb-2">{playlist.nome}</CardTitle>
                    {playlist.descricao && (
                      <CardDescription>{playlist.descricao}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Dialog
                      open={editingPlaylist?.id === playlist.id}
                      onOpenChange={(open) => {
                        if (!open) {
                          setEditingPlaylist(null);
                          setFormData({ nome: "", descricao: "" });
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingPlaylist(playlist);
                            setFormData({
                              nome: playlist.nome,
                              descricao: playlist.descricao || "",
                            });
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Playlist</DialogTitle>
                          <DialogDescription>
                            Atualize as informações da sua playlist.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-nome">Nome da Playlist</Label>
                            <Input
                              id="edit-nome"
                              value={formData.nome}
                              onChange={(e) =>
                                setFormData({ ...formData, nome: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-descricao">Descrição</Label>
                            <Textarea
                              id="edit-descricao"
                              value={formData.descricao}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  descricao: e.target.value,
                                })
                              }
                              rows={3}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingPlaylist(null);
                              setFormData({ nome: "", descricao: "" });
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button onClick={handleUpdatePlaylist}>Salvar</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeletePlaylist(playlist.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{playlist.tracks.length} música{playlist.tracks.length !== 1 ? 's' : ''}</span>
                    <Button
                      size="sm"
                      onClick={() => handlePlayPlaylist(playlist)}
                      disabled={playlist.tracks.length === 0}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Reproduzir
                    </Button>
                  </div>
                  
                  {playlist.tracks.length > 0 && (
                    <div className="space-y-2">
                      {playlist.tracks.slice(0, 3).map((track, index) => (
                        <div
                          key={track.id}
                          className="group flex items-center gap-2 text-sm p-2 rounded hover:bg-accent/50 transition-colors"
                        >
                          {track.thumbnail ? (
                            <img
                              src={track.thumbnail}
                              alt={track.titulo}
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                              <Music className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{track.titulo}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {track.artista}
                            </p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handlePlayPlaylist(playlist, index)}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                            {track.playlist_item_id && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleRemoveFromPlaylist(playlist.id, track.playlist_item_id!)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      {playlist.tracks.length > 3 && (
                        <p className="text-xs text-muted-foreground pl-12">
                          +{playlist.tracks.length - 3} música(s)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Playlists;
