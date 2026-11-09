-- ==============================================================================
-- SCRIPT COMPLETO DE ESTRUTURA E INSERTS PARA O SUPABASE (CETEC - PAINEL DE CLUBES)
-- ==============================================================================
-- Instruções:
-- 1. Abra o painel do seu projeto no Supabase: https://supabase.com/dashboard/project/medjlrmycnssnlzhzyrm
-- 2. Vá no menu lateral em "SQL Editor".
-- 3. Crie uma "New Query", cole todo este arquivo e clique em "RUN".
-- ==============================================================================

-- 1. EXTENSÃO PARA GERAR UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. CRIAÇÃO DAS TABELAS
-- ==============================================================================

-- TABELA: usuarios
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    acesso TEXT NOT NULL DEFAULT 'editor', -- 'administrador', 'editor', 'leitor'
    tipo_usuario TEXT NOT NULL DEFAULT 'utec', -- 'global', 'utec'
    utec TEXT DEFAULT '',
    ver_todas_utecs BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- TABELA: clubes
CREATE TABLE IF NOT EXISTS public.clubes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    escola TEXT NOT NULL DEFAULT '',
    utec TEXT NOT NULL DEFAULT '',
    nome_utec TEXT DEFAULT '',
    prof TEXT DEFAULT '',
    estag TEXT DEFAULT '',
    dias TEXT DEFAULT '',
    horario TEXT DEFAULT '',
    categoria TEXT NOT NULL DEFAULT 'CLUBES INICIAIS',
    status TEXT NOT NULL DEFAULT 'PENDENTE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- TABELA: alunos
CREATE TABLE IF NOT EXISTS public.alunos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_clube UUID NOT NULL REFERENCES public.clubes(id) ON DELETE CASCADE,
    matricula TEXT NOT NULL DEFAULT 'S/ MATRÍCULA',
    nome TEXT NOT NULL,
    sexo TEXT DEFAULT 'M' CHECK (sexo IN ('M', 'F')),
    data_registro TEXT DEFAULT to_char(now(), 'DD/MM/YYYY'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- TABELA: encontros
CREATE TABLE IF NOT EXISTS public.encontros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_clube UUID NOT NULL REFERENCES public.clubes(id) ON DELETE CASCADE,
    modulo TEXT DEFAULT '',
    assunto TEXT NOT NULL DEFAULT '',
    detalhamento TEXT DEFAULT '',
    data TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'A FAZER',
    frequencia TEXT DEFAULT '',
    quantidade_alunos INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. ÍNDICES DE ALTA PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(lower(email));
CREATE INDEX IF NOT EXISTS idx_clubes_utec ON public.clubes(utec);
CREATE INDEX IF NOT EXISTS idx_clubes_status ON public.clubes(status);
CREATE INDEX IF NOT EXISTS idx_alunos_id_clube ON public.alunos(id_clube);
CREATE INDEX IF NOT EXISTS idx_alunos_sexo ON public.alunos(sexo);
CREATE INDEX IF NOT EXISTS idx_encontros_id_clube ON public.encontros(id_clube);

-- ==============================================================================
-- 4. TRIGGER PARA ATUALIZAR AUTOMATICAMENTE updated_at
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_usuarios_updated_at ON public.usuarios;
CREATE TRIGGER trg_usuarios_updated_at
BEFORE UPDATE ON public.usuarios
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_clubes_updated_at ON public.clubes;
CREATE TRIGGER trg_clubes_updated_at
BEFORE UPDATE ON public.clubes
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_encontros_updated_at ON public.encontros;
CREATE TRIGGER trg_encontros_updated_at
BEFORE UPDATE ON public.encontros
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) - POLÍTICAS DE ACESSO
-- ==============================================================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encontros ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir operações com a Publishable/Anon Key e usuários autenticados
DROP POLICY IF EXISTS "Acesso publico usuarios" ON public.usuarios;
CREATE POLICY "Acesso publico usuarios" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso publico clubes" ON public.clubes;
CREATE POLICY "Acesso publico clubes" ON public.clubes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso publico alunos" ON public.alunos;
CREATE POLICY "Acesso publico alunos" ON public.alunos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso publico encontros" ON public.encontros;
CREATE POLICY "Acesso publico encontros" ON public.encontros FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 6. INSERTS: DADOS INICIAIS
-- ==============================================================================

