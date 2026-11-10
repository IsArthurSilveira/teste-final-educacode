-- ==============================================================================
-- SCRIPT COMPLETO DE CRIAÇÃO DO BANCO DE DADOS SUPABASE (CETEC - EDUCACODE)
-- ==============================================================================
-- Este script cria todas as tabelas necessárias para o ecossistema Educacode CETEC:
--  1. usuarios (com registro único do Admin Supremo)
--  2. clubes (Clubes de Robótica Maker)
--  3. alunos (Estudantes vinculados aos clubes)
--  4. encontros (Aulas/sessões pedagógicas dos clubes)
--  5. roteiros_didaticos (Catálogo pedagógico e planos de aula alinhados à BNCC)
--  6. clubes_competicao (Equipes de competição FLL, OBR, RECLINE)
--  7. competidores (Estudantes competidores)
--  8. encontros_competicao (Treinos e encontros de competição)
--  9. projetos_fic_fecom (Iniciação Científica e Feira de Conhecimento Maker)
-- 10. integrantes_projeto (Estudantes integrantes dos projetos científicos)
-- 11. galeria_fotos (Acervo fotográfico e mídias da robótica)
--
-- Como executar no Supabase:
-- 1. Acesse o painel do Supabase: https://supabase.com/dashboard
-- 2. Selecione o seu projeto e clique em "SQL Editor" no menu lateral.
-- 3. Abra uma "New Query", cole todo este código e clique em "RUN".
-- ==============================================================================

-- 1. HABILITAR EXTENSÃO PARA UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. CRIAÇÃO DAS TABELAS
-- ==============================================================================

-- 2.1 TABELA: usuarios
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    acesso TEXT NOT NULL DEFAULT 'editor', -- 'superadmin', 'administrador', 'editor', 'leitor'
    tipo_usuario TEXT NOT NULL DEFAULT 'utec', -- 'global', 'utec'
    utec TEXT DEFAULT '',
    ver_todas_utecs BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.2 TABELA: clubes (Clubes de Robótica)
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
    categoria TEXT NOT NULL DEFAULT 'CLUBES INICIAIS', -- 'CLUBES INICIAIS', 'CLUBES AVANÇADOS'
    status TEXT NOT NULL DEFAULT 'PENDENTE', -- 'PENDENTE', 'EM ANDAMENTO', 'CONCLUÍDO'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.3 TABELA: alunos
