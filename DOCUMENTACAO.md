# DOCUMENTAÇÃO TÉCNICA E DIDÁTICA – APLICATIVO MEU BOLSO

Este documento foi elaborado para a equipe de estudantes de **Sistemas de Informação**, apresentando de forma didática e estruturada todos os conceitos, decisões de arquitetura, padrões de projeto, modelagem de dados e implementações que compõem o aplicativo mobile **Meu Bolso**.

---

## 1. ORGANIZAÇÃO GERAL DO PROJETO

O projeto foi concebido seguindo os princípios de **Clean Architecture** e **Separação de Responsabilidades (SoC - Separation of Concerns)**. O objetivo foi criar uma estrutura modular onde a interface gráfica, a lógica de negócio, a persistência de dados e as definições visuais operam de maneira desacoplada e independente.

```
MeuBolso/
├── assets/                     # Recursos visuais (ícones, imagens de splash)
├── src/                        # Código-fonte principal da aplicação
│   ├── components/             # Componentes visuais modulares e reutilizáveis
│   │   ├── BalanceCard.js          # Card roxo de saldo e resumos mensais
│   │   ├── BarComparisonChart.js   # Gráfico de barras comparativo (Ago, Set, Out)
│   │   ├── BudgetCategoryCard.js   # Item de categoria com barra de progresso e edição
│   │   ├── BudgetModal.js          # Modal interativo para edição dinâmica de limites
│   │   ├── CategoryModal.js        # Modal para criação e edição de categorias personalizadas
│   │   ├── DonutChart.js           # Gráfico Donut com anel SVG e tabela de gastos por período
│   │   ├── EvolutionChart.js       # Gráfico vetorial SVG com curva suave do saldo
│   │   ├── FilterTabs.js           # Filtros: Todas, Receitas, Despesas
│   │   ├── Header.js               # Cabeçalho padrão (logo, título, avatar, ações)
│   │   ├── MonthSelector.js        # Seletor de mês/ano com setas de navegação
│   │   ├── PeriodBarChart.js       # Gráfico de barras dos 7 dias da semana e 12 meses do ano
│   │   └── TransactionItem.js      # Linha de movimentação com ícone, formatação e badge de recorrência
│   ├── contexts/               # Gerenciamento de estado global (Context API)
│   │   ├── AuthContext.js          # Sessão, login, cadastro, edição e recuperação de senha
│   │   ├── FinanceContext.js       # CRUD de transações, orçamentos, cálculos e automação de gastos recorrentes
│   │   ├── ThemeContext.js         # Gerenciamento de Modo Claro, Modo Escuro e Sistema
│   │   └── LanguageContext.js      # Internacionalização bilíngue (Português e Inglês)
│   ├── i18n/                   # Dicionários de tradução
│   │   └── translations.js         # Chaves estruturadas em Português e Inglês
│   ├── navigation/             # Roteamento e navegação
│   │   ├── AppNavigator.js         # Pilha raiz com guarda de autenticação
│   │   └── TabNavigator.js         # Barra de 5 abas inferiores com botão central "+"
│   ├── screens/                # As 8 telas completas do aplicativo
│   │   ├── AuthScreen.js           # Tela 1: Login e Cadastro com persistência
│   │   ├── DashboardScreen.js      # Tela 2: Página Inicial / Dashboard
│   │   ├── TransactionsScreen.js   # Tela 3: Movimentações
│   │   ├── NewTransactionScreen.js # Tela 4: Nova / Editar Movimentação (com toggle de recorrência)
│   │   ├── BudgetScreen.js         # Tela 5: Orçamento
│   │   ├── ReportsScreen.js        # Tela 6: Relatórios Financeiros
│   │   ├── ProfileScreen.js        # Tela 7: Perfil do Usuário e Configurações
│   │   └── RecurringExpensesScreen.js # Tela 8: Gerenciamento de Gastos Recorrentes
│   ├── services/               # Camada de serviços externos e persistência
│   │   └── storageService.js       # Interface com o AsyncStorage
│   ├── styles/                 # Identidade visual e design tokens
│   │   └── theme.js                # Paletas de cores (light/dark), tipografia e sombras
│   └── utils/                  # Funções utilitárias e constantes
│       ├── constants.js            # Categorias, configurações padrão e estruturas iniciais limpas
│       └── formatters.js           # Formatação de moedas (BRL/USD), datas e porcentagens
├── App.js                      # Ponto de entrada raiz do aplicativo Meu Bolso
├── index.js                    # Registro do componente raiz com registerRootComponent (Expo)
├── app.json                    # Configuração central do Expo (SDK 58, plugins, ícones e splash)
├── eas.json                    # Configuração do EAS Build para compilação de APK independente
├── babel.config.js             # Preset babel-preset-expo
├── metro.config.js             # Configuração do Metro Bundler com expo/metro-config
└── package.json                # Dependências do Expo, scripts e metadados
```

