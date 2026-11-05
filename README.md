# Meu Bolso - Aplicativo Mobile de Controle Financeiro Pessoal

Aplicativo Android desenvolvido em **React Native com Expo (SDK 58)**, pronto para execução e testes instantâneos via **Expo Go** e compilação de APK independente via **Expo (EAS Build / Local)**, reproduzindo com máxima fidelidade visual e funcional o protótipo de 6 telas projetado no Figma, aprimorado com **Tela de Perfil**, **Automação de Gastos Recorrentes**, **Modo Claro e Escuro**, **Internacionalização (Inglês e Português)** e **Notificações Locais**.

---

## 📱 Telas Desenvolvidas

1. **Tela 1 – Login e Cadastro (`AuthScreen.js`)**:
   - Autenticação e cadastro com persistência de sessão via `AsyncStorage`.
   - Alternância fluida entre Login e Cadastro com validação de senhas coincidentes.
   - Base limpa para registro seguro de novos usuários e login real.
   - Acesso rápido à troca de idioma (PT/EN) e tema (Claro/Escuro) diretamente na tela inicial.
   - Recuperação didática de senha com redefinição local.
   - Mensagem de segurança e garantia de privacidade de dados.

2. **Tela 2 – Página Inicial / Dashboard (`DashboardScreen.js`)**:
   - Saudação personalizada com avatar e iniciais do usuário que navega para o Perfil.
   - Card roxo vibrante com saldo disponível e toggle para ocultar/exibir valores.
   - Resumo rápido de Receitas e Despesas do mês com navegação contextual.
   - Gráfico vetorial SVG de **Evolução do Saldo** ao longo dos dias do mês.
   - Lista das últimas movimentações com badge contextual de recorrência (`🔁 Recorrente`).
   - Acesso a detalhes, edição e exclusão de movimentações com confirmação.

3. **Tela 3 – Movimentações (`TransactionsScreen.js`)**:
   - Navegação cronológica de meses (`< Outubro 2026 >`).
   - Filtros dinâmicos: **Todas**, **Receitas** e **Despesas**.
   - Barra de busca textual por descrição ou categoria.
   - Listagem agrupada por data (`31 out · sábado`, `Oct 31 · Saturday`, etc.).
   - Visualização de detalhes, edição e exclusão de transações.

4. **Tela 4 – Nova Movimentação (`NewTransactionScreen.js`)**:
   - Alternância intuitiva entre Receita e Despesa.
   - Campo de valor destacado em tipografia grande com formatação monetária em tempo real.
   - Seleção de categoria via modal interativo com ícones específicos.
   - Seleção de data com atalhos rápidos.
   - **Opção de Recorrência Mensal**: Permite marcar a despesa para repetir todo mês automaticamente no dia do vencimento escolhido.
   - Campo para observações adicionais opcionais.
   - Atualização automática e instantânea de saldo, orçamentos e relatórios.

5. **Tela 5 – Orçamento (`BudgetScreen.js`)**:
   - Card de resumo: total planejado, já utilizado, disponível e porcentagem gasta.
   - Barra de progresso geral horizontal.
   - Limites individuais por categoria (Moradia, Alimentação, Transporte, Lazer, Outros) com barras de progresso proporcionais.
   - Alerta visual dinâmico quando uma categoria se aproxima (≥ 90%) ou ultrapassa o limite planejado.
   - Modal completo de edição de limites para customização em tempo real.
   - Card de resumo de **Gastos Recorrentes** com atalho para gerenciamento.

6. **Tela 6 – Relatórios (`ReportsScreen.js`)**:
   - Total economizado no mês com badge de variação percentual em relação ao mês anterior.
   - Gráfico de barras SVG comparativo de receitas e despesas entre meses (Agosto, Setembro e Outubro).
   - Gráfico Donut SVG de distribuição das despesas por categoria com percentuais e tabela detalhada.
   - Card de destaque identificando a maior despesa do período.
   - Ação de exportação do relatório financeiro consolidado.

7. **Tela 7 – Perfil do Usuário (`ProfileScreen.js`)**:
   - Avatar com iniciais dinâmicas geradas a partir do nome cadastrado.
   - Edição de nome completo, e-mail e alteração de senha com validação e persistência local.
   - **Alternância de Tema**: Modo Claro, Modo Escuro e Padrão do Sistema (persistido no aparelho).
   - **Alternância de Idioma**: Português (Brasil) e English (US) com tradução instantânea de todas as telas, abas e termos financeiros.
   - Resumo da conta (total de movimentações cadastradas e economia do mês).
   - Atalho para o gerenciamento de **Gastos Recorrentes**.
   - Ações para limpar todos os dados do aplicativo e encerramento seguro de sessão (Logout).

8. **Tela 8 – Gastos Recorrentes Automatizados (`RecurringExpensesScreen.js`)**:
   - Visualização de todas as despesas fixas cadastradas (aluguel, contas, internet, assinaturas).
   - Total mensal fixo comprometido e contador de despesas ativas.
   - Ativação ou pausa de regras individuais via Switch.
   - Modal para cadastrar novos gastos fixos ou editar descrição, valor, categoria e dia do mês.
   - **Lançamento Automático**: Ao abrir o aplicativo ou navegar para qualquer mês, o sistema gera automaticamente os lançamentos devidos no dia correto caso ainda não existam.
   - Botão para sincronização / lançamento imediato de pendências.