CREATE TABLE IF NOT EXISTS public.alunos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_clube UUID NOT NULL REFERENCES public.clubes(id) ON DELETE CASCADE,
    matricula TEXT NOT NULL DEFAULT 'S/ MATRÍCULA',
    nome TEXT NOT NULL,
    sexo TEXT DEFAULT 'M' CHECK (sexo IN ('M', 'F')),
    data_registro TEXT DEFAULT to_char(now(), 'DD/MM/YYYY'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.4 TABELA: encontros
CREATE TABLE IF NOT EXISTS public.encontros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_clube UUID NOT NULL REFERENCES public.clubes(id) ON DELETE CASCADE,
    modulo TEXT DEFAULT '',
    assunto TEXT NOT NULL DEFAULT '',
    detalhamento TEXT DEFAULT '',
    data TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'A FAZER', -- 'A FAZER', 'CONCLUÍDO'
    frequencia TEXT DEFAULT '',
    quantidade_alunos INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.5 TABELA: roteiros_didaticos (Planos de Aula & Catálogo BNCC)
CREATE TABLE IF NOT EXISTS public.roteiros_didaticos (
    id TEXT PRIMARY KEY,
    segmento TEXT NOT NULL DEFAULT 'ANOS INICIAIS', -- 'ANOS INICIAIS', 'ANOS FINAIS'
    titulo TEXT NOT NULL,
    subtitulo TEXT NOT NULL DEFAULT '',
    ano_sugerido TEXT DEFAULT '',
    categoria TEXT DEFAULT 'Robótica Educacional',
    modulo TEXT DEFAULT '',
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

-- 2.6 TABELA: clubes_competicao (Equipes de Competições de Robótica)
CREATE TABLE IF NOT EXISTS public.clubes_competicao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    escola TEXT NOT NULL DEFAULT '',
    utec TEXT NOT NULL DEFAULT '',
    competicao TEXT NOT NULL DEFAULT 'Geral', -- 'FLL', 'OBR', 'RECLINE', 'Geral'
    nivel TEXT NOT NULL DEFAULT 'Nível 1 (Anos Iniciais)', -- 'Nível 1 (Anos Iniciais)', 'Nível 2 (Anos Finais)'
    prof TEXT DEFAULT '',
    tecnico TEXT DEFAULT '',
    dias TEXT DEFAULT '',
    horario TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'em_andamento', 'concluido'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.7 TABELA: competidores (Estudantes das equipes de competição)
CREATE TABLE IF NOT EXISTS public.competidores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_clube_competicao UUID NOT NULL REFERENCES public.clubes_competicao(id) ON DELETE CASCADE,
    matricula TEXT DEFAULT '',
    nome TEXT NOT NULL,
    genero TEXT DEFAULT 'M' CHECK (genero IN ('M', 'F')),
    tamanho_camisa TEXT DEFAULT 'M',
    data_registro TEXT DEFAULT to_char(now(), 'DD/MM/YYYY'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.8 TABELA: encontros_competicao (Treinos e encontros de competição)
CREATE TABLE IF NOT EXISTS public.encontros_competicao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_clube_competicao UUID NOT NULL REFERENCES public.clubes_competicao(id) ON DELETE CASCADE,
    data TEXT DEFAULT '',
    assunto TEXT NOT NULL DEFAULT '',
    detalhamento TEXT DEFAULT '',
    quantidade_alunos TEXT DEFAULT '0',
    status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'concluido'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.9 TABELA: projetos_fic_fecom (Feira do Conhecimento & Iniciação Científica)
CREATE TABLE IF NOT EXISTS public.projetos_fic_fecom (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    modalidade TEXT NOT NULL DEFAULT 'FIC', -- 'FIC' ou 'FECOM'
    escola TEXT NOT NULL DEFAULT '',
    utec TEXT NOT NULL DEFAULT '',
    professor TEXT DEFAULT '',
    estagiario TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'em_andamento', 'concluido'
    data_cadastro TEXT DEFAULT to_char(now(), 'YYYY-MM-DD'),
    justificativa_tematica TEXT DEFAULT '',
    processo_construcao TEXT DEFAULT '',
    pensar_brincando TEXT DEFAULT '',
    linguagens_usadas JSONB DEFAULT '[]'::jsonb,
    proposito_coletivo TEXT DEFAULT '',
    recursos_robotica JSONB DEFAULT '[]'::jsonb,
    recursos_outro_descricao TEXT DEFAULT '',
    conteudos_escolares TEXT DEFAULT '',
    competencias_bncc TEXT DEFAULT '',
    habilidades_bncc TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.10 TABELA: integrantes_projeto (Estudantes integrantes do projeto FIC/FECOM)
CREATE TABLE IF NOT EXISTS public.integrantes_projeto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_projeto UUID NOT NULL REFERENCES public.projetos_fic_fecom(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    matricula TEXT DEFAULT '',
    ano_escolar TEXT DEFAULT '',
    genero TEXT DEFAULT 'M' CHECK (genero IN ('M', 'F')),
    tamanho_camisa TEXT DEFAULT 'M',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.11 TABELA: galeria_fotos (Acervo Maker de Fotos & Vídeos)
CREATE TABLE IF NOT EXISTS public.galeria_fotos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    titulo TEXT NOT NULL,
    legenda TEXT DEFAULT '',
    descricao TEXT DEFAULT '',
    autor TEXT NOT NULL DEFAULT 'CETEC',
    cargo_autor TEXT DEFAULT '',
    escola TEXT DEFAULT '',
    utec TEXT DEFAULT '',
    clube_nome TEXT DEFAULT '',
    modulo TEXT DEFAULT '',
    data_envio TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    curtidas INTEGER DEFAULT 0,
    consentimento_confirmado BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. ÍNDICES DE DESEMPENHO E CONSULTA
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(lower(email));
CREATE INDEX IF NOT EXISTS idx_usuarios_acesso ON public.usuarios(acesso);

CREATE INDEX IF NOT EXISTS idx_clubes_utec ON public.clubes(utec);
CREATE INDEX IF NOT EXISTS idx_clubes_status ON public.clubes(status);
CREATE INDEX IF NOT EXISTS idx_clubes_categoria ON public.clubes(categoria);

CREATE INDEX IF NOT EXISTS idx_alunos_id_clube ON public.alunos(id_clube);
CREATE INDEX IF NOT EXISTS idx_alunos_sexo ON public.alunos(sexo);

CREATE INDEX IF NOT EXISTS idx_encontros_id_clube ON public.encontros(id_clube);
CREATE INDEX IF NOT EXISTS idx_encontros_status ON public.encontros(status);

CREATE INDEX IF NOT EXISTS idx_roteiros_segmento ON public.roteiros_didaticos(segmento);
CREATE INDEX IF NOT EXISTS idx_roteiros_categoria ON public.roteiros_didaticos(categoria);

CREATE INDEX IF NOT EXISTS idx_comp_utec ON public.clubes_competicao(utec);
CREATE INDEX IF NOT EXISTS idx_comp_competicao ON public.clubes_competicao(competicao);
CREATE INDEX IF NOT EXISTS idx_comp_alunos_id_clube ON public.competidores(id_clube_competicao);
CREATE INDEX IF NOT EXISTS idx_comp_encontros_id_clube ON public.encontros_competicao(id_clube_competicao);

CREATE INDEX IF NOT EXISTS idx_fic_utec ON public.projetos_fic_fecom(utec);
CREATE INDEX IF NOT EXISTS idx_fic_modalidade ON public.projetos_fic_fecom(modalidade);
CREATE INDEX IF NOT EXISTS idx_fic_integrantes_id_proj ON public.integrantes_projeto(id_projeto);

CREATE INDEX IF NOT EXISTS idx_galeria_utec ON public.galeria_fotos(utec);
CREATE INDEX IF NOT EXISTS idx_galeria_clube ON public.galeria_fotos(clube_nome);

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

DROP TRIGGER IF EXISTS trg_roteiros_updated_at ON public.roteiros_didaticos;
CREATE TRIGGER trg_roteiros_updated_at
BEFORE UPDATE ON public.roteiros_didaticos
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_clubes_competicao_updated_at ON public.clubes_competicao;
CREATE TRIGGER trg_clubes_competicao_updated_at
BEFORE UPDATE ON public.clubes_competicao
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_projetos_fic_fecom_updated_at ON public.projetos_fic_fecom;
CREATE TRIGGER trg_projetos_fic_fecom_updated_at
BEFORE UPDATE ON public.projetos_fic_fecom
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) - PERMISSÕES E POLÍTICAS DE ACESSO
-- ==============================================================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encontros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roteiros_didaticos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubes_competicao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competidores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encontros_competicao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projetos_fic_fecom ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrantes_projeto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galeria_fotos ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para permitir que a anon key acesse e atualize as tabelas
DROP POLICY IF EXISTS "Acesso publico usuarios" ON public.usuarios;
CREATE POLICY "Acesso publico usuarios" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso publico clubes" ON public.clubes;
CREATE POLICY "Acesso publico clubes" ON public.clubes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso publico alunos" ON public.alunos;
CREATE POLICY "Acesso publico alunos" ON public.alunos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso publico encontros" ON public.encontros;
CREATE POLICY "Acesso publico encontros" ON public.encontros FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso publico roteiros" ON public.roteiros_didaticos;
CREATE POLICY "Acesso publico roteiros" ON public.roteiros_didaticos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso publico clubes_competicao" ON public.clubes_competicao;
CREATE POLICY "Acesso publico clubes_competicao" ON public.clubes_competicao FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso publico competidores" ON public.competidores;
CREATE POLICY "Acesso publico competidores" ON public.competidores FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso publico encontros_competicao" ON public.encontros_competicao;
CREATE POLICY "Acesso publico encontros_competicao" ON public.encontros_competicao FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso publico projetos_fic_fecom" ON public.projetos_fic_fecom;
CREATE POLICY "Acesso publico projetos_fic_fecom" ON public.projetos_fic_fecom FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso publico integrantes_projeto" ON public.integrantes_projeto;
CREATE POLICY "Acesso publico integrantes_projeto" ON public.integrantes_projeto FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso publico galeria_fotos" ON public.galeria_fotos;
CREATE POLICY "Acesso publico galeria_fotos" ON public.galeria_fotos FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 6. REGISTRO INICIAL EXCLUSIVO: ADMINISTRADOR SUPREMO
-- ==============================================================================
-- O banco é inicializado limpo sem dados de teste, contendo APENAS a conta
-- master do Administrador Supremo para permitir a alimentação manual e testes.
--
-- Credenciais Master:
--   E-mail: adminsupremo@cetec.com
--   Senha:  adminsupremo
--   Nível:  Admin Supremo ('superadmin' - Acesso Absoluto e Total)

INSERT INTO public.usuarios (
    id,
    nome,
    email,
    senha,
    acesso,
    tipo_usuario,
    utec,
    ver_todas_utecs
)
VALUES (
    gen_random_uuid(),
    'Administrador Supremo',
    'adminsupremo@cetec.com',
    'adminsupremo',
    'superadmin',
    'global',
    '',
    true
)
ON CONFLICT (email) DO UPDATE SET
    nome = 'Administrador Supremo',
    senha = 'adminsupremo',
    acesso = 'superadmin',
    tipo_usuario = 'global',
    ver_todas_utecs = true,
    updated_at = timezone('utc'::text, now());

-- ==============================================================================
-- FIM DO SCRIPT DE CONFIGURAÇÃO DO SUPABASE
-- ==============================================================================