---

## 2. PARA QUE SERVE CADA PASTA

- **`assets/`**: Armazena arquivos estáticos binários, como o ícone da aplicação (`icon.png`), o ícone adaptativo para Android e a tela de abertura.
- **`src/components/`**: Contém blocos de interface gráfica reutilizáveis. Em vez de duplicar layouts entre telas, os elementos comuns (como o cabeçalho, os cartões e os gráficos) são encapsulados em componentes parametrizáveis via `props`.
- **`src/contexts/`**: Hospeda os contextos da **React Context API** (`AuthContext`, `FinanceContext`, `ThemeContext` e `LanguageContext`). Centraliza a fonte única de verdade do aplicativo, permitindo que qualquer tela acesse e altere dados sem a necessidade de "prop drilling".
- **`src/i18n/`**: Centraliza os dicionários de internacionalização em JSON/JavaScript, permitindo que novos idiomas sejam adicionados com facilidade.
- **`src/navigation/`**: Gerencia a transição de telas, o histórico de navegação e a renderização condicional da interface.
- **`src/screens/`**: Contém as telas principais do aplicativo, cada uma com sua responsabilidade bem delimitada.
- **`src/services/`**: Camada responsável pela persistência de dados. Isola os detalhes de implementação do `AsyncStorage`.
- **`src/styles/`**: Centraliza os **Design Tokens** (paleta de cores claras e escuras, tipografia, escalas de espaçamento e sombras).
- **`src/utils/`**: Reúne funções puras e utilitárias de formatação e dados estáticos de inicialização.

---

## 3. CORREÇÕES DE ERROS E MIGRAÇÃO REALIZADAS

1. **Migração Completa para o Ecossistema Expo (SDK 58)**:
   - Configurado o aplicativo para execução e testes via **Expo Go** e compilação de APK independente via **Expo (EAS Build)**.
   - Ponto de entrada ajustado para `registerRootComponent(App)` da biblioteca `expo`.
   - Adicionados `app.json` e `eas.json` devidamente parametrizados para distribuição em formato APK (`buildType: "apk"`).
   - Bundler configurado via `expo/metro-config` e Babel atualizado para `babel-preset-expo`.
2. **Substituição de Notificações para Compatibilidade Total com Expo Go**:
   - A biblioteca nativa legada `@notifee/react-native` (incompatível com o cliente Expo Go) foi substituída por `expo-notifications`.
   - O serviço `src/notifications/notificationService.js` foi reescrito para utilizar canais Android (`setNotificationChannelAsync`), gatilhos diários (`SchedulableTriggerInputTypes.DAILY`) e de data (`SchedulableTriggerInputTypes.DATE`), garantindo funcionamento pleno tanto no Expo Go quanto no APK instalado.
3. **Padronização dos Ícones Vetoriais via `@expo/vector-icons`**:
   - Migrados todos os componentes e telas que importavam `react-native-vector-icons/Ionicons` para `@expo/vector-icons/Ionicons`, eliminando problemas de carregamento de fontes no Expo Go.
4. **Bypass Involuntário da Tela de Login**:
   - No código original, o método `initializeDefaults()` em `storageService.js` gravava imediatamente um usuário de teste na chave `@meubolso_current_user`. Isso fazia com que qualquer instalação abrisse diretamente na tela principal, impedindo que os avaliadores vissem a tela de login/cadastro na inicialização.
   - **Solução**: Removida completamente a conta demo e qualquer pré-inserção de transações ou saldos fictícios. O aplicativo agora inicializa com a base de dados totalmente limpa, exibindo a tela de Login/Cadastro na primeira inicialização para que um usuário real seja cadastrado e seus gastos sejam inseridos organicamente.
5. **Persistência de Sessão e Atualização de Perfil**:
   - Foi implementado o método `updateProfile()` tanto no `AuthContext` quanto no `storageService`, permitindo alterar o nome completo, e-mail e senha do usuário ativo, persistindo as mudanças de forma segura no `AsyncStorage`.