-- 6.1 USUÁRIOS DO SISTEMA
INSERT INTO public.usuarios (nome, email, senha, acesso, tipo_usuario, utec, ver_todas_utecs)
VALUES
    ('ADMINISTRADOR CETEC', 'admin@cetec.com', 'admin123', 'administrador', 'global', '', true),
    ('PROF. CARLOS SILVA', 'carlos.silva@cetec.com', 'cetec123', 'editor', 'utec', 'UTEC GREGÓRIO BEZERRA', false),
    ('PROFª. ANA SOUZA', 'ana.souza@cetec.com', 'cetec123', 'editor', 'utec', 'UTEC CORDEIRO', false),
    ('PROF. MARCOS LIMA', 'marcos.lima@cetec.com', 'cetec123', 'editor', 'utec', 'UTEC ALTO SANTA TEREZINHA', false),
    ('LEITOR CONSULTA', 'leitor@cetec.com', 'leitor123', 'leitor', 'global', '', true)
ON CONFLICT (email) DO NOTHING;

-- 6.2 CLUBES DE ROBÓTICA
INSERT INTO public.clubes (id, nome, escola, utec, nome_utec, prof, estag, dias, horario, categoria, status)
VALUES
    (
        'a1b2c3d4-0001-4000-8000-000000000001',
        'ROBÓTICA CRIATIVA',
        'E.M. SANTOS DUMONT',
        'UTEC GREGÓRIO BEZERRA',
        'UTEC Gregório Bezerra',
        'CARLOS SILVA',
        'JOÃO PEDRO',
        'SEGUNDA E QUARTA',
        '14:00 ÀS 16:00',
        'CLUBES INICIAIS',
        'EM ANDAMENTO'
    ),
    (
        'a1b2c3d4-0002-4000-8000-000000000002',
        'INVENTORES DO FUTURO',
        'E.M. PAULO FREIRE',
        'UTEC CORDEIRO',
        'UTEC Cordeiro',
        'ANA SOUZA',
        'MARIA EDUARDA',
        'TERÇA E QUINTA',
        '09:00 ÀS 11:00',
        'CLUBES INICIAIS',
        'EM ANDAMENTO'
    ),
    (
        'a1b2c3d4-0003-4000-8000-000000000003',
        'MAKERS CETEC AVANÇADO',
        'E.M. ANÍSIO TEIXEIRA',
        'UTEC ALTO SANTA TEREZINHA',
        'UTEC Alto Santa Terezinha',
        'MARCOS LIMA',
        'LUCAS RAFAEL',
        'SEXTA-FEIRA',
        '13:30 ÀS 16:30',
        'CLUBES AVANÇADOS',
        'CONCLUÍDO'
    ),
    (
        'a1b2c3d4-0004-4000-8000-000000000004',
        'AUTOMAÇÃO JOVEM',
        'E.M. PROF. JOAQUIM',
        'UTEC GREGÓRIO BEZERRA',
        'UTEC Gregório Bezerra',
        'CARLOS SILVA',
        'JOÃO PEDRO',
        'TERÇA E QUINTA',
        '14:00 ÀS 16:00',
        'CLUBES INICIAIS',
        'PENDENTE'
    )
ON CONFLICT (id) DO NOTHING;

