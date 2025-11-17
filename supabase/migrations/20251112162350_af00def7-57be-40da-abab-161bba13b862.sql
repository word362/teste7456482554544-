-- Criar tabela para cache de buscas de músicas
CREATE TABLE IF NOT EXISTS public.search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL UNIQUE,
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para buscas rápidas por query
CREATE INDEX idx_search_cache_query ON public.search_cache(query);

-- Índice para limpeza de cache antigo
CREATE INDEX idx_search_cache_updated_at ON public.search_cache(updated_at);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_search_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_search_cache_updated_at
  BEFORE UPDATE ON public.search_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_search_cache_updated_at();

-- RLS: permitir acesso público para leitura (sem autenticação necessária para buscar músicas)
ALTER TABLE public.search_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública de cache"
  ON public.search_cache
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Apenas o sistema pode inserir/atualizar (via edge functions com service role)
CREATE POLICY "Sistema pode gerenciar cache"
  ON public.search_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);