6. **Interação com o Avatar no Cabeçalho**:
   - Em telas como Orçamento e Relatórios, tocar no avatar não disparava nenhuma ação. Foi padronizado o redirecionamento automático para a **Tela de Perfil do Usuário** (`ProfileScreen.js`) em todas as ocorrências do `Header`.
7. **Correção de Erro Crítico de Sintaxe em `FinanceContext.js`**:
   - Foi identificado e removido um bloco de código órfão duplicado no fechamento da função `loadAllData()` que causava interrupção de execução (`SyntaxError: Missing semicolon`).
8. **Normalização de Dados e Resiliência em Gráficos SVG**:
   - Garantida a normalização bidirecional de atributos nas entidades do `storageService` (Tabela 1 `@meubolso_transacoes`, Tabela 2 `@meubolso_anotacoes` e Metas `@meubolso_metas`).
   - Adicionadas verificações defensivas contra valores nulos e divisão por zero em `EvolutionChart.js` e `BarComparisonChart.js`, evitando crashes em renderização gráfica.

---

## 4. PERSISTÊNCIA NO `AsyncStorage` E SEPARAÇÃO DE CONTAS

O `AsyncStorage` funciona como um armazenamento NoSQL assíncrono mantido localmente no dispositivo. Para assegurar **isolamento estrito entre contas (multi-tenant)**, os dados de movimentações, anotações, metas e orçamentos são indexados pelo identificador exclusivo do usuário logado (`userId`):

| Chave | Descrição |
| :--- | :--- |
| `@meubolso_users` | Lista de usuários registrados com suas credenciais |
| `@meubolso_current_user` | Usuário logado atualmente para manter a sessão ativa |
| `@meubolso_transacoes_${userId}` | Movimentações financeiras exclusivas do usuário ativo |
| `@meubolso_anotacoes_${userId}` | Bloco de notas e chaves Pix exclusivos do usuário ativo |
| `@meubolso_metas_${userId}` | Cofrinho e metas financeiras exclusivas do usuário ativo |
| `@meubolso_recurring_expenses_${userId}` | Regras de gastos fixos recorrentes daquela conta |
| `@meubolso_budgets_${userId}` | Limites mensais planejados daquela conta |
| `@meubolso_initial_balance_${userId}` | Saldo inicial exclusivo do usuário |
| `@meubolso_theme` | Modo de aparência selecionado (`light`, `dark` ou `system`) |
| `@meubolso_language` | Idioma selecionado (`pt` ou `en`) |

> **Garantia de Inicialização Limpa:** Ao registrar uma nova conta, o método `initializeUserStorage(userId)` inicializa todas as coleções financeiras como arrays vazios (`[]`) e saldo zerado (`0.00`). Não há nenhum dado pré-inserido, dados de teste ou herança de movimentações de outros usuários.

---

## 5. MODO CLARO E ESCURO (THEME CONTEXT)

O aplicativo conta com suporte dinâmico a temas através do `ThemeContext`:
- **Modo Claro (Light)**: Fundo `#F8F9FD`, cards em branco puro `#FFFFFF`, tipografia escura `#111827`.
- **Modo Escuro (Dark)**: Fundo escuro elegante `#0F1117`, superfícies `#1A1D27`, bordas `#282C3D` e tipografia clara `#F9FAFB` com roxo vibrante `#6D4AFF`.
- **Automático (Sistema)**: Monitora a preferência do sistema operacional (`useColorScheme`) e altera as cores em tempo real.
- A barra de status (`StatusBar`) sincroniza automaticamente seu contraste (ícones escuros no claro, ícones brancos no escuro).

---

## 6. OPÇÃO DE INGLÊS E INTERNACIONALIZAÇÃO (I18N)

Através do `LanguageContext` e do dicionário `translations.js`, o aplicativo oferece suporte nativo bilíngue:
- **Português (Brasil)**: Moeda `R$ 3.900,00`, datas `31 out · sábado`, termos financeiros locais.
- **English (US)**: Moeda `$ 3,900.00`, datas `Oct 31 · Saturday`, traduções de todas as abas, categorias, botões e alertas.
- A troca de idioma pode ser feita tanto na tela inicial de login/cadastro quanto na tela de perfil, refletindo instantaneamente em todos os componentes.

---

