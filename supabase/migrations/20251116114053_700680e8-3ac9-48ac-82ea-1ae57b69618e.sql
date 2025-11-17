-- Criar tabela de playlists
CREATE TABLE public.playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  capa_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de itens das playlists
CREATE TABLE public.playlist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  musica_id UUID NOT NULL REFERENCES public.musicas(id) ON DELETE CASCADE,
  posicao INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;

-- Políticas para playlists
CREATE POLICY "Usuários podem ver suas próprias playlists"
ON public.playlists FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias playlists"
ON public.playlists FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias playlists"
ON public.playlists FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias playlists"
ON public.playlists FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para playlist_items
CREATE POLICY "Usuários podem ver itens de suas playlists"
ON public.playlist_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.playlists
    WHERE playlists.id = playlist_items.playlist_id
    AND playlists.user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem adicionar itens em suas playlists"
ON public.playlist_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.playlists
    WHERE playlists.id = playlist_items.playlist_id
    AND playlists.user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem atualizar itens de suas playlists"
ON public.playlist_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.playlists
    WHERE playlists.id = playlist_items.playlist_id
    AND playlists.user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem deletar itens de suas playlists"
ON public.playlist_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.playlists
    WHERE playlists.id = playlist_items.playlist_id
    AND playlists.user_id = auth.uid()
  )
);

-- Trigger para updated_at em playlists
CREATE TRIGGER update_playlists_updated_at
BEFORE UPDATE ON public.playlists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Índices para melhor performance
CREATE INDEX idx_playlists_user_id ON public.playlists(user_id);
CREATE INDEX idx_playlist_items_playlist_id ON public.playlist_items(playlist_id);
CREATE INDEX idx_playlist_items_musica_id ON public.playlist_items(musica_id);