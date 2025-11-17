import { Play, MoreVertical, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddToPlaylistMenu } from "./AddToPlaylistMenu";

interface MusicCardProps {
  track: {
    id: string;
    titulo: string;
    artista: string;
    thumbnail: string | null;
    video_id: string;
  };
  onPlay: () => void;
}

export function MusicCard({ track, onPlay }: MusicCardProps) {
  const queryClient = useQueryClient();

  // Verificar se é um UUID válido (músicas salvas) ou video_id (resultados de busca)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(track.id);

  const { data: isFavorited } = useQuery({
    queryKey: ["favorite", track.id, track.video_id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      if (isUUID) {
        // Para músicas já salvas, verificar direto pelo ID
        const { data } = await supabase
          .from("favoritos")
          .select("id")
          .eq("user_id", user.id)
          .eq("musica_id", track.id)
          .maybeSingle();

        return !!data;
      } else {
        // Para resultados de busca, verificar pelo video_id
        const { data: musica } = await supabase
          .from("musicas")
          .select("id")
          .eq("video_id", track.video_id)
          .maybeSingle();

        if (!musica) return false;

        const { data: favorito } = await supabase
          .from("favoritos")
          .select("id")
          .eq("user_id", user.id)
          .eq("musica_id", musica.id)
          .maybeSingle();

        return !!favorito;
      }
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (!isUUID) {
        // Para músicas de busca, primeiro salvar na tabela musicas
        const { data: musicaExistente } = await supabase
          .from("musicas")
          .select("id")
          .eq("video_id", track.video_id)
          .maybeSingle();

        let musicaId = musicaExistente?.id;

        if (!musicaId) {
          const { data: novaMusica, error: erroInsert } = await supabase
            .from("musicas")
            .insert({
              titulo: track.titulo,
              artista: track.artista,
              thumbnail: track.thumbnail,
              video_id: track.video_id,
            })
            .select("id")
            .single();

          if (erroInsert) throw erroInsert;
          musicaId = novaMusica.id;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Não autenticado");

        const { error } = await supabase
          .from("favoritos")
          .insert({
            user_id: user.id,
            musica_id: musicaId,
          });

        if (error) throw error;
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      if (isFavorited) {
        const { error } = await supabase
          .from("favoritos")
          .delete()
          .eq("user_id", user.id)
          .eq("musica_id", track.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favoritos")
          .insert({
            user_id: user.id,
            musica_id: track.id,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite", track.id, track.video_id] });
      toast.success(isFavorited ? "Removido dos favoritos" : "Adicionado aos favoritos");
    },
    onError: () => {
      toast.error("Erro ao atualizar favoritos");
    },
  });

  return (
    <Card className="group relative bg-card hover:bg-card/80 transition-all duration-200 p-3 rounded-lg">
      <div className="relative aspect-square mb-3 rounded overflow-hidden bg-muted">
        {track.thumbnail ? (
          <img
            src={track.thumbnail}
            alt={track.titulo}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-10 h-10 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            size="icon"
            className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90 hover:scale-110 transition-transform"
            onClick={onPlay}
          >
            <Play className="w-5 h-5 fill-primary-foreground" />
          </Button>
        </div>
      </div>

      <div className="space-y-0.5">
        <h3 className="font-semibold truncate text-sm">{track.titulo}</h3>
        <p className="text-xs text-muted-foreground truncate">{track.artista}</p>
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="w-8 h-8 bg-background/80 hover:bg-background backdrop-blur-sm"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={() => toggleFavorite.mutate()}
              disabled={toggleFavorite.isPending}
              className="cursor-pointer"
            >
              <Heart className={`w-4 h-4 mr-2 ${isFavorited ? "fill-primary text-primary" : ""}`} />
              {isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            </DropdownMenuItem>
            <AddToPlaylistMenu 
              track={{
                title: track.titulo,
                artist: track.artista,
                videoId: track.video_id,
                thumbnail: track.thumbnail || ''
              }}
              asMenuItems={true}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
