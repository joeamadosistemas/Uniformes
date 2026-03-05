# PRD — Sistema de Controle de Uniformes Escolares
### Secretaria Municipal de Educação de Itaguaí — SMEDU

**Versão:** 2.0.4  
**Plataforma:** Aplicação Web (SPA) — React + Vite  
**Backend:** Supabase (Auth, Database, Edge Functions, Storage)  
**Hospedagem:** Netlify (Frontend) + Supabase Cloud (Backend)  
**PWA:** Sim — Instalável em dispositivos móveis  

---

## 1. Visão Geral do Produto

O **Sistema de Controle de Uniformes Escolares** é uma plataforma web desenvolvida para a **Secretaria Municipal de Educação (SMEDU)** do município de Itaguaí, RJ. Seu objetivo principal é **gerenciar e controlar a distribuição e o recebimento de uniformes escolares** em todas as unidades de ensino da rede municipal.

O sistema permite que escolas informem o recebimento de uniformes, que a Secretaria acompanhe o status de cada unidade, e que administradores gerenciem o estoque completo, transferências entre unidades e relatórios gerenciais — tudo em tempo real, com segurança por autenticação e controle de acesso baseado em perfis (Admin/Escola).

---

## 2. Problema a Ser Resolvido

- **Falta de visibilidade**: A SMEDU não possuía uma ferramenta centralizada para saber quais escolas já receberam seus uniformes e quais ainda estavam pendentes.
- **Controle manual**: A gestão de estoque e distribuição era feita por planilhas, gerando erros, duplicidade de dados e lentidão.
- **Ausência de rastreabilidade**: Transferências de uniformes entre escolas não eram rastreadas.
- **Comunicação dispersa**: A ausência de um painel web impedia a comunicação eficiente entre Secretaria e unidades escolares.

---

## 3. Público-Alvo e Perfis de Acesso

| Perfil | Descrição | Permissões |
|---|---|---|
| **Super Administrador** | Secretaria Municipal de Educação (SMEDU) | Acesso total: Dashboard, Controle de Recebimento, Cadastro de Escolas, Cadastro de Uniformes, Cadastro de Modelos, Gestão de Usuários, Backup/Restauração, Transferências. |
| **Escola** | Diretores e responsáveis de cada unidade escolar | Registro de recebimento de uniformes, visualização do inventário da própria unidade, transferências entre escolas. |

---

## 4. Módulos e Funcionalidades

### 4.1. Autenticação e Login
- Login via e-mail e senha (Supabase Auth).
- Tela de login com identidade visual governamental.
- Sessão persistente com refresh automático de tokens.
- Detecção automática de perfil/role ao logar.
- Dark Mode com persistência em `localStorage`.

### 4.2. Recebimentos (Módulo Principal — Escolas)
**Arquivo:** `Recebimentos.tsx`  
- Formulário para a escola registrar o recebimento de uniformes.
- Seleção de modelo, descrição, tamanho e quantidade.
- Filtro por ano, modelo e data de recebimento.
- Visualização em tabela dos recebimentos já registrados.
- Dados salvos na tabela `recebimentos` do Supabase.
- Segurança (RLS): cada escola vê apenas seus próprios registros.

### 4.3. Controle de Recebimento (Módulo Administrativo)
**Arquivo:** `ControleRecebimento.tsx`  
- Painel exclusivo para Administradores.
- Lista todas as escolas cadastradas com status: **Concluído** ou **Pendente**.
- Contadores de resumo: Total de Unidades, Informaram Recebimento, Aguardando Lançamento, Taxa de Adesão.
- Filtros por nome, segmento de ensino e status.
- Modal de detalhes: ao clicar numa escola, exibe todos os recebimentos individuais dela.
- Filtro por ano (`selectedYear`).
- Exportação em PDF do relatório de controle.
- Atualização em tempo real (botão de refresh).

### 4.4. Inventário / Lançamentos
**Arquivo:** `Lancamentos.tsx`  
- Visualização geral do inventário de uniformes.
- Exibição por unidade escolar, segmento e tipo.

### 4.5. Transferências
**Arquivo:** `Transferencias.tsx`  
- Registro de transferências de uniformes entre unidades escolares.
- Campos: escola de origem, escola destino, itens (produto, quantidade, motivo).
- Status: `concluída` ou `pendente`.
- Rastreamento de data e segmento.
- Visibilidade controlada por perfil do usuário.