-- 6.3 ALUNOS DOS CLUBES (com meninos e meninas para estatísticas do dashboard)
INSERT INTO public.alunos (id, id_clube, matricula, nome, sexo, data_registro)
VALUES
    -- Alunos do Clube 1 (Robótica Criativa)
    ('b1b2c3d4-0001-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', '20240101', 'ARTHUR SILVEIRA', 'M', '10/02/2026'),
    ('b1b2c3d4-0002-4000-8000-000000000002', 'a1b2c3d4-0001-4000-8000-000000000001', '20240102', 'BEATRIZ COSTA', 'F', '10/02/2026'),
    ('b1b2c3d4-0003-4000-8000-000000000003', 'a1b2c3d4-0001-4000-8000-000000000001', '20240103', 'CAIO FELIPE', 'M', '11/02/2026'),
    ('b1b2c3d4-0004-4000-8000-000000000004', 'a1b2c3d4-0001-4000-8000-000000000001', '20240104', 'DANIELA SANTOS', 'F', '11/02/2026'),
    ('b1b2c3d4-0005-4000-8000-000000000005', 'a1b2c3d4-0001-4000-8000-000000000001', '20240105', 'ENZO GABRIEL', 'M', '12/02/2026'),

    -- Alunos do Clube 2 (Inventores do Futuro)
    ('b1b2c3d4-0006-4000-8000-000000000006', 'a1b2c3d4-0002-4000-8000-000000000002', '20240201', 'FERNANDA LIMA', 'F', '15/02/2026'),
    ('b1b2c3d4-0007-4000-8000-000000000007', 'a1b2c3d4-0002-4000-8000-000000000002', '20240202', 'GUILHERME ALVES', 'M', '15/02/2026'),
    ('b1b2c3d4-0008-4000-8000-000000000008', 'a1b2c3d4-0002-4000-8000-000000000002', '20240203', 'HELENA ROCHA', 'F', '16/02/2026'),
    ('b1b2c3d4-0009-4000-8000-000000000009', 'a1b2c3d4-0002-4000-8000-000000000002', '20240204', 'IGOR MARTINS', 'M', '16/02/2026'),

    -- Alunos do Clube 3 (Makers CETEC Avançado)
    ('b1b2c3d4-0010-4000-8000-000000000010', 'a1b2c3d4-0003-4000-8000-000000000003', '20240301', 'JULIA BARROS', 'F', '01/03/2026'),
    ('b1b2c3d4-0011-4000-8000-000000000011', 'a1b2c3d4-0003-4000-8000-000000000003', '20240302', 'LUCAS MEDEIROS', 'M', '01/03/2026'),
    ('b1b2c3d4-0012-4000-8000-000000000012', 'a1b2c3d4-0003-4000-8000-000000000003', '20240303', 'MANUELA FREIRE', 'F', '02/03/2026'),

    -- Alunos do Clube 4 (Automação Jovem)
    ('b1b2c3d4-0013-4000-8000-000000000013', 'a1b2c3d4-0004-4000-8000-000000000004', '20240401', 'NICOLAS TEIXEIRA', 'M', '10/03/2026'),
    ('b1b2c3d4-0014-4000-8000-000000000014', 'a1b2c3d4-0004-4000-8000-000000000004', '20240402', 'OLIVIA CARDOSO', 'F', '10/03/2026')
ON CONFLICT (id) DO NOTHING;

