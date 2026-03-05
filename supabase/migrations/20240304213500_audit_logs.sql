-- Criar tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_email TEXT,
    acao TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    tabela TEXT NOT NULL,
    registro_id UUID,
    dados_antigos JSONB,
    dados_novos JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS para audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver logs
CREATE POLICY "Admins podem ver audit_logs" ON public.audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.perfil = 'admin' OR profiles.perfil = 'administrador')
        )
    );

-- Função para registrar auditoria
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_user_email TEXT;
BEGIN
    -- Tenta obter o email do JWT do Supabase
    v_user_email := auth.jwt() ->> 'email';

    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (usuario_email, acao, tabela, registro_id, dados_antigos)
        VALUES (v_user_email, TG_OP, TG_TABLE_NAME, OLD.id, row_to_json(OLD)::jsonb);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (usuario_email, acao, tabela, registro_id, dados_antigos, dados_novos)
        VALUES (v_user_email, TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (usuario_email, acao, tabela, registro_id, dados_novos)
        VALUES (v_user_email, TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(NEW)::jsonb);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar Triggers
DROP TRIGGER IF EXISTS tr_audit_recebimentos ON public.recebimentos;
CREATE TRIGGER tr_audit_recebimentos
AFTER INSERT OR UPDATE OR DELETE ON public.recebimentos
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Trigger para perfis (cuidado com dados sensíveis, aqui salvamos apenas o necessário ou tudo)
DROP TRIGGER IF EXISTS tr_audit_profiles ON public.profiles;
CREATE TRIGGER tr_audit_profiles
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Se as tabelas 'escolas', 'uniformes' ou 'transferencias' existirem, aplicar triggers também
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'escolas') THEN
        DROP TRIGGER IF EXISTS tr_audit_escolas ON public.escolas;
        CREATE TRIGGER tr_audit_escolas
        AFTER INSERT OR UPDATE OR DELETE ON public.escolas
        FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transferencias') THEN
        DROP TRIGGER IF EXISTS tr_audit_transferencias ON public.transferencias;
        CREATE TRIGGER tr_audit_transferencias
        AFTER INSERT OR UPDATE OR DELETE ON public.transferencias
        FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
    END IF;
END $$;
