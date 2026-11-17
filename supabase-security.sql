-- ==============================================================================
-- G2 DIÁRIAS & OPERACIONAL - SEGURANÇA (SUPABASE AUTH + RLS POR PAPEL)
--
-- Execute no painel do Supabase: SQL Editor -> New Query -> cole tudo -> Run.
-- Pode ser executado mais de uma vez sem problema (idempotente).
--
-- ANTES de rodar:
--   1. Faça backup dos dados (Database -> Backups, ou exporte as tabelas).
--   2. Em Authentication -> Users -> "Add user", crie a conta de cada gestor
--      (e-mail + senha forte, marque "Auto Confirm User").
--   3. Em Authentication -> Sign In / Providers, DESATIVE "Allow new users to sign up".
--
-- DEPOIS de rodar: cadastre os gestores na tabela managers (veja o final do arquivo).
-- Atenção: assim que este script rodar, a versão ANTIGA do app (sem login Supabase)
-- deixa de conseguir ler/gravar dados. Publique a versão nova do app junto.
-- ==============================================================================

-- 1. TABELA DE GESTORES (quem pode acessar o sistema e com qual papel)
CREATE TABLE IF NOT EXISTS public.managers (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'supervisor' CHECK (role IN ('diretor', 'supervisor')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;

-- 2. FUNÇÕES AUXILIARES (SECURITY DEFINER para consultar managers sem recursão de RLS)
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (SELECT 1 FROM public.managers WHERE user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_director()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (SELECT 1 FROM public.managers WHERE user_id = auth.uid() AND role = 'diretor');
$$;

REVOKE ALL ON FUNCTION public.is_manager() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_director() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_director() TO authenticated;

-- 3. REMOVER ACESSO ANÔNIMO (a chave pública deixa de dar acesso aos dados)
REVOKE ALL ON public.posts, public.guards, public.shifts, public.shift_notes,
              public.payments, public.app_settings, public.managers FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts, public.guards, public.shifts,
      public.shift_notes, public.payments, public.app_settings TO authenticated;
GRANT SELECT ON public.managers TO authenticated;

-- 4. APAGAR POLÍTICAS ANTIGAS ("Allow all access" = acesso irrestrito)
DROP POLICY IF EXISTS "Allow all access on posts" ON public.posts;
DROP POLICY IF EXISTS "Allow all access on guards" ON public.guards;
DROP POLICY IF EXISTS "Allow all access on shifts" ON public.shifts;
DROP POLICY IF EXISTS "Allow all access on shift_notes" ON public.shift_notes;
DROP POLICY IF EXISTS "Allow all access on payments" ON public.payments;
DROP POLICY IF EXISTS "Allow all access on app_settings" ON public.app_settings;

-- 5. NOVAS POLÍTICAS: somente gestores autenticados e cadastrados em managers
DROP POLICY IF EXISTS "Managers full access on posts" ON public.posts;
CREATE POLICY "Managers full access on posts" ON public.posts
    FOR ALL TO authenticated USING (public.is_manager()) WITH CHECK (public.is_manager());

DROP POLICY IF EXISTS "Managers full access on guards" ON public.guards;
CREATE POLICY "Managers full access on guards" ON public.guards
    FOR ALL TO authenticated USING (public.is_manager()) WITH CHECK (public.is_manager());

DROP POLICY IF EXISTS "Managers full access on shifts" ON public.shifts;
CREATE POLICY "Managers full access on shifts" ON public.shifts
    FOR ALL TO authenticated USING (public.is_manager()) WITH CHECK (public.is_manager());

DROP POLICY IF EXISTS "Managers full access on shift_notes" ON public.shift_notes;
CREATE POLICY "Managers full access on shift_notes" ON public.shift_notes
    FOR ALL TO authenticated USING (public.is_manager()) WITH CHECK (public.is_manager());

DROP POLICY IF EXISTS "Managers full access on payments" ON public.payments;
CREATE POLICY "Managers full access on payments" ON public.payments
    FOR ALL TO authenticated USING (public.is_manager()) WITH CHECK (public.is_manager());

-- Configurações (taxa padrão, teto): todos os gestores leem, só o diretor altera
DROP POLICY IF EXISTS "Managers read app_settings" ON public.app_settings;
CREATE POLICY "Managers read app_settings" ON public.app_settings
    FOR SELECT TO authenticated USING (public.is_manager());

DROP POLICY IF EXISTS "Director writes app_settings" ON public.app_settings;
CREATE POLICY "Director writes app_settings" ON public.app_settings
    FOR ALL TO authenticated USING (public.is_director()) WITH CHECK (public.is_director());

-- Gestores: cada um vê o próprio cadastro; o diretor vê todos.
-- Inclusão/alteração de gestores somente pelo SQL Editor (sem política de escrita).
DROP POLICY IF EXISTS "Managers read managers" ON public.managers;
CREATE POLICY "Managers read managers" ON public.managers
    FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_director());

-- 6. REMOVER A SENHA ANTIGA GUARDADA EM TEXTO CLARO
DELETE FROM public.app_settings WHERE key IN ('manager_password', 'selected_month');

-- ==============================================================================
-- 7. CADASTRAR OS GESTORES (rode depois de criar as contas em Authentication -> Users)
--    Troque o e-mail e o nome. Papel: 'diretor' (acesso total) ou 'supervisor'.
-- ==============================================================================
-- INSERT INTO public.managers (user_id, name, role)
-- SELECT id, 'Nome do Diretor', 'diretor' FROM auth.users WHERE email = 'diretor@exemplo.com'
-- ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
--
-- INSERT INTO public.managers (user_id, name, role)
-- SELECT id, 'Nome do Supervisor', 'supervisor' FROM auth.users WHERE email = 'supervisor@exemplo.com'
-- ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
