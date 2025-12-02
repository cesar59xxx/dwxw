# 🚀 SaaS CRM + Chatbot Omnichannel para WhatsApp

Sistema completo de CRM com chatbot para gerenciamento de conversas WhatsApp, construído com Next.js 16, React 19, Supabase e Tailwind CSS.

## ✅ STATUS: PRONTO PARA TESTAR NA VERCEL!

O sistema está configurado com Supabase e pode ser testado imediatamente aqui no v0 ou fazer deploy na Vercel.

---

## ✨ Funcionalidades

### ✅ Funcionando Agora
- 🔐 **Autenticação Completa** - Sistema multi-tenant com Supabase Auth
- 👥 **CRM Completo** - Gestão de contatos com tags e notas
- 🔄 **Pipeline Kanban** - Funil de vendas visual (new → won/lost)
- 💬 **Inbox Profissional** - Interface estilo Zendesk/Intercom
- 🤖 **Editor de Chatbot** - Fluxos de automação visual
- 📊 **Dashboard Analítico** - Estatísticas em tempo real
- 🎨 **Tema Claro/Escuro** - Totalmente responsivo
- 🔒 **RLS Habilitado** - Segurança por Row Level Security

### 🚧 Para Adicionar Depois
- WhatsApp Web real com whatsapp-web.js (requer backend Node.js separado)
- WebSocket para mensagens em tempo real
- Sistema de pagamentos/billing
- Notificações push

---

## 🎯 Testar Agora (3 Passos)

### 1. Visualizar Preview
Clique no botão **"Open Preview"** no canto superior direito para ver o projeto rodando!

### 2. Criar Conta
1. Na página inicial, clique em **"Sign Up"**
2. Preencha:
   - Nome completo
   - Nome da empresa
   - Email
   - Senha (mín. 6 caracteres)
3. **IMPORTANTE**: Confirme seu email no link enviado pelo Supabase

### 3. Explorar o Sistema
Após fazer login, você terá acesso a:
- 📊 Dashboard com estatísticas
- 💬 Inbox de mensagens
- 👥 CRM de contatos
- 🔄 Pipeline Kanban
- 🤖 Editor de chatbot
- ⚙️ Configurações

---

## 🏗️ Arquitetura

\`\`\`
├── app/
│   ├── (auth)/          # Autenticação (login/sign-up)
│   ├── (dashboard)/     # Área protegida do app
│   │   ├── inbox/       # Chat em tempo real
│   │   ├── contacts/    # CRM
│   │   ├── pipeline/    # Funil Kanban
│   │   ├── chatbots/    # Automações
│   │   ├── whatsapp/    # Sessões WhatsApp
│   │   └── settings/    # Configurações
│   ├── (admin)/         # Painel SuperAdmin
│   └── api/             # API Routes Next.js
├── components/
│   ├── ui/              # shadcn/ui components
│   └── providers/       # Context providers
├── lib/
│   ├── supabase/        # Cliente Supabase
│   └── types/           # TypeScript types
├── scripts/             # SQL migrations
└── server/              # Backend Express (para WhatsApp real)
\`\`\`

---

## 🗄️ Banco de Dados Supabase

### Tabelas Criadas
- `tenants` - Clientes do SaaS (multi-tenant)
- `users` - Usuários/agentes
- `contacts` - Contatos do CRM
- `messages` - Histórico de mensagens
- `whatsapp_sessions` - Conexões WhatsApp
- `chatbot_flows` - Fluxos de automação
- `chatbot_logs` - Logs de execução

### Segurança
- ✅ Row Level Security (RLS) habilitado
- ✅ Políticas de acesso por tenant
- ✅ Triggers automáticos para signup
- ✅ Índices otimizados

---

## 🚀 Deploy

### Opção 1: Deploy Rápido (Recomendado)
1. Clique em **"Publish"** no v0
2. Escolha um nome para o projeto
3. Deploy automático para Vercel
4. Seu app estará em `seu-projeto.vercel.app`

### Opção 2: Via GitHub
1. Conecte ao GitHub pela sidebar
2. Faça commit do código
3. Acesse [vercel.com/new](https://vercel.com/new)
4. Importe o repositório
5. Deploy automático

### Variáveis de Ambiente
Já configuradas automaticamente pela integração Supabase:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 💻 Desenvolvimento Local

\`\`\`bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm start
\`\`\`

Acesse: `http://localhost:3000`