### 4.6. Dashboard Administrativo
**Arquivo:** `DashboardAdmin.tsx`  
- Painel de estatísticas e indicadores da rede escolar.
- Exclusivo para perfil Admin.

### 4.7. Cadastro de Uniformes
**Arquivo:** `CadastrosUniformes.tsx`  
- CRUD completo de itens de uniforme.
- Campos: descrição, segmento, gênero, tamanho, quantidade, preço unitário.
- Cálculo automático de preço total.

### 4.8. Cadastro de Modelos
**Arquivo:** `CadastroModelos.tsx`  
- Gerenciamento dos modelos de recebimento.
- Cada modelo possui: ID, nome, descrição, lista de tamanhos (JSONB) e segmentos (JSONB).

### 4.9. Gestão de Unidades Escolares
**Arquivo:** `UnidadeEscolar.tsx`  
- Cadastro e edição de escolas.
- Campos: nome, e-mail, segmentos atendidos, status (ativo/inativo).
- Vinculação entre e-mail da escola e conta de acesso.

### 4.10. Gestão de Usuários
**Arquivo:** `Usuarios.tsx`  
- CRUD de usuários do sistema (Auth + Profiles).
- Criação de novas contas de login via **Edge Function** segura (`admin-users`).
- Vinculação de usuário a uma escola (para perfil "Escola").
- Alteração de senha e exclusão de contas via backend seguro.
- Perfis disponíveis: `Admin` e `Escola`.

### 4.11. Backup e Restauração
**Arquivo:** `BackupRestauracao.tsx`  
- Exportação e importação de dados do sistema.
- Ferramenta administrativa de contingência.

### 4.12. Sobre o Sistema
**Arquivo:** `Sobre.tsx`  
- Página institucional com descrição do sistema, versão e recursos.
- Contadores: 69 unidades atendidas, 100% cloud, relatórios PDF.

---

## 5. Arquitetura Técnica

### 5.1. Frontend
| Tecnologia | Uso |
|---|---|
| **React 18** | Framework de UI (SPA) |
| **Vite** | Bundler e dev server |
| **TypeScript** | Tipagem estática |
| **Lucide React** | Ícones vetoriais |
| **CSS (Vanilla + Dark Mode)** | Estilização com suporte a tema escuro |
| **PWA (Service Worker)** | Instalável como app em dispositivos móveis |

### 5.2. Backend (Supabase)
| Serviço | Uso |
|---|---|
| **Supabase Auth** | Autenticação e gerenciamento de sessões |
| **Supabase Database (PostgreSQL)** | Armazenamento de dados (escolas, recebimentos, perfis, transferências, uniformes) |
| **Row Level Security (RLS)** | Controle de acesso a nível de linha no banco de dados |
| **Supabase Edge Functions (Deno)** | Operações administrativas seguras (criar/editar/excluir usuários) |

### 5.3. Hospedagem e Deploy
| Serviço | Uso |
|---|---|
| **Netlify** | Deploy contínuo do frontend (build Vite) |
| **Supabase Cloud** | Backend gerenciado (banco, auth, funções) |
| **GitHub** | Controle de versão (branch `DevUni`) |

---

## 6. Modelo de Dados

### Tabelas Principais

```
profiles          — Perfis de usuários (id, email, nome, role, unidade_id)
escolas           — Unidades escolares cadastradas (id, nome, email, segmentos, ativo)
recebimentos      — Registros de recebimento de uniformes (id, escola, modelo_id, modelo_nome, descricao, tamanho, quantidade, data_recebimento)
modelos_recebimento — Modelos de uniformes (id, nome, descricao, tamanhos, segmentos)
uniformes         — Catálogo de uniformes com estoque (id, descricao, segmento, genero, tamanho, quantidade, preco_unitario)
transferencias    — Movimentações entre escolas (id, tipo, status, origem, destino, data, itens, segmentos)
```

### Políticas de Segurança (RLS)

| Tabela | Política |
|---|---|
| `recebimentos` | Escolas veem apenas seus registros (`email = escola`). Admins veem todos (`role IN ('Admin', 'Super Administrador')`). |
| `modelos_recebimento` | Leitura pública (qualquer usuário autenticado). |
| `profiles` | Acesso por RLS configurado no dashboard. |

