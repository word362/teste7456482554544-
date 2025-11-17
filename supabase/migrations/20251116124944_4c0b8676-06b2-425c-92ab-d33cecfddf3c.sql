-- Remover a constraint duplicada fk_musica da tabela historico_escuta
-- Mantemos apenas a constraint gerada automaticamente pelo Supabase
ALTER TABLE public.historico_escuta 
DROP CONSTRAINT IF EXISTS fk_musica;