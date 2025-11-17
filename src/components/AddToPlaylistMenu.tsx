import { useState, useEffect } from "react";
import { Plus, Music2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface AddToPlaylistMenuProps {
  track: {
    title: string;
    artist: string;
    videoId: string;
    thumbnail: string;
  };
  asMenuItems?: boolean;
}

interface Playlist {
  id: string;
  nome: string;
}

export function AddToPlaylistMenu({ track, asMenuItems = false }: AddToPlaylistMenuProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();

  useEffect(() => {
    loadPlaylists();
  }, [session]);

  const loadPlaylists = async () => {
    if (!session) return;

    try {
      const { data, error } = await supabase
        .from("playlists")
        .select("id, nome")
        .order("nome");

      if (error) throw error;
      setPlaylists(data || []);
    } catch (error) {
      console.error("Erro ao carregar playlists:", error);
    }
  };

  const addToPlaylist = async (playlistId: string) => {
    if (!session || loading) return;

    setLoading(true);

    try {
      // Primeiro, verificar se a música já existe na tabela musicas
      let { data: existingMusic, error: searchError } = await supabase
        .from("musicas")
        .select("id")
        .eq("video_id", track.videoId)
        .maybeSingle();

      if (searchError) throw searchError;

      let musicId: string;

      if (!existingMusic) {
        // Música não existe, criar
        const { data: newMusic, error: insertError } = await supabase
          .from("musicas")
          .insert({
            titulo: track.title,
            artista: track.artist,
            video_id: track.videoId,
            thumbnail: track.thumbnail,
          })
          .select("id")
          .single();

        if (insertError) throw insertError;
        musicId = newMusic.id;
      } else {
        musicId = existingMusic.id;
      }

      // Verificar se a música já está na playlist
      const { data: existingItem, error: checkError } = await supabase
        .from("playlist_items")
        .select("id")
        .eq("playlist_id", playlistId)
        .eq("musica_id", musicId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingItem) {
        toast({
          title: "Música já está na playlist",
          description: "Esta música já foi adicionada a esta playlist.",
        });
        return;
      }

      // Obter a próxima posição
      const { data: items, error: countError } = await supabase
        .from("playlist_items")
        .select("posicao")
        .eq("playlist_id", playlistId)
        .order("posicao", { ascending: false })
        .limit(1);

      if (countError) throw countError;

      const nextPosition = items && items.length > 0 ? items[0].posicao + 1 : 0;

      // Adicionar à playlist
      const { error: addError } = await supabase.from("playlist_items").insert({
        playlist_id: playlistId,
        musica_id: musicId,
        posicao: nextPosition,
      });

      if (addError) throw addError;

      toast({
        title: "Sucesso!",
        description: "Música adicionada à playlist.",
      });
    } catch (error) {
      console.error("Erro ao adicionar música:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a música à playlist.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  // Se for para renderizar apenas os itens (dentro de outro dropdown)
  if (asMenuItems) {
    return (
      <>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Adicionar à playlist</DropdownMenuLabel>
        {playlists.length === 0 ? (
          <DropdownMenuItem disabled>
            <Music2 className="mr-2 h-4 w-4" />
            Nenhuma playlist ainda
          </DropdownMenuItem>
        ) : (
          playlists.map((playlist) => (
            <DropdownMenuItem
              key={playlist.id}
              onClick={() => addToPlaylist(playlist.id)}
              disabled={loading}
              className="cursor-pointer"
            >
              <Music2 className="mr-2 h-4 w-4" />
              {playlist.nome}
            </DropdownMenuItem>
          ))
        )}
      </>
    );
  }

  // Renderização padrão com dropdown próprio
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-black/80 text-white"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Adicionar à playlist</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {playlists.length === 0 ? (
          <DropdownMenuItem disabled>
            <Music2 className="mr-2 h-4 w-4" />
            Nenhuma playlist ainda
          </DropdownMenuItem>
        ) : (
          playlists.map((playlist) => (
            <DropdownMenuItem
              key={playlist.id}
              onClick={() => addToPlaylist(playlist.id)}
              disabled={loading}
            >
              <Music2 className="mr-2 h-4 w-4" />
              {playlist.nome}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
