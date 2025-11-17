-- Remover política pública de leitura do cache de busca
DROP POLICY IF EXISTS "Permitir leitura pública de cache" ON search_cache;
DROP POLICY IF EXISTS "Usuários autenticados podem ler cache" ON search_cache;

-- Cache deve ser acessível apenas via service role (edge functions)
-- Remover todas as políticas SELECT do cache
CREATE POLICY "Sistema pode ler cache via service role"
ON search_cache
FOR SELECT
USING (false); -- Bloqueia leitura direta, apenas service role pode acessar

-- Adicionar políticas de gestão de roles para admins
CREATE POLICY "Admins podem gerenciar todas as roles"
ON user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Garantir que novos usuários não possam auto-promover
CREATE POLICY "Usuários não podem auto-atribuir roles"
ON user_roles
FOR INSERT
WITH CHECK (false);