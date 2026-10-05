-- ==============================================================================
-- G2 DIÁRIAS & OPERACIONAL - SCRIPT DE INICIALIZAÇÃO SUPABASE (POSTGRESQL)
-- Execute este script completo no painel do Supabase: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. TABELA DE POSTOS OPERACIONAIS
CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT DEFAULT '',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE PRESTADORES / VIGILANTES
CREATE TABLE IF NOT EXISTS guards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    full_name TEXT DEFAULT '',
    post_id TEXT REFERENCES posts(id) ON DELETE SET NULL,
    phone TEXT DEFAULT '',
    pix_key TEXT DEFAULT '',
    pix_type TEXT DEFAULT '',
    default_shift_hours NUMERIC DEFAULT 3,
    hourly_rate NUMERIC DEFAULT 40,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE ESCALA / HORAS TRABALHADAS (SHIFTS)
CREATE TABLE IF NOT EXISTS shifts (
    month TEXT NOT NULL,
    guard_id TEXT NOT NULL,
    day INTEGER NOT NULL,
    hours NUMERIC NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (month, guard_id, day)
);

-- 4. TABELA DE OBSERVAÇÕES DE HORAS (DOBRAS, TROCAS, HORAS EXTRAS)
CREATE TABLE IF NOT EXISTS shift_notes (
    month TEXT NOT NULL,
    guard_id TEXT NOT NULL,
    day INTEGER NOT NULL,
    note TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (month, guard_id, day)
);

