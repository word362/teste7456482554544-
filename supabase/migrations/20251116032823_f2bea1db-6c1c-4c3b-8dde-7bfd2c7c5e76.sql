-- Corrigir search_path nas funções usando CASCADE
DROP FUNCTION IF EXISTS public.update_search_cache_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_search_cache_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recriar o trigger
DROP TRIGGER IF EXISTS trigger_update_search_cache_updated_at ON public.search_cache;
CREATE TRIGGER trigger_update_search_cache_updated_at
  BEFORE UPDATE ON public.search_cache
  FOR EACH ROW EXECUTE FUNCTION public.update_search_cache_updated_at();