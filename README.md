# G2 Diárias & Operacional 🛡️

Sistema de Gestão Operacional de Diárias, Escalas de Prestadores de Serviço e Pagamentos PIX para Segurança Privada.

## 🚀 Funcionalidades Principais

- **Calendário e Escala de Turnos**:
  - Visualização quinzenal (1ª Quinzena: 1 ao 15; 2ª Quinzena: 16 ao fim do mês).
  - Carga horária padrão de 3h com destaque de horas extras/dobras e feriados nacionais.
  - Edição rápida de horas por prestador e dia antes do fechamento.
  - Troca de serviço facilitada entre prestadores.
  - Importação de escalas enviadas via WhatsApp.
- **Gestão de Pagamentos e Previsão**:
  - Previsão de pagamento em tempo real calculada por quinzena e mês.
  - Alerta de pendências de pagamento.
  - Botão de status de pagamento com marcação visual clara de pago / a pagar.
  - Chaves PIX (CPF, Celular, E-mail, Chave Aleatória).
- **Cadastro e Gestão Operacional**:
  - Cadastro de Prestadores (Vigilantes) e Postos de Serviço (Diadema, Confiança, Penha, Santo André, Zona Norte).
  - Taxa horária customizável e controle de teto orçado.
  - Backup e restauração JSON.
- **Arquitetura Híbrida (Offline-First + Supabase Cloud)**:
  - Funciona 100% offline via `localStorage` sem depender de rede.
  - Sincronização automática em nuvem em tempo real com **PostgreSQL / Supabase** quando configurado.

---

## 🛠️ Tecnologias

- **Frontend**: React 19, Vite, Tailwind CSS 4, Lucide Icons, Material Symbols
- **Cloud Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

---

## 📦 Como Conectar com o Supabase

1. Crie uma conta ou acesse [supabase.com](https://supabase.com) e crie um novo projeto.
2. No menu **SQL Editor**, crie uma nova consulta e cole o conteúdo de [`supabase-schema.sql`](./supabase-schema.sql). Clique em **Run**.
3. (Recomendado) Em outra consulta, cole e rode [`supabase-hardening.sql`](./supabase-hardening.sql): adiciona validações dos dados e um registro de todas as alterações (pagamentos, chaves PIX, escala). Pode ser rodado com o app em uso.
4. Em **Authentication > Sign In / Providers**, desative **Allow new users to sign up**.
5. Em **Authentication > Users > Add user**, crie a conta de cada gestor (e-mail + senha forte, marque *Auto Confirm User*).
6. No **SQL Editor**, rode [`supabase-security.sql`](./supabase-security.sql) e depois cadastre os gestores na tabela `managers` (exemplo no final do arquivo; papéis: `diretor` ou `supervisor`).
7. Em **Project Settings > API**, copie a **Project URL** e a chave **anon public**.
8. Crie um arquivo `.env` localmente (ou configure as variáveis no Vercel):
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
   ```

> 🔒 O acesso aos dados exige login (Supabase Auth). Somente usuários cadastrados em `managers` leem ou gravam dados; apenas o `diretor` altera taxa padrão e teto orçado.

---

## 🌐 Publicação no Vercel

1. Acesse [vercel.com](https://vercel.com) e clique em **Add New... > Project**.
2. Importe o repositório `luanvasaki/g2-operacional`.
3. Em **Environment Variables**, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Clique em **Deploy**.
