import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Users, Bot, TrendingUp, PhoneCall, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/login")
  }

  const { data: userProfile } = await supabase.from("users").select("*, tenants(*)").eq("id", user.id).single()

  const [contactsResult, sessionsResult, messagesResult] = await Promise.all([
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("tenant_id", userProfile?.tenant_id),
    supabase.from("whatsapp_sessions").select("*").eq("tenant_id", userProfile?.tenant_id),
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", userProfile?.tenant_id)
      .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
  ])

  const stats = {
    totalContacts: contactsResult.count || 0,
    todayMessages: messagesResult.count || 0,
    activeSessions: sessionsResult.data?.filter((s) => s.status === "connected").length || 0,
    responseRate: 95,
  }

  const statsCards = [
    {
      title: "Total de Contatos",
      value: stats.totalContacts,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Mensagens Hoje",
      value: stats.todayMessages,
      icon: MessageSquare,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Sessões Ativas",
      value: stats.activeSessions,
      icon: PhoneCall,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Taxa de Resposta",
      value: `${stats.responseRate}%`,
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Bem-vindo, {userProfile?.full_name || user.email}</p>
        </div>
        <Badge variant="default" className="gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          {(userProfile as any)?.tenants?.plan || "Free"}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Conversas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.totalContacts === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma conversa ainda</p>
                  <p className="text-sm mt-1">Conecte uma sessão WhatsApp para começar</p>
                </div>
              ) : (
                [1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Contato {i}</p>
                      <p className="text-sm text-muted-foreground">Última mensagem há {i}h</p>
                    </div>
                    <Badge variant="secondary">Novo</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Primeiros Passos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  name: "Conectar WhatsApp",
                  status: stats.activeSessions > 0 ? "Concluído" : "Pendente",
                  href: "/whatsapp",
                },
                {
                  name: "Criar Primeiro Contato",
                  status: stats.totalContacts > 0 ? "Concluído" : "Pendente",
                  href: "/contacts",
                },
                { name: "Configurar Chatbot", status: "Pendente", href: "/chatbots" },
              ].map((step, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div
                    className={`w-10 h-10 rounded-full ${
                      step.status === "Concluído" ? "bg-green-500/10" : "bg-gray-500/10"
                    } flex items-center justify-center`}
                  >
                    <CheckCircle2
                      className={`w-5 h-5 ${step.status === "Concluído" ? "text-green-500" : "text-gray-500"}`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{step.name}</p>
                    <p className="text-sm text-muted-foreground">Status: {step.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
