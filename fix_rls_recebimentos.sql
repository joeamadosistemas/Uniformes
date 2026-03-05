-- Este script corrige a política RLS da tabela 'recebimentos' para permitir que Admins visualizem todos os dados.

-- 1. Excluir a política antiga
DROP POLICY IF EXISTS "Admins podem ver todos os recebimentos" ON public.recebimentos;

-- 2. Criar a política correta usando 'role' em vez de 'perfil', cobrindo todas as variações de Admin do sistema
CREATE POLICY "Admins podem ver todos os recebimentos" ON public.recebimentos
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('Admin', 'admin', 'Super Administrador', 'administrador')
        )
    );