---

## 7. Segmentos de Ensino Atendidos

O sistema atende os seguintes segmentos da rede municipal:

| Segmento | Itens de Uniforme |
|---|---|
| **Creche** | Conjunto camiseta bebê e tapa fralda, conjunto camiseta e bermuda, vestido feminino, conjunto moletom bebê, meia antiderrapante |
| **Pré-Escola** | Camiseta (com/sem manga, manga longa), bermuda/short saia helanca, conjunto jaqueta + calça microfibra, meia colegial |
| **Fundamental 1°-3° ano** | Camiseta (com/sem manga, manga longa), bermuda/short saia helanca, conjunto jaqueta + calça microfibra, meia colegial |
| **Fundamental 4°-5° ano** | Camiseta (com/sem manga), bermuda tactel/leggins, conjunto jaqueta + calça microfibra, meia colegial |
| **Fundamental II (6°-9° ano)** | Camiseta (com/sem manga), bermuda tactel/leggins, jaqueta microfibra, calça jeans (masc./fem.), meia colegial |
| **EJA** | Camiseta (com/sem manga), jaqueta microfibra, meia colegial, calça jeans (masc./fem.) |

**Tamanhos disponíveis:** P, M, G, XG, Outros  
**Unidades de medida:** CONJ., PAR, UNIT., PEÇ., PCT, OUTROS

---

## 8. Internacionalização (i18n)

O sistema suporta **3 idiomas**:
- 🇧🇷 **Português (Brasil)** — Padrão
- 🇺🇸 **English**
- 🇪🇸 **Español**

Toda a interface é traduzida dinamicamente via contexto React (`LanguageContext` + `i18n.ts`).

---

## 9. Componentes Compartilhados

| Componente | Descrição |
|---|---|
| `Sidebar` | Menu lateral com navegação, expansível para Configurações |
| `GovHeader` | Cabeçalho governamental com logo, nome do usuário, escola, dark mode e logout |
| `GovFooter` | Rodapé institucional |
| `BottomNav` | Navegação inferior para dispositivos móveis |
| `InstallPrompt` | Banner de instalação PWA |
| `DashboardStats` | Cards de estatísticas reutilizáveis |
| `UniformForm` | Formulário reutilizável de cadastro de uniformes |
| `UniformTable` | Tabela reutilizável de exibição de uniformes |

---

## 10. Funcionalidades Transversais

- **Dark Mode**: Toggle global com persistência em `localStorage`.
- **Responsividade**: Layout adaptado para Desktop, Tablet e Mobile (grid, sidebar, bottom nav).
- **Exportação PDF**: Relatórios exportáveis em PDF (Controle de Recebimento e outros).
- **PWA**: Aplicação instalável como app nativo em smartphones.
- **Segurança**: Autenticação Supabase Auth, RLS no PostgreSQL, Edge Functions para ações administrativas. Nenhuma chave secreta exposta no frontend.

---

## 11. Requisitos Não-Funcionais

| Requisito | Especificação |
|---|---|
| **Disponibilidade** | 99.9% (garantido pela infraestrutura Supabase + Netlify) |
| **Performance** | Carregamento inicial < 3s; operações de banco < 500ms |
| **Segurança** | Zero chaves secretas no frontend; RLS ativo em todas as tabelas; Edge Functions para operações admin |
| **Escalabilidade** | Pronto para 69+ unidades escolares sem degradação |
| **Acessibilidade** | Labels semânticos, contraste adequado, navegação por teclado |
| **Compatibilidade** | Chrome, Firefox, Safari, Edge (últimas 2 versões) |

---

## 12. Roadmap Futuro (Sugestões)

- [ ] Relatórios avançados com gráficos interativos (Chart.js / Recharts)
- [ ] Notificações push para escolas pendentes
- [ ] Módulo de solicitação de uniformes pelas escolas
- [ ] Histórico completo de auditoria (log de ações)
- [ ] Integração com sistema de matrícula para previsão de demanda
- [ ] Dashboard com mapa georreferenciado das unidades

---

> **Desenvolvido por:** Dualite Project  
> **Cliente:** Secretaria Municipal de Educação de Itaguaí (SMEDU)  
> **Contato técnico:** em.eiderribeirodantas@edu.itaguai.rj.gov.br  
