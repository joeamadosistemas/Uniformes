export interface RecebimentoModelo {
    id: string;
    nome: string;
    descricao: string;
    tamanhos: string[];
    segmentos: string[]; // Segmentos onde este modelo é exibido
}

export const RECEBIMENTOS_MODELOS: RecebimentoModelo[] = [
    // --- MODELOS CRECHE ---
    {
        id: '01',
        nome: 'MODELO 01 (A/B) – Conjunto Unissex',
        descricao: 'CONJUNTO CAMISETA BEBÊ E TAPA FRALDAS',
        tamanhos: ['1', '2', '4', '6'],
        segmentos: ['CONJUNTO UNIFORME ESCOLAR CRECHE']
    },
    {
        id: '02',
        nome: 'MODELO 02 (A/B) – Conjunto Masculino',
        descricao: 'CONJUNTO CAMISETA E BERMUDA MASCULINO',
        tamanhos: ['1', '2', '4', '6'],
        segmentos: ['CONJUNTO UNIFORME ESCOLAR CRECHE']
    },
    {
        id: '03',
        nome: 'MODELO 03 – Conjunto Feminino',
        descricao: 'VESTIDO E TAPA FRALDAS',
        tamanhos: ['1', '2', '4', '6'],
        segmentos: ['CONJUNTO UNIFORME ESCOLAR CRECHE']
    },
    {
        id: '04',
        nome: 'MODELO 04 – Conjunto Unissex',
        descricao: 'CONJUNTO MOLETOM',
        tamanhos: ['1', '2', '4', '6'],
        segmentos: ['CONJUNTO UNIFORME ESCOLAR CRECHE']
    },
    {
        id: '22',
        nome: 'MODELO 22',
        descricao: 'MEIA ANTIDERRAPANTE',
        tamanhos: ['BB (18/19)', 'PP (20/23)', 'P (24/27)', 'M (28/31)'],
        segmentos: ['CONJUNTO UNIFORME ESCOLAR CRECHE']
    },
    {
        id: '24c',
        nome: 'MODELO 24 (Creche)',
        descricao: 'TÊNIS – FECHAMENTO COM VELCRO',
        tamanhos: ['18', '20', '22', '24', '26', '28', '30', '32', '34', '36', '38'],
        segmentos: ['CONJUNTO UNIFORME ESCOLAR CRECHE']
    },
    {
        id: '26',
        nome: 'MODELO 26',
        descricao: 'SANDÁLIA PEPETE INFANTIL',
        tamanhos: ['17/18', '19/20', '21/22', '23/24', '25/26', '27/28', '29/30', '31/32'],
        segmentos: ['CONJUNTO UNIFORME ESCOLAR CRECHE']
    },
    // --- MODELOS REGULARES (DEMAIS SEGMENTOS) ---
    {
        id: '08',
        nome: 'MODELO 08 Masculino',
        descricao: 'BERMUDA HELANCA MENINOS',
        tamanhos: ['4', '6', '8', '10', '12', '14', '16', 'P', 'M', 'G', 'GG', 'EG'],
        segmentos: ['GERAL']
    },
    {
        id: '09',
        nome: 'MODELO 09 Feminino',
        descricao: 'SHORTS SAIA HELANCA MENINAS',
        tamanhos: ['4', '6', '8', '10', '12', '14', '16', 'P', 'M', 'G', 'GG', 'EG'],
        segmentos: ['GERAL']
    },
    {
        id: '05',
        nome: 'MODELO 05 Unissex',
        descricao: 'CAMISETA COM MANGA',
        tamanhos: ['4', '6', '8', '10', '12', '14', '16', 'P', 'M', 'G', 'GG', 'EG'],
        segmentos: ['GERAL']
    },
    {
        id: '06',
        nome: 'MODELO 06 Unissex',
        descricao: 'CAMISETA SEM MANGA – CAVADA',
        tamanhos: ['4', '6', '8', '10', '12', '14', '16', 'P', 'M', 'G', 'GG', 'EG'],
        segmentos: ['GERAL']
    },
    {
        id: '07',
        nome: 'MODELO 07 Unissex',
        descricao: 'CAMISETA MANGA LONGA',
        tamanhos: ['4', '6', '8', '10', '12', '14', '16', 'P', 'M', 'G', 'GG', 'EG'],
        segmentos: ['GERAL']
    },

    {
        id: '10',
        nome: 'MODELO 10 Unissex',
        descricao: 'CONJUNTO JAQUETA E CALÇA EM MICROFIBRA',
        tamanhos: ['4', '6', '8', '10', '12', '14', '16', 'P', 'M', 'G', 'GG', 'EG'],
        segmentos: ['GERAL']
    },
    {
        id: '21',
        nome: 'MODELO 21 Unissex',
        descricao: 'MEIA COLEGIAL',
        tamanhos: ['BB (14–17)', 'PP (18–21)', 'P (22–25)', 'M (26–29)', 'G (30–33)', 'GG (34–37)', 'XGG (38–41)', 'ADULTO (42–45)', 'TAMANHO 52'],
        segmentos: ['GERAL']
    },
    {
        id: '11',
        nome: 'MODELO 11 Masculino',
        descricao: 'BERMUDA TACTEL MASCULINA',
        tamanhos: ['4', '6', '8', '10', '12', '14', '16', 'P', 'M', 'G', 'GG', 'EG'],
        segmentos: ['GERAL']
    },
    {
        id: '12',
        nome: 'MODELO 12 Feminino',
        descricao: 'BERMUDA LEGGING FEMININA',
        tamanhos: ['4', '6', '8', '10', '12', '14', '16', 'P', 'M', 'G', 'GG', 'EG'],
        segmentos: ['GERAL']
    },
    {
        id: '18',
        nome: 'MODELO 18',
        descricao: 'CALÇA JEANS MASCULINA',
        tamanhos: ['14', '16', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56'],
        segmentos: ['GERAL']
    },
    {
        id: '19',
        nome: 'MODELO 19',
        descricao: 'CALÇA JEANS FEMININA',
        tamanhos: ['14', '16', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56'],
        segmentos: ['GERAL']
    },
    {
        id: '14',
        nome: 'MODELO 14 Unissex',
        descricao: 'JAQUETA MICROFIBRA',
        tamanhos: ['14', '16', 'P', 'M', 'G', 'GG', 'EG'],
        segmentos: ['GERAL']
    },
    {
        id: '24',
        nome: 'MODELO 24',
        descricao: 'TÊNIS FECHAMENTO COM VELCRO',
        tamanhos: ['18', '20', '22', '24', '26', '28', '30', '32', '34', '36', '38', '40'],
        segmentos: ['GERAL']
    },
    {
        id: '23',
        nome: 'MODELO 23',
        descricao: 'TÊNIS FECHAMENTO COM CADARÇO',
        tamanhos: ['26', '28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48', '52'],
        segmentos: ['GERAL']
    }
];