## 7. AUTOMAÇÃO DE GASTOS RECORRENTES MENSAIS

Para automatizar despesas fixas que ocorrem todos os meses (como aluguel, condomínio, internet, assinaturas e mensalidades), foi criada a infraestrutura de **Gastos Recorrentes**:

### Como Funciona a Automação:
1. **Regra de Recorrência**:
   - Cada gasto recorrente possui uma descrição, valor fixo, categoria e um dia do mês para vencimento (`dayOfMonth` de 1 a 31).
2. **Algoritmo de Verificação e Lançamento Automático**:
   - Sempre que o aplicativo é aberto ou quando o usuário navega para um mês qualquer no seletor, o `FinanceContext` executa a rotina `checkAndApplyRecurringExpenses`:
     - Determina a chave do mês (`YYYY-MM`).
     - Para cada gasto recorrente ativo, verifica se já existe uma transação registrada correspondente àquela despesa naquele mês.
     - Se ainda não houver lançamento, o sistema cria automaticamente a movimentação na data programada (`YYYY-MM-DD`), marcando-a com a flag `isRecurring: true` e o vínculo `recurringExpenseId`.
3. **Cadastro Direto em Nova Movimentação**:
   - Ao registrar qualquer despesa em `NewTransactionScreen`, o usuário pode acionar a opção *"Repetir todo mês (Gasto recorrente)"* e escolher o dia de vencimento. O app salva o lançamento atual e programa os futuros automaticamente.
4. **Gerenciamento Centralizado**:
   - Na tela dedicada `RecurringExpensesScreen.js` (acessível pelo Perfil ou pela aba Orçamento), o usuário pode visualizar o total fixo mensal, pausar/ativar regras via Switch, editar valores, excluir itens ou forçar a sincronização imediata.

---

## 8. COMO OS GRÁFICOS SÃO GERADOS COM SVG

Os gráficos foram construídos utilizando diretamente **`react-native-svg`**, garantindo alto desempenho nativo a 60/120 FPS:
- **Gráfico de Evolução (`EvolutionChart.js`)**: Curvas cúbicas de Bézier com gradiente vertical.
- **Gráfico Donut (`DonutChart.js`)**: Arcos circulares calculados trigonometricamente com coordenadas polares para cartesianas.
- **Gráfico de Barras (`BarComparisonChart.js`)**: Retângulos com alturas proporcionais comparando receitas e despesas entre meses consecutivos.

---

## 9. MAPEAMENTO COMPLETO DE REQUISITOS (RELATÓRIO TÉCNICO UNINASSAU)

O projeto cumpre integralmente todos os **Requisitos Funcionais (RF01 a RF10)** e **Requisitos Não Funcionais (RNF01 a RNF04)** especificados no Relatório Técnico de Desenvolvimento Acadêmico:

### 📋 Requisitos Funcionais (RF)

