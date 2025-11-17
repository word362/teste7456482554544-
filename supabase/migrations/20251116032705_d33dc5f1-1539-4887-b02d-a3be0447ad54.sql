-- Criar tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Usuários podem ver todos os perfis"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir seu próprio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('user', 'admin');

-- Criar tabela de roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Habilitar RLS na tabela user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_roles
CREATE POLICY "Usuários podem ver suas próprias roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Função security definer para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Adicionar role padrão de 'user'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Criar tabela de músicas
CREATE TABLE public.musicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  artista TEXT NOT NULL,
  video_id TEXT NOT NULL,
  thumbnail TEXT,
  duracao INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela musicas
ALTER TABLE public.musicas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para musicas (leitura pública)
CREATE POLICY "Todos podem ver músicas"
  ON public.musicas FOR SELECT
  USING (true);

-- Criar tabela de favoritos
CREATE TABLE public.favoritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  musica_id UUID REFERENCES public.musicas(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, musica_id)
);

-- Habilitar RLS na tabela favoritos
ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para favoritos
CREATE POLICY "Usuários podem ver seus próprios favoritos"
  ON public.favoritos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios favoritos"
  ON public.favoritos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios favoritos"
  ON public.favoritos FOR DELETE
  USING (auth.uid() = user_id);

-- Atualizar políticas do search_cache para ser mais restritivo
DROP POLICY IF EXISTS "Permitir leitura pública de cache" ON public.search_cache;
DROP POLICY IF EXISTS "Sistema pode gerenciar cache" ON public.search_cache;

CREATE POLICY "Usuários autenticados podem ler cache"
  ON public.search_cache FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Sistema pode inserir no cache"
  ON public.search_cache FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar cache"
  ON public.search_cache FOR UPDATE
  USING (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger para atualizar updated_at em profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger para atualizar updated_at em musicas
CREATE TRIGGER update_musicas_updated_at
  BEFORE UPDATE ON public.musicas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();