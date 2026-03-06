-- Script para popular a tabela modelos_recebimento com os novos modelos definitivos
-- ATENÇÃO: Isso limpará os modelos existentes na tabela modelos_recebimento

BEGIN;

-- Limpar a tabela antes de inserir os novos
TRUNCATE TABLE public.modelos_recebimento CASCADE;

-- Inserir os modelos
INSERT INTO public.modelos_recebimento (id, nome, descricao, tamanhos, segmentos)
VALUES
    ('01', 'MODELO 01 (A/B) – Conjunto Unissex', 'CONJUNTO CAMISETA BEBÊ E TAPA FRALDAS', '{"1", "2", "4", "6"}', '{"CONJUNTO UNIFORME ESCOLAR CRECHE"}'),
    ('02', 'MODELO 02 (A/B) – Conjunto Masculino', 'CONJUNTO CAMISETA E BERMUDA MASCULINO', '{"1", "2", "4", "6"}', '{"CONJUNTO UNIFORME ESCOLAR CRECHE"}'),
    ('03', 'MODELO 03 – Conjunto Feminino', 'VESTIDO E TAPA FRALDAS', '{"1", "2", "4", "6"}', '{"CONJUNTO UNIFORME ESCOLAR CRECHE"}'),
    ('04', 'MODELO 04 – Conjunto Unissex', 'CONJUNTO MOLETOM', '{"1", "2", "4", "6"}', '{"CONJUNTO UNIFORME ESCOLAR CRECHE"}'),
    ('22', 'MODELO 22', 'MEIA ANTIDERRAPANTE', '{"BB (18/19)", "PP (20/23)", "P (24/27)", "M (28/31)"}', '{"CONJUNTO UNIFORME ESCOLAR CRECHE"}'),
    ('24c', 'MODELO 24 (Creche)', 'TÊNIS – FECHAMENTO COM VELCRO', '{"18", "20", "22", "24", "26", "28", "30", "32", "34", "36", "38"}', '{"CONJUNTO UNIFORME ESCOLAR CRECHE"}'),
    ('26', 'MODELO 26', 'SANDÁLIA PEPETE INFANTIL', '{"17/18", "19/20", "21/22", "23/24", "25/26", "27/28", "29/30", "31/32"}', '{"CONJUNTO UNIFORME ESCOLAR CRECHE"}'),
    ('08', 'MODELO 08 Masculino', 'BERMUDA HELANCA MENINOS', '{"4", "6", "8", "10", "12", "14", "16", "P", "M", "G", "GG", "EG"}', '{"GERAL"}'),
    ('09', 'MODELO 09 Feminino', 'SHORTS SAIA HELANCA MENINAS', '{"4", "6", "8", "10", "12", "14", "16", "P", "M", "G", "GG", "EG"}', '{"GERAL"}'),
    ('05', 'MODELO 05 Unissex', 'CAMISETA COM MANGA', '{"4", "6", "8", "10", "12", "14", "16", "P", "M", "G", "GG", "EG"}', '{"GERAL"}'),
    ('06', 'MODELO 06 Unissex', 'CAMISETA SEM MANGA – CAVADA', '{"4", "6", "8", "10", "12", "14", "16", "P", "M", "G", "GG", "EG"}', '{"GERAL"}'),
    ('07', 'MODELO 07 Unissex', 'CAMISETA MANGA LONGA', '{"4", "6", "8", "10", "12", "14", "16", "P", "M", "G", "GG", "EG"}', '{"GERAL"}'),
    ('10', 'MODELO 10 Unissex', 'CONJUNTO JAQUETA E CALÇA EM MICROFIBRA', '{"4", "6", "8", "10", "12", "14", "16", "P", "M", "G", "GG", "EG"}', '{"GERAL"}'),
    ('21', 'MODELO 21 Unissex', 'MEIA COLEGIAL', '{"BB (14–17)", "PP (18–21)", "P (22–25)", "M (26–29)", "G (30–33)", "GG (34–37)", "XGG (38–41)", "ADULTO (42–45)", "TAMANHO 52"}', '{"GERAL"}'),
    ('11', 'MODELO 11 Masculino', 'BERMUDA TACTEL MASCULINA', '{"4", "6", "8", "10", "12", "14", "16", "P", "M", "G", "GG", "EG"}', '{"GERAL"}'),
    ('12', 'MODELO 12 Feminino', 'BERMUDA LEGGING FEMININA', '{"4", "6", "8", "10", "12", "14", "16", "P", "M", "G", "GG", "EG"}', '{"GERAL"}'),
    ('18', 'MODELO 18', 'CALÇA JEANS MASCULINA', '{"14", "16", "36", "38", "40", "42", "44", "46", "48", "50", "52", "54", "56"}', '{"GERAL"}'),
    ('19', 'MODELO 19', 'CALÇA JEANS FEMININA', '{"14", "16", "36", "38", "40", "42", "44", "46", "48", "50", "52", "54", "56"}', '{"GERAL"}'),
    ('14', 'MODELO 14 Unissex', 'JAQUETA MICROFIBRA', '{"14", "16", "P", "M", "G", "GG", "EG"}', '{"GERAL"}'),
    ('24', 'MODELO 24', 'TÊNIS FECHAMENTO COM VELCRO', '{"18", "20", "22", "24", "26", "28", "30", "32", "34", "36", "38", "40"}', '{"GERAL"}'),
    ('23', 'MODELO 23', 'TÊNIS FECHAMENTO COM CADARÇO', '{"26", "28", "30", "32", "34", "36", "38", "40", "42", "44", "46", "48", "52"}', '{"GERAL"}');

COMMIT;