| ID | Requisito do Relatório | Status | Implementação no Projeto |
| :--- | :--- | :---: | :--- |
| **RF01** | **Gestão de Despesas Realizadas**: O sistema deve permitir o cadastro, visualização e exclusão de movimentações (receitas e despesas). | Concluído | Telas `NewTransactionScreen.js` e `TransactionsScreen.js`, com exclusão, edição, detalhamento e suporte a receitas/despesas. |
| **RF02** | **Planejamento de Gastos Futuros**: Permitir cadastrar despesas planejadas com status `pretendido` e `dataVencimento`. Conversão em despesa realizada com apenas **um toque**. | Concluído | Seletor de status ("Realizado" vs "Pretendido") com data de vencimento. Botão **"Efetivar"** de um toque nos cards e modais (`convertPlannedToReal`), mudando o status para `realizado` e recalculando os saldos instantaneamente. |
| **RF03** | **Bloco de Anotações Financeiras**: Registro de notas livres, ideias de economia e chaves Pix para cobrança, organizadas por data. | Concluído | Tela dedicada `NotesScreen.js` com persistência na chave `@meubolso_anotacoes` (`id`, `titulo`, `conteudo`, `dataCriacao`), tags visuais, busca textual e botão de cópia rápida de chave Pix com um toque. |
| **RF04** | **Categorização e Limites**: Classificação em categorias pré-definidas com limites mensais de gastos. | Concluído | Tela `BudgetScreen.js` com categorias (Moradia, Alimentação, Transporte, Lazer, Outros), barras de progresso percentual e alertas ao atingir ou ultrapassar 90% do teto. |
| **RF05** | **Metas Financeiras ("Cofrinho")**: Metas de economia com barra de progresso visual e percentual acumulado. | Concluído | Tela dedicada `GoalsScreen.js` ("Cofrinho") com persistência em `@meubolso_metas`, barra de progresso colorida, cálculo automático de percentual e modais rápidos para Guardar (Depósito) e Resgatar. |
| **RF06** | **Cálculo de Saldo Atual e Projeção**: Saldo líquido atual baseado nas despesas realizadas e saldo futuro projetado considerando despesas pretendidas pendentes. | Concluído | Calculado em `FinanceContext.js` (`liquidCurrentBalance` e `projectedFutureBalance`) e exibido no componente `BalanceCard.js` com destaque visual e badge explicativo de projeção futura. |
| **RF07** | **Persistência de Histórico**: Armazenamento local permanente no dispositivo sem perda de dados ao fechar o app. | Concluído | Serviço `storageService.js` com `AsyncStorage`, persistindo as tabelas `@meubolso_transacoes`, `@meubolso_anotacoes`, `@meubolso_metas`, `@meubolso_budgets`, `@meubolso_users` e preferências. |
| **RF08** | **Consulta de Cotação de Moedas em Tempo Real**: Consumo de API externa de economia para cotação de Dólar (USD) e Euro (EUR) em relação ao Real. | Concluído | Módulo `src/services/currencyService.js` consumindo a **AwesomeAPI Economia** (`https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL`), exibido no componente `CurrencyCard.js` com conversor interativo de moedas (R$ ↔ US$ / €). |
| **RF09** | **Notificações Locais no Dispositivo**: Alarmes e lembretes locais sem depender de servidores remotos. | Concluído | Módulo `src/notifications/notificationService.js` via `@notifee/react-native`. Agenda lembrete diário às 20h para registrar os gastos do dia e emite alertas automáticos na data de vencimento de gastos futuros pretendidos. |
| **RF10** | **Filtro e Pesquisa**: Busca por palavra-chave ou categoria nas movimentações e notas. | Concluído | Campo de pesquisa em tempo real em `TransactionsScreen.js` e `NotesScreen.js`, com filtros rápidos por status (Todas, Receitas, Despesas, Planejadas) e categorias. |

---

### 🛡️ Requisitos Não Funcionais (RNF)

| ID | Requisito do Relatório | Status | Implementação no Projeto |
| :--- | :--- | :---: | :--- |
| **RNF01** | **Usabilidade Rápida**: O fluxo de registro ou efetivação deve ser concluído em até 3 toques na tela. | Concluído | Efetivação de gasto pretendido em **1 toque** (botão "Efetivar" direto no item da lista); Depósito no cofrinho em **2 toques**; Cadastro de movimentação direta pelo botão flutuante central com valores pré-formatados. |
| **RNF02** | **Compatibilidade**: Suporte operacional a dispositivos Android a partir da versão 8.0 (API 26). | Concluído | Desenvolvido em Expo (SDK 58) e React Native 0.88 com minSdk 24, suporte integral ao Expo Go e compilação de APK independente via EAS Build. |
| **RNF03** | **Resiliência Offline**: Operação contínua de todas as funções principais sem internet, com tratamento de exceções na API de cotação e cache local. | Concluído | Tratamento global com blocos `try / catch` no `currencyService.js`, armazenando a última cotação conhecida em cache local (`@meubolso_cotacoes_cache`) e exibindo selo de modo offline quando sem conexão. |
| **RNF04** | **Feedback Visual Assíncrono**: Indicadores visuais (`ActivityIndicator`) durante processamentos assíncronos e chamadas de rede. | Concluído | Exibição de `ActivityIndicator` nativo durante a verificação de autenticação no `AppNavigator`, no carregamento de cotações em `CurrencyCard` e nas transições de persistência. |

---

## 10. MODELAGEM DE DADOS E TABELAS DO RELATÓRIO

O sistema atende rigorosamente às especificações de dicionário de dados do relatório:

### Tabela 1: Estrutura da Entidade Transação (`@meubolso_transacoes`)
```json
{
  "id": "1730761200000",
  "descricao": "Aluguel Apartamento",
  "valor": 1200.00,
  "tipo": "despesa",
  "categoria": "Moradia",
  "status": "pretendido",
  "dataVencimento": "2026-11-10",
  "data": "2026-11-04",
  "isRecurring": true,
  "notes": "Pagamento via boleto"
}
```

