import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageSquare, Zap, Users, BarChart3, Bot, Shield } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">WhatsApp CRM</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Recursos
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Preços
            </Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Entrar
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Começar Grátis</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm">
            <Zap className="w-4 h-4 text-primary" />
            <span>Gestão completa de WhatsApp em um só lugar</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-bold text-balance leading-tight">
            Transforme conversas em <span className="text-primary">resultados</span>
          </h1>
          <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
            CRM completo + Chatbot inteligente para WhatsApp. Automatize atendimento, gerencie leads e aumente suas
            vendas com a plataforma omnichannel definitiva.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="text-base">
                Começar Agora - Grátis
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-base bg-transparent">
                Já tenho conta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-20 bg-muted/30 rounded-3xl">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold">Tudo que você precisa</h2>
            <p className="text-xl text-muted-foreground">
              Uma plataforma completa para gestão profissional do WhatsApp
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: MessageSquare,
                title: "Inbox Unificado",
                description: "Gerencie todas as conversas em tempo real com interface moderna estilo Zendesk",
              },
              {
                icon: Bot,
                title: "Chatbot Inteligente",
                description: "Crie fluxos automatizados com editor visual drag-and-drop",
              },
              {
                icon: Users,
                title: "CRM Completo",
                description: "Pipeline kanban, tags, segmentação e histórico completo de interações",
              },
              {
                icon: BarChart3,
                title: "Analytics Avançado",
                description: "Dashboards e relatórios detalhados sobre atendimento e conversões",
              },
              {
                icon: Zap,
                title: "Multi-sessão",
                description: "Conecte múltiplos números WhatsApp em uma única plataforma",
              },
              {
                icon: Shield,
                title: "100% Seguro",
                description: "Seus dados protegidos com criptografia e redundância total",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-card p-6 rounded-2xl border border-border space-y-3 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto bg-primary text-primary-foreground rounded-3xl p-12 text-center space-y-6">
          <h2 className="text-4xl font-bold">Pronto para começar?</h2>
          <p className="text-xl opacity-90">Junte-se a centenas de empresas que já automatizaram seu atendimento</p>
          <Link href="/sign-up">
            <Button size="lg" variant="secondary" className="text-base">
              Criar Conta Grátis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 WhatsApp CRM. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