---

## 📱 WhatsApp Real (Backend Separado)

Para conectar WhatsApp real com whatsapp-web.js:

### Por Que Precisa de Backend Separado?
- `whatsapp-web.js` usa Puppeteer (Chrome headless)
- Não funciona em ambientes serverless/navegador
- Precisa de servidor com estado persistente

### Como Implementar?
Os arquivos do backend já estão na pasta `/server/`:

**Arquitetura Recomendada:**
\`\`\`
Frontend (Vercel)          Backend (VPS/Railway)
    ↓                              ↓
  Next.js  ←── REST API ────→  Express.js
  Supabase                    whatsapp-web.js
                              Puppeteer
                              MongoDB
                              Redis
\`\`\`

**Passos:**
1. Deploy backend em VPS, Railway ou Render
2. Configure MongoDB e Redis
3. Inicie whatsapp-web.js
4. Conecte frontend via variável `NEXT_PUBLIC_BACKEND_URL`

---

## 🎨 Customização

### Alterar Cores do Tema
Edite `app/globals.css`:
\`\`\`css
--primary: ...
--background: ...
--foreground: ...
\`\`\`

### Adicionar Logo
1. Coloque em `public/logo.png`
2. Atualize em `app/page.tsx`

### Modificar Planos
Edite limites em `scripts/001_create_tenants_and_users.sql`

---

## 📚 Stack Tecnológica

**Frontend:**
- Next.js 16 (App Router)
- React 19.2 (Server Components)
- TypeScript 5
- Tailwind CSS v4
- shadcn/ui + Radix UI

**Backend:**
- Supabase (PostgreSQL + Auth)
- API Routes Next.js
- Server Actions

**UI/UX:**
- React Hook Form + Zod
- Zustand (state management)
- Lucide React (icons)
- Recharts (gráficos)
- next-themes (tema)

**Deploy:**
- Vercel (frontend)
- Supabase (database)

---

## 📖 Documentação

- **[TESTE_AGORA.md](./TESTE_AGORA.md)** - Como testar o sistema agora
- **[DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)** - Guia completo de deploy
- **[GUIA_DE_USO.md](./GUIA_DE_USO.md)** - Como usar cada funcionalidade
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitetura técnica detalhada
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Solução de problemas

---

## 🔌 API Routes (Next.js)

### Endpoints Disponíveis

**Usuário:**
\`\`\`
GET    /api/user                  # Dados do usuário logado
PUT    /api/user                  # Atualizar perfil
\`\`\`

**Contatos:**
\`\`\`
GET    /api/contacts              # Listar contatos
POST   /api/contacts              # Criar contato
GET    /api/contacts/[id]         # Detalhes
PUT    /api/contacts/[id]         # Atualizar
DELETE /api/contacts/[id]         # Deletar
\`\`\`

**Sessões WhatsApp (Mock):**
\`\`\`
GET    /api/whatsapp/sessions     # Listar sessões
POST   /api/whatsapp/sessions     # Criar sessão
DELETE /api/whatsapp/sessions/[id] # Desconectar
\`\`\`

---

## 🆘 Troubleshooting

### Não consigo fazer login
- Confirmou o email do Supabase?
- Senha tem pelo menos 6 caracteres?
- Tente limpar cache e cookies

### Dashboard está vazio
- Normal em nova conta
- Crie contatos para ver dados
- Estatísticas aparecem conforme você usa

### Erro ao criar conta
- Email já está em uso?
- Verifique conexão com internet
- Tente outro navegador

### Preview não abre
- Clique no botão "Open Preview" no v0
- Se não funcionar, faça deploy na Vercel

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é open-source para fins de demonstração.

---

## 🙏 Créditos

- [Supabase](https://supabase.com/) - Backend as a Service
- [Vercel](https://vercel.com/) - Hospedagem e v0
- [shadcn/ui](https://ui.shadcn.com/) - Componentes UI
- [Next.js](https://nextjs.org/) - Framework React
- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) - WhatsApp API

---

**Desenvolvido com ❤️ usando v0 by Vercel**