-- 5. TABELA DE PAGAMENTOS / STATUS DE QUINZENA
CREATE TABLE IF NOT EXISTS payments (
    key TEXT PRIMARY KEY, -- Formato: {month}_{guard_id}_{quinzena} (ex: 2026-09_g-carvalho_q1)
    month TEXT NOT NULL,
    guard_id TEXT NOT NULL,
    quinzena TEXT NOT NULL, -- 'q1' ou 'q2'
    status TEXT DEFAULT 'PAID',
    paid_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA DE CONFIGURAÇÕES GERAIS DO SISTEMA
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- HABILITAR SEGURANÇA POR LINHA (ROW LEVEL SECURITY - RLS)
-- Permite leitura e gravação pelo client anônimo da aplicação web
-- ==============================================================================

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE guards ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso irrestrito para anon (chave pública do app)
DROP POLICY IF EXISTS "Allow all access on posts" ON posts;
CREATE POLICY "Allow all access on posts" ON posts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access on guards" ON guards;
CREATE POLICY "Allow all access on guards" ON guards FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access on shifts" ON shifts;
CREATE POLICY "Allow all access on shifts" ON shifts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access on shift_notes" ON shift_notes;
CREATE POLICY "Allow all access on shift_notes" ON shift_notes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access on payments" ON payments;
CREATE POLICY "Allow all access on payments" ON payments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access on app_settings" ON app_settings;
CREATE POLICY "Allow all access on app_settings" ON app_settings FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- DADOS INICIAIS (SEED DATA)
-- Popula o banco com os postos, prestadores e escala padrão da planilha
-- ==============================================================================

-- Postos Iniciais
INSERT INTO posts (id, name, address, active) VALUES
('diadema', 'Diadema', 'Posto Diadema - SP', true),
('confianca', 'Confiança', 'Posto Confiança - SP', true),
('penha', 'Penha', 'Posto Penha - SP', true),
('santo-andre', 'Santo André', 'Posto Santo André - SP', true),
('zona-norte', 'Zona Norte', 'Posto Zona Norte - SP', true)
ON CONFLICT (id) DO NOTHING;

-- Prestadores Iniciais
INSERT INTO guards (id, name, full_name, post_id, phone, pix_key, pix_type, default_shift_hours, hourly_rate, active) VALUES
('g-carvalho', 'Carvalho', 'Carvalho Segurança', 'diadema', '(11) 98765-4321', '11987654321', 'Celular', 3, 40, true),
('g-novaes', 'Novaes', 'Novaes Segurança', 'diadema', '(11) 98765-4322', 'novaes.seguranca@gmail.com', 'E-mail', 3, 40, true),
('g-marinho', 'Marinho', 'Marinho Segurança', 'diadema', '(11) 98765-4323', '234.567.890-12', 'CPF', 3, 40, true),
('g-gomes', 'Gomes', 'Gomes Vigilância', 'confianca', '(11) 98765-4324', 'gomes.pix@gmail.com', 'E-mail', 3, 40, true),
('g-barbosa', 'Barbosa', 'Barbosa Segurança', 'confianca', '(11) 98765-4325', '345.678.901-23', 'CPF', 3, 40, true),
('g-miranda', 'Miranda', 'Miranda Segurança', 'confianca', '(11) 98765-4326', '11977665544', 'Celular', 3, 40, true),
('g-neto', 'Neto', 'Neto Segurança', 'penha', '(11) 98765-4327', 'neto.seg@outlook.com', 'E-mail', 3, 40, true),
('g-felipe', 'Felipe', 'Felipe Segurança', 'penha', '(11) 98765-4328', '456.789.012-34', 'CPF', 3, 40, true),
('g-oliveira', 'Oliveira', 'Oliveira Segurança', 'santo-andre', '(11) 98765-4329', 'oliveira.seg@gmail.com', 'E-mail', 3, 40, true),
('g-pereira', 'Pereira', 'Pereira Segurança', 'santo-andre', '(11) 98765-4330', '11966554433', 'Celular', 3, 40, true),
('g-david', 'David', 'David Segurança', 'zona-norte', '(11) 98765-4331', 'david.g2seg@gmail.com', 'E-mail', 3, 40, true),
('g-alex', 'Alex', 'Alex Segurança', 'zona-norte', '(11) 98765-4332', '567.890.123-45', 'CPF', 3, 40, true)
ON CONFLICT (id) DO NOTHING;

-- Configurações Gerais
INSERT INTO app_settings (key, value) VALUES
('hourly_rate', '40'),
('budget_ceiling', '12000'),
('selected_month', '2026-09')
ON CONFLICT (key) DO NOTHING;

-- Pagamento Inicial de Exemplo
INSERT INTO payments (key, month, guard_id, quinzena, status, paid_at, notes) VALUES
('2026-09_g-carvalho_q1', '2026-09', 'g-carvalho', 'q1', 'PAID', '2026-09-16T10:00:00Z', 'PIX Realizado')
ON CONFLICT (key) DO NOTHING;

-- Escala Inicial de Setembro/2026 (2026-09)
INSERT INTO shifts (month, guard_id, day, hours) VALUES
-- Carvalho (Diadema)
('2026-09', 'g-carvalho', 2, 4), ('2026-09', 'g-carvalho', 4, 4), ('2026-09', 'g-carvalho', 6, 4),
('2026-09', 'g-carvalho', 8, 4), ('2026-09', 'g-carvalho', 10, 4), ('2026-09', 'g-carvalho', 12, 4),
('2026-09', 'g-carvalho', 16, 4), ('2026-09', 'g-carvalho', 18, 0), ('2026-09', 'g-carvalho', 20, 0),
('2026-09', 'g-carvalho', 22, 0), ('2026-09', 'g-carvalho', 24, 4), ('2026-09', 'g-carvalho', 25, 4),
('2026-09', 'g-carvalho', 26, 7), ('2026-09', 'g-carvalho', 28, 4), ('2026-09', 'g-carvalho', 30, 4),

-- Novaes (Diadema)
('2026-09', 'g-novaes', 1, 4), ('2026-09', 'g-novaes', 3, 4), ('2026-09', 'g-novaes', 13, 4),
('2026-09', 'g-novaes', 14, 4), ('2026-09', 'g-novaes', 15, 4), ('2026-09', 'g-novaes', 18, 4),
('2026-09', 'g-novaes', 21, 4), ('2026-09', 'g-novaes', 23, 4), ('2026-09', 'g-novaes', 27, 4),
('2026-09', 'g-novaes', 29, 4), ('2026-09', 'g-novaes', 31, 4),

-- Marinho (Diadema)
('2026-09', 'g-marinho', 5, 4), ('2026-09', 'g-marinho', 7, 4), ('2026-09', 'g-marinho', 9, 4),
('2026-09', 'g-marinho', 11, 4), ('2026-09', 'g-marinho', 19, 4),

-- Gomes (Confiança)
('2026-09', 'g-gomes', 1, 3), ('2026-09', 'g-gomes', 3, 3), ('2026-09', 'g-gomes', 5, 3),
('2026-09', 'g-gomes', 7, 3), ('2026-09', 'g-gomes', 9, 3), ('2026-09', 'g-gomes', 11, 3),
('2026-09', 'g-gomes', 13, 3), ('2026-09', 'g-gomes', 15, 3), ('2026-09', 'g-gomes', 17, 3),
('2026-09', 'g-gomes', 19, 3), ('2026-09', 'g-gomes', 21, 3), ('2026-09', 'g-gomes', 23, 3),
('2026-09', 'g-gomes', 24, 3), ('2026-09', 'g-gomes', 25, 3), ('2026-09', 'g-gomes', 27, 3),
('2026-09', 'g-gomes', 29, 3), ('2026-09', 'g-gomes', 31, 3),

-- Barbosa (Confiança)
('2026-09', 'g-barbosa', 4, 3), ('2026-09', 'g-barbosa', 6, 3), ('2026-09', 'g-barbosa', 8, 3),
('2026-09', 'g-barbosa', 10, 3), ('2026-09', 'g-barbosa', 14, 3), ('2026-09', 'g-barbosa', 16, 3),
('2026-09', 'g-barbosa', 20, 3), ('2026-09', 'g-barbosa', 22, 3), ('2026-09', 'g-barbosa', 28, 3),

-- Miranda (Confiança)
('2026-09', 'g-miranda', 2, 3), ('2026-09', 'g-miranda', 12, 3), ('2026-09', 'g-miranda', 18, 3),
('2026-09', 'g-miranda', 26, 3), ('2026-09', 'g-miranda', 30, 3),

-- Neto (Penha)
('2026-09', 'g-neto', 2, 3), ('2026-09', 'g-neto', 4, 3), ('2026-09', 'g-neto', 6, 3),
('2026-09', 'g-neto', 8, 0), ('2026-09', 'g-neto', 10, 3), ('2026-09', 'g-neto', 12, 3),
('2026-09', 'g-neto', 14, 3), ('2026-09', 'g-neto', 16, 3), ('2026-09', 'g-neto', 18, 3),
('2026-09', 'g-neto', 20, 3), ('2026-09', 'g-neto', 22, 3), ('2026-09', 'g-neto', 24, 3),
('2026-09', 'g-neto', 26, 3), ('2026-09', 'g-neto', 28, 3), ('2026-09', 'g-neto', 30, 3),

-- Felipe (Penha)
('2026-09', 'g-felipe', 1, 3), ('2026-09', 'g-felipe', 3, 3), ('2026-09', 'g-felipe', 5, 0),
('2026-09', 'g-felipe', 7, 3), ('2026-09', 'g-felipe', 9, 0), ('2026-09', 'g-felipe', 11, 3),
('2026-09', 'g-felipe', 13, 3), ('2026-09', 'g-felipe', 17, 3), ('2026-09', 'g-felipe', 19, 3),
('2026-09', 'g-felipe', 21, 3), ('2026-09', 'g-felipe', 23, 3), ('2026-09', 'g-felipe', 25, 3),
('2026-09', 'g-felipe', 27, 3), ('2026-09', 'g-felipe', 29, 0), ('2026-09', 'g-felipe', 31, 0),

-- Oliveira (Santo André)
('2026-09', 'g-oliveira', 2, 3), ('2026-09', 'g-oliveira', 4, 3), ('2026-09', 'g-oliveira', 6, 3),
('2026-09', 'g-oliveira', 8, 3), ('2026-09', 'g-oliveira', 10, 3), ('2026-09', 'g-oliveira', 12, 0),
('2026-09', 'g-oliveira', 14, 3), ('2026-09', 'g-oliveira', 16, 3), ('2026-09', 'g-oliveira', 20, 0),
('2026-09', 'g-oliveira', 22, 3), ('2026-09', 'g-oliveira', 24, 3), ('2026-09', 'g-oliveira', 26, 0),
('2026-09', 'g-oliveira', 28, 3), ('2026-09', 'g-oliveira', 30, 0),

-- Pereira (Santo André)
('2026-09', 'g-pereira', 1, 3), ('2026-09', 'g-pereira', 3, 3), ('2026-09', 'g-pereira', 5, 3),
('2026-09', 'g-pereira', 7, 3), ('2026-09', 'g-pereira', 9, 3), ('2026-09', 'g-pereira', 11, 3),
('2026-09', 'g-pereira', 13, 3), ('2026-09', 'g-pereira', 15, 3), ('2026-09', 'g-pereira', 17, 3),
('2026-09', 'g-pereira', 18, 3), ('2026-09', 'g-pereira', 19, 3), ('2026-09', 'g-pereira', 21, 3),
('2026-09', 'g-pereira', 23, 3), ('2026-09', 'g-pereira', 25, 3), ('2026-09', 'g-pereira', 27, 3),
('2026-09', 'g-pereira', 29, 0), ('2026-09', 'g-pereira', 31, 0),

-- David (Zona Norte)
('2026-09', 'g-david', 2, 3), ('2026-09', 'g-david', 4, 3), ('2026-09', 'g-david', 6, 3),
('2026-09', 'g-david', 8, 3), ('2026-09', 'g-david', 10, 3), ('2026-09', 'g-david', 12, 3),
('2026-09', 'g-david', 14, 3), ('2026-09', 'g-david', 16, 3), ('2026-09', 'g-david', 18, 3),
('2026-09', 'g-david', 20, 3), ('2026-09', 'g-david', 22, 3), ('2026-09', 'g-david', 24, 3),
('2026-09', 'g-david', 28, 3), ('2026-09', 'g-david', 29, 3), ('2026-09', 'g-david', 30, 3),
('2026-09', 'g-david', 31, 3),

-- Alex (Zona Norte)
('2026-09', 'g-alex', 1, 3), ('2026-09', 'g-alex', 3, 3), ('2026-09', 'g-alex', 5, 3),
('2026-09', 'g-alex', 7, 3), ('2026-09', 'g-alex', 9, 3), ('2026-09', 'g-alex', 11, 3),
('2026-09', 'g-alex', 13, 3), ('2026-09', 'g-alex', 15, 3), ('2026-09', 'g-alex', 17, 3),
('2026-09', 'g-alex', 19, 3), ('2026-09', 'g-alex', 20, 3), ('2026-09', 'g-alex', 21, 3),
('2026-09', 'g-alex', 23, 3), ('2026-09', 'g-alex', 25, 3), ('2026-09', 'g-alex', 26, 3),
('2026-09', 'g-alex', 27, 3), ('2026-09', 'g-alex', 28, 3), ('2026-09', 'g-alex', 29, 3),
('2026-09', 'g-alex', 30, 3)
ON CONFLICT (month, guard_id, day) DO NOTHING;