-- 6.4 ENCONTROS DOS CLUBES
INSERT INTO public.encontros (id, id_clube, modulo, assunto, detalhamento, data, status, frequencia, quantidade_alunos)
VALUES
    -- Encontros do Clube 1
    (
        'c1b2c3d4-0001-4000-8000-000000000001',
        'a1b2c3d4-0001-4000-8000-000000000001',
        'MOD 1',
        'INTRODUÇÃO À ROBÓTICA EDUCACIONAL',
        'Apresentação dos kits de robótica, regras de convivência e primeiros conceitos de mecânica.',
        '10/02/2026',
        'CONCLUÍDO',
        '100%',
        5
    ),
    (
        'c1b2c3d4-0002-4000-8000-000000000002',
        'a1b2c3d4-0001-4000-8000-000000000001',
        'MOD 1',
        'SENSORES E ATUADORES',
        'Conexão prática de sensores ultrassônicos e motores DC. Demonstração de leitura analógica.',
        '17/02/2026',
        'CONCLUÍDO',
        '80%',
        4
    ),
    (
        'c1b2c3d4-0003-4000-8000-000000000003',
        'a1b2c3d4-0001-4000-8000-000000000001',
        'MOD 2',
        'LÓGICA DE PROGRAMAÇÃO COM BLOCOS',
        'Estruturação de algoritmos condicionais (SE/ENTÃO) e loops para desvio de obstáculos.',
        '24/02/2026',
        'A FAZER',
        '',
        0
    ),

    -- Encontros do Clube 2
    (
        'c1b2c3d4-0004-4000-8000-000000000004',
        'a1b2c3d4-0002-4000-8000-000000000002',
        'MOD 1',
        'DESIGN THINKING E PROBLEMATIZAÇÃO',
        'Levantamento de desafios urbanos da comunidade escolar para criar soluções tecnológicas.',
        '12/02/2026',
        'CONCLUÍDO',
        '100%',
        4
    ),
    (
        'c1b2c3d4-0005-4000-8000-000000000005',
        'a1b2c3d4-0002-4000-8000-000000000002',
        'MOD 1',
        'PROTOTIPAGEM RÁPIDA COM MATERIAIS RECICLÁVEIS',
        'Construção de chassis para carrinhos autônomos com papelão, cola quente e servo motores.',
        '19/02/2026',
        'CONCLUÍDO',
        '75%',
        3
    ),

    -- Encontros do Clube 3
    (
        'c1b2c3d4-0006-4000-8000-000000000006',
        'a1b2c3d4-0003-4000-8000-000000000003',
        'MOD 1',
        'MICROCONTROLADORES ESP32 E IOT',
        'Comunicação Wi-Fi, MQTT e dashboard web para telemetria em tempo real.',
        '05/03/2026',
        'CONCLUÍDO',
        '100%',
        3
    ),
    (
        'c1b2c3d4-0007-4000-8000-000000000007',
        'a1b2c3d4-0003-4000-8000-000000000003',
        'MOD 2',
        'APRESENTAÇÃO DO PROJETO FINAL',
        'Banca examinadora e demonstração prática do robô seguidor de linha e resgatista.',
        '19/03/2026',
        'CONCLUÍDO',
        '100%',
        3
    )
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 7. TABELA E INSERTS DE ROTEIROS DIDÁTICOS (PLANOS DE AULA)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.roteiros_didaticos (
    id TEXT PRIMARY KEY,
    segmento TEXT NOT NULL DEFAULT 'ANOS INICIAIS', -- 'ANOS INICIAIS' ou 'ANOS FINAIS'
    titulo TEXT NOT NULL,
    subtitulo TEXT NOT NULL DEFAULT '',
    ano_sugerido TEXT DEFAULT '',
    categoria TEXT DEFAULT 'Robótica Educacional',
    duracao TEXT DEFAULT '2 Encontros (4h)',
    nivel TEXT DEFAULT 'Iniciante',
    bncc JSONB DEFAULT '[]'::jsonb,
    objetivos JSONB DEFAULT '[]'::jsonb,
    materiais JSONB DEFAULT '[]'::jsonb,
    etapas JSONB DEFAULT '{}'::jsonb,
    link_material TEXT DEFAULT '',
    autor TEXT DEFAULT 'Equipe Pedagógica CETEC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_roteiros_segmento ON public.roteiros_didaticos(segmento);
CREATE INDEX IF NOT EXISTS idx_roteiros_categoria ON public.roteiros_didaticos(categoria);

ALTER TABLE public.roteiros_didaticos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso publico roteiros" ON public.roteiros_didaticos;
CREATE POLICY "Acesso publico roteiros" ON public.roteiros_didaticos FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- FIM DO SCRIPT DE CONFIGURAÇÃO DO SUPABASE
-- ==============================================================================