### Tabela 2: Estrutura da Entidade Anotações (`@meubolso_anotacoes`)
```json
{
  "id": "1730761200001",
  "titulo": "Chave Pix do Condomínio",
  "conteudo": "financeiro@condominioexemplo.com.br - Vencimento todo dia 10",
  "dataCriacao": "2026-11-04T12:00:00.000Z"
}
```

### Estrutura da Entidade Metas / Cofrinho (`@meubolso_metas`)
```json
{
  "id": "1730761200002",
  "titulo": "Reserva de Emergência",
  "valorAlvo": 5000.00,
  "valorAtual": 1750.00,
  "dataLimite": "2026-12-31",
  "categoria": "Investimento",
  "icone": "shield-checkmark"
}
```

---

## 11. NOVOS RECURSOS IMPLEMENTADOS

### 11.1 Criação e Edição de Categorias de Gastos
- **Modal Dinâmico (`CategoryModal.js`)**: O usuário pode criar e editar categorias personalizadas de despesas com:
  - Nome da categoria;
  - Limite de orçamento mensal opcional;
  - Seletor de ícones do **Ionicons** (20 ícones disponíveis);
  - Paleta de cores modernas (10 tonalidades de destaque);
  - Exclusão com confirmação de segurança.
- **Integração nas Telas**:
  - Na tela de **Orçamento** (`BudgetScreen.js`): Botão `+ Nova Categoria` no cabeçalho da seção e ícone de edição direta em cada card de categoria (`BudgetCategoryCard.js`).
  - Na tela de **Nova Movimentação** (`NewTransactionScreen.js`): Botão `+ Criar Nova Categoria` dentro do modal seletor, selecionando a categoria criada imediatamente.
- **Persistência Isolada por Conta**: Armazenado na chave `@meubolso_categorias_despesa_${userId}`, garantindo que categorias criadas por uma conta não vazem para outras.

### 11.2 Pesquisa Avançada Multi-Critério
- **Pesquisa Completa em `TransactionsScreen.js`**:
  - **Por Valor**: Suporta busca de valor numérico inteiro (`150`), com casas decimais (`150.50`, `150,50`) e com símbolo de moeda (`R$ 150`, `$ 150`).
  - **Por Nome**: Filtra por correspondência no campo `description` ou `descricao`.
  - **Por Categoria**: Filtra pelo nome original e pelo nome traduzido em Português ou Inglês (`translateCategory`).
  - **Por Descrição**: Filtra pelo campo de observações e notas da movimentação (`observations`).
- **Alternador de Escopo**: O usuário pode alternar facilmente entre buscar no **Mês Selecionado** ou em **Todo o Histórico** da conta, com contador em tempo real de movimentações encontradas.

### 11.3 Visualização de Gastos por Período: Categoria, Dia, Semana, Mês e Ano
- **Abas de Período em `ReportsScreen.js`**:
  - **Dia**:
    - Navegador de data (`< Data >`) com atalho para retornar a "Hoje";
    - Métricas: Total gasto no dia e total de receitas no dia;
    - Gráfico Donut SVG de distribuição por categoria para o dia selecionado;
    - Listagem detalhada das transações ocorridas naquele dia.
  - **Semana**:
    - Navegador semanal (`< Seg dd/mm - Dom dd/mm >`) com atalho "Esta semana";
    - Métricas: Total gasto na semana e média diária;
    - Gráfico Donut SVG de gastos por categoria na semana;
    - Gráfico de barras verticais (`PeriodBarChart.js`) dos **7 dias da semana** (Seg a Dom) destacando o dia atual.
  - **Mês**:
    - Seletor mensal padrão (`< Mês Ano >`);
    - Total economizado no mês com badge percentual comparativo ao mês anterior;
    - Gráfico Donut SVG de gastos por categoria no mês;
    - Gráfico de barras comparativo dos últimos 3 meses (`BarComparisonChart.js`).
  - **Ano**:
    - Navegador de ano (`< Ano >`) com atalho "Este ano";
    - Métricas anuais: Total gasto no ano, total de receitas e saldo anual acumulado;
    - Gráfico Donut SVG de gastos por categoria no ano inteiro;
    - Gráfico de barras verticais dos **12 meses do ano** (Jan a Dez) destacando o mês em curso.
