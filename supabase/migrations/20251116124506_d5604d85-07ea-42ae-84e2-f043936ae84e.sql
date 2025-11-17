-- Criar tabela para histórico de músicas ouvidas
CREATE TABLE IF NOT EXISTS public.historico_escuta (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  musica_id UUID NOT NULL REFERENCES public.musicas(id) ON DELETE CASCADE,
  ouvido_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tempo_ouvido INTEGER, -- em segundos
  completou BOOLEAN DEFAULT false,
  CONSTRAINT fk_musica FOREIGN KEY (musica_id) REFERENCES public.musicas(id)
);

-- Criar índices para melhor performance
CREATE INDEX idx_historico_user_id ON public.historico_escuta(user_id);
CREATE INDEX idx_historico_musica_id ON public.historico_escuta(musica_id);
CREATE INDEX idx_historico_ouvido_em ON public.historico_escuta(ouvido_em DESC);

-- Habilitar RLS
ALTER TABLE public.historico_escuta ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem inserir seu próprio histórico"
  ON public.historico_escuta
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver seu próprio histórico"
  ON public.historico_escuta
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio histórico"
  ON public.historico_escuta
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Criar tabela para configurações do equalizador
CREATE TABLE IF NOT EXISTS public.eq_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  preset_name TEXT DEFAULT 'Custom',
  band_60 INTEGER DEFAULT 0 CHECK (band_60 >= -12 AND band_60 <= 12),
  band_170 INTEGER DEFAULT 0 CHECK (band_170 >= -12 AND band_170 <= 12),
  band_310 INTEGER DEFAULT 0 CHECK (band_310 >= -12 AND band_310 <= 12),
  band_600 INTEGER DEFAULT 0 CHECK (band_600 >= -12 AND band_600 <= 12),
  band_1k INTEGER DEFAULT 0 CHECK (band_1k >= -12 AND band_1k <= 12),
  band_3k INTEGER DEFAULT 0 CHECK (band_3k >= -12 AND band_3k <= 12),
  band_6k INTEGER DEFAULT 0 CHECK (band_6k >= -12 AND band_6k <= 12),
  band_12k INTEGER DEFAULT 0 CHECK (band_12k >= -12 AND band_12k <= 12),
  band_14k INTEGER DEFAULT 0 CHECK (band_14k >= -12 AND band_14k <= 12),
  band_16k INTEGER DEFAULT 0 CHECK (band_16k >= -12 AND band_16k <= 12),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS no EQ settings
ALTER TABLE public.eq_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para EQ
CREATE POLICY "Usuários podem inserir suas configurações de EQ"
  ON public.eq_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver suas configurações de EQ"
  ON public.eq_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas configurações de EQ"
  ON public.eq_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at no EQ settings
CREATE TRIGGER update_eq_settings_updated_at
  BEFORE UPDATE ON public.eq_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();