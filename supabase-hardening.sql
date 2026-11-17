-- ==============================================================================
-- G2 OPERACIONAL — REFORÇO DO BANCO (validações + registro de alterações)
--
-- Pode ser executado com o app em uso, antes ou depois do supabase-security.sql.
-- Rodar de novo não causa problema (o script verifica o que já existe).
--
-- Execute no Supabase: SQL Editor -> New Query -> cole tudo -> Run
-- Recomendado: faça antes um backup (Database -> Backups) ou "Salvar Cópia" no app.
-- ==============================================================================


-- ------------------------------------------------------------------------------
-- 1. VALIDAÇÕES (CHECK)
-- Criadas como NOT VALID: valem para toda gravação NOVA, mas não reprovam os
-- dados que já estão no banco. O app já respeita todos esses limites.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION pg_temp.add_check(tbl TEXT, cname TEXT, expr TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = cname) THEN
    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I CHECK (%s) NOT VALID', tbl, cname, expr);
  END IF;
END $$;

-- Mês no formato AAAA-MM, dia de 1 a 31, horas de 0 a 24
SELECT pg_temp.add_check('shifts', 'shifts_month_format', $$month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'$$);
SELECT pg_temp.add_check('shifts', 'shifts_day_range',    $$day BETWEEN 1 AND 31$$);
SELECT pg_temp.add_check('shifts', 'shifts_hours_range',  $$hours >= 0 AND hours <= 24$$);
SELECT pg_temp.add_check('shifts', 'shifts_guard_id_safe', $$guard_id NOT IN ('__proto__', 'constructor', 'prototype')$$);

SELECT pg_temp.add_check('shift_notes', 'shift_notes_month_format', $$month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'$$);
SELECT pg_temp.add_check('shift_notes', 'shift_notes_day_range',    $$day BETWEEN 1 AND 31$$);
SELECT pg_temp.add_check('shift_notes', 'shift_notes_note_length',  $$char_length(note) <= 1000$$);
SELECT pg_temp.add_check('shift_notes', 'shift_notes_guard_id_safe', $$guard_id NOT IN ('__proto__', 'constructor', 'prototype')$$);

-- Pagamentos: só 1ª/2ª quinzena e status conhecidos
SELECT pg_temp.add_check('payments', 'payments_quinzena_valid', $$quinzena IN ('q1', 'q2')$$);
SELECT pg_temp.add_check('payments', 'payments_status_valid',   $$status IN ('PAID', 'PENDING')$$);
SELECT pg_temp.add_check('payments', 'payments_month_format',   $$month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'$$);
SELECT pg_temp.add_check('payments', 'payments_key_safe',       $$key NOT IN ('__proto__', 'constructor', 'prototype')$$);

-- Prestadores: valores e tamanhos razoáveis
SELECT pg_temp.add_check('guards', 'guards_id_safe',        $$id NOT IN ('__proto__', 'constructor', 'prototype')$$);
SELECT pg_temp.add_check('guards', 'guards_rate_range',     $$hourly_rate >= 0 AND hourly_rate <= 10000$$);
SELECT pg_temp.add_check('guards', 'guards_shift_hours',    $$default_shift_hours >= 0 AND default_shift_hours <= 24$$);
SELECT pg_temp.add_check('guards', 'guards_text_lengths',
  $$char_length(name) <= 200 AND char_length(full_name) <= 200 AND char_length(phone) <= 40
    AND char_length(pix_key) <= 200 AND char_length(pix_type) <= 40$$);

SELECT pg_temp.add_check('posts', 'posts_id_safe',      $$id NOT IN ('__proto__', 'constructor', 'prototype')$$);
SELECT pg_temp.add_check('posts', 'posts_text_lengths', $$char_length(name) <= 200 AND char_length(address) <= 500$$);

SELECT pg_temp.add_check('app_settings', 'app_settings_key_safe',     $$key NOT IN ('__proto__', 'constructor', 'prototype')$$);
SELECT pg_temp.add_check('app_settings', 'app_settings_value_length', $$char_length(value) <= 2000$$);


-- ------------------------------------------------------------------------------
-- 2. REGISTRO DE ALTERAÇÕES (AUDITORIA)
-- Toda mudança em pagamentos, prestadores (inclusive chave PIX), postos,
-- configurações e escala fica gravada aqui: o que mudou, antes/depois e quando.
-- Ninguém pelo app consegue apagar ou editar este registro.
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    table_name TEXT NOT NULL,
    action TEXT NOT NULL,           -- INSERT, UPDATE ou DELETE
    row_key TEXT,                   -- identificação da linha (ex: 2026-11_g-carvalho_q1)
    old_data JSONB,
    new_data JSONB,
    actor_id UUID,                  -- usuário logado (preenchido após o login novo)
    actor_role TEXT                 -- 'anon' (login antigo) ou 'authenticated'
);

CREATE INDEX IF NOT EXISTS audit_log_at_idx ON audit_log (at DESC);
CREATE INDEX IF NOT EXISTS audit_log_table_key_idx ON audit_log (table_name, row_key);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON audit_log FROM anon, authenticated;
REVOKE ALL ON SEQUENCE audit_log_id_seq FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.audit_row_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_j JSONB := CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END;
  new_j JSONB := CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END;
  src   JSONB := COALESCE(new_j, old_j);
  rkey  TEXT;
BEGIN
  -- Regravação sem mudança real (o app reenvia linhas iguais): não registra
  IF TG_OP = 'UPDATE' AND (old_j - 'updated_at') = (new_j - 'updated_at') THEN
    RETURN NEW;
  END IF;

  rkey := CASE TG_TABLE_NAME
    WHEN 'payments'     THEN src->>'key'
    WHEN 'app_settings' THEN src->>'key'
    WHEN 'shifts'       THEN concat_ws('_', src->>'month', src->>'guard_id', src->>'day')
    WHEN 'shift_notes'  THEN concat_ws('_', src->>'month', src->>'guard_id', src->>'day')
    ELSE src->>'id'
  END;

  -- Nunca copiar senha para o registro
  IF TG_TABLE_NAME = 'app_settings' AND rkey ILIKE '%password%' THEN
    old_j := CASE WHEN old_j IS NULL THEN NULL ELSE jsonb_set(old_j, '{value}', '"***"') END;
    new_j := CASE WHEN new_j IS NULL THEN NULL ELSE jsonb_set(new_j, '{value}', '"***"') END;
  END IF;

  INSERT INTO audit_log (table_name, action, row_key, old_data, new_data, actor_id, actor_role)
  VALUES (
    TG_TABLE_NAME, TG_OP, rkey, old_j, new_j,
    auth.uid(),
    COALESCE(auth.jwt()->>'role', current_user)
  );

  RETURN COALESCE(NEW, OLD);
END $$;

REVOKE EXECUTE ON FUNCTION public.audit_row_change() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['payments', 'guards', 'posts', 'app_settings', 'shifts', 'shift_notes'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%1$s ON %1$I', t);
    EXECUTE format(
      'CREATE TRIGGER audit_%1$s AFTER INSERT OR UPDATE OR DELETE ON %1$I
         FOR EACH ROW EXECUTE FUNCTION public.audit_row_change()', t);
  END LOOP;
END $$;

-- Depois do login novo (supabase-security.sql), o diretor pode consultar o registro
DO $$
BEGIN
  IF to_regprocedure('public.is_director()') IS NOT NULL THEN
    GRANT SELECT ON audit_log TO authenticated;
    DROP POLICY IF EXISTS "Director reads audit log" ON audit_log;
    CREATE POLICY "Director reads audit log" ON audit_log
      FOR SELECT TO authenticated USING (public.is_director());
  END IF;
END $$;


-- ==============================================================================
-- CONSULTAS ÚTEIS (rode separadamente quando precisar)
-- ==============================================================================

-- Últimas 50 alterações:
--   SELECT at, table_name, action, row_key, old_data, new_data FROM audit_log ORDER BY at DESC LIMIT 50;

-- Quem teve a chave PIX trocada, com valor antigo e novo:
--   SELECT at, row_key, old_data->>'pix_key' AS pix_antigo, new_data->>'pix_key' AS pix_novo
--   FROM audit_log
--   WHERE table_name = 'guards' AND action = 'UPDATE'
--     AND old_data->>'pix_key' IS DISTINCT FROM new_data->>'pix_key'
--   ORDER BY at DESC;

-- Pagamentos marcados/desmarcados:
--   SELECT at, action, row_key FROM audit_log WHERE table_name = 'payments' ORDER BY at DESC;

-- Linhas antigas que não passariam nas validações (para corrigir antes de VALIDATE):
--   SELECT * FROM shifts WHERE hours < 0 OR hours > 24 OR day NOT BETWEEN 1 AND 31;
--   SELECT * FROM payments WHERE quinzena NOT IN ('q1','q2') OR status NOT IN ('PAID','PENDING');
-- Se não retornarem nada, pode validar de vez:
--   ALTER TABLE shifts VALIDATE CONSTRAINT shifts_hours_range;   (e assim por diante)

-- Limpeza opcional de registros com mais de 2 anos:
--   DELETE FROM audit_log WHERE at < NOW() - INTERVAL '2 years';
