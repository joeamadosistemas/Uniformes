
-- Criar tabela de recebimentos
CREATE TABLE IF NOT EXISTS public.recebimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola TEXT NOT NULL,
    modelo_id TEXT NOT NULL,
    modelo_nome TEXT NOT NULL,
    descricao TEXT,
    tamanho TEXT NOT NULL,
    quantidade INTEGER DEFAULT 0,
    data_recebimento TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS
ALTER TABLE public.recebimentos ENABLE ROW LEVEL SECURITY;

-- Política: Escolas podem ver e inserir seus próprios dados
CREATE POLICY "Escolas podem gerenciar seus recebimentos" ON public.recebimentos
    FOR ALL
    USING (auth.jwt() ->> 'email' = escola)
    WITH CHECK (auth.jwt() ->> 'email' = escola);

-- Política: Administradores podem ver tudo
CREATE POLICY "Admins podem ver todos os recebimentos" ON public.recebimentos
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'administrador')
        )
    );

-- Criar tabela de modelos (opcional, mas recomendada para customização)
CREATE TABLE IF NOT EXISTS public.modelos_recebimento (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    tamanhos JSONB, -- [ "P", "M", "G", ... ]
    segmentos JSONB, -- [ "CRECHE", "GERAL", ... ]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.modelos_recebimento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um pode ver os modelos" ON public.modelos_recebimento
    FOR SELECT USING (true);
