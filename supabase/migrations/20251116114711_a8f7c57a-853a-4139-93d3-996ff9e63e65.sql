-- Adicionar políticas de escrita para a tabela musicas
-- Usuários autenticados podem adicionar músicas
CREATE POLICY "Usuários autenticados podem adicionar músicas"
ON public.musicas FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Permitir que usuários atualizem músicas (para futuras funcionalidades)
CREATE POLICY "Usuários autenticados podem atualizar músicas"
ON public.musicas FOR UPDATE
USING (auth.uid() IS NOT NULL);