9. **Tela 9 – Bloco de Anotações Financeiras & Pix (`NotesScreen.js` - RF03 & RF10)**:
   - Registro ágil de notas livres, ideias de economia, lembretes e chaves Pix.
   - Persistência estruturada em `@meubolso_anotacoes` (`id`, `titulo`, `conteudo`, `dataCriacao`).
   - Cópia da chave Pix ou conteúdo da anotação com **um toque** para a área de transferência.
   - Barra de pesquisa textual em tempo real e separação por categorias visuais com badges.

10. **Tela 10 – Metas Financeiras / "Cofrinho" (`GoalsScreen.js` - RF05)**:
    - Criação e acompanhamento de metas de poupança (Reserva de emergência, Viagens, Estudos).
    - Persistência estruturada em `@meubolso_metas` (`id`, `titulo`, `valorAlvo`, `valorAtual`, `dataLimite`, `categoria`, `icone`).
    - Barra de progresso visual com percentual dinâmico acumulado e valor restante.
    - Ações rápidas de **Depósito ("Guardar")** e **Resgate** com cálculo instantâneo.

---

## 📊 Conformidade com os Requisitos do Relatório Técnico (UNINASSAU)

| Requisito | Descrição | Status |
| :--- | :--- | :---: |
| **RF01** | Gestão de Despesas Realizadas (CRUD de receitas e despesas) | ✅ Concluído |
| **RF02** | Planejamento de Gastos Futuros (`status: pretendido`) e conversão em 1 toque | ✅ Concluído |
| **RF03** | Bloco de Anotações Financeiras e Chaves Pix (`@meubolso_anotacoes`) | ✅ Concluído |
| **RF04** | Categorização e Limites mensais por categoria com avisos visuais | ✅ Concluído |
| **RF05** | Metas Financeiras ("Cofrinho") com barras de progresso e percentuais | ✅ Concluído |
| **RF06** | Cálculo de Saldo Líquido Atual e Projeção Futura com gastos pretendidos | ✅ Concluído |
| **RF07** | Persistência Local Permanente no dispositivo via `AsyncStorage` | ✅ Concluído |
| **RF08** | Consulta de Cotação de Moedas em Tempo Real (AwesomeAPI Dólar e Euro) | ✅ Concluído |
| **RF09** | Notificações locais Android com lembrete diário às 20h e avisos de vencimento (`@notifee/react-native`) | ✅ Concluído |
| **RF10** | Filtro e Pesquisa por palavras-chave e categorias | ✅ Concluído |
| **RNF01** | Usabilidade ágil (efetivação em 1 toque, fluxos em até 3 toques) | ✅ Concluído |
| **RNF02** | Compatibilidade com Android 8.0+ (API 26+) | ✅ Concluído |
| **RNF03** | Resiliência Offline com tratamento `try/catch` e cache local | ✅ Concluído |
| **RNF04** | Feedback visual com `ActivityIndicator` em chamadas assíncronas | ✅ Concluído |

---

## 🛠️ Tecnologias Utilizadas

- **Expo (SDK 58)** & **React Native (v0.88+)** & **React (v19+)**: Plataforma universal moderna com suporte nativo e suporte total ao **Expo Go**.
- **Expo Notifications (`expo-notifications`)**: Agendamento de lembretes diários e alertas de vencimento com total compatibilidade no Expo Go e em builds APK.
- **Expo Vector Icons (`@expo/vector-icons`)**: Ícones Ionicons integrados nativamente ao Expo Go sem problemas de fontes.
- **React Navigation (v7)**: Navegação por pilhas (`@react-navigation/native-stack`) e abas inferiores (`@react-navigation/bottom-tabs`).
- **AsyncStorage**: Persistência local e segura de dados (sessão, credenciais, transações, gastos recorrentes, orçamentos, tema e idioma).
- **React Native SVG**: Gráficos vetoriais customizados de alta performance.

---

## 🚀 Como Executar o Projeto

Consulte o arquivo [`MANUAL_EXECUCAO.md`](./MANUAL_EXECUCAO.md) para o passo a passo detalhado.

### 1. Testes via Expo Go (Sem necessidade de compilar ou instalar Android Studio):

```bash
# Instalar as dependências
npm install

# Iniciar o servidor de desenvolvimento do Expo
npm start
```

Abra o aplicativo **Expo Go** no seu celular Android e leia o QR Code exibido no terminal. Ou pressione `a` para abrir no emulador Android.

### 2. Compilação de APK independente via Expo (EAS Build na Nuvem):

Não requer instalação de SDK, JDK, Gradle ou Android Studio no computador:

```bash
# Fazer login no Expo (caso ainda não esteja logado)
npx eas-cli login

# Compilar APK de instalação direta via EAS Build
npm run build:apk
```

Ao término, o EAS Build disponibilizará o link e o QR Code para download do APK diretamente no celular.

---

## 📚 Documentação para Estudantes de Sistemas de Informação

Para compreender a arquitetura, o fluxo de dados, a persistência e os novos padrões de internacionalização, temas e automação aplicados, consulte o arquivo [`DOCUMENTACAO.md`](./DOCUMENTACAO.md).
