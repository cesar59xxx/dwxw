"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  Building2,
  Activity,
  DollarSign,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { format } from "date-fns"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeSessions: 0,
    totalUsers: 0,
    monthlyRevenue: 0,
  })
  const [tenants, setTenants] = useState([])
  const [sessions, setSessions] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [statsRes, tenantsRes, sessionsRes, logsRes] = await Promise.all([
        apiClient.get("/admin/stats"),
        apiClient.get("/admin/tenants"),
        apiClient.get("/admin/sessions"),
        apiClient.get("/admin/logs?limit=50"),
      ])

      setStats(statsRes.data)
      setTenants(tenantsRes.data)
      setSessions(sessionsRes.data)
      setLogs(logsRes.data)
    } catch (error) {
      toast.error("Erro ao carregar dados do painel")
    } finally {
      setLoading(false)
    }
  }

  const resetSession = async (sessionId: string) => {
    try {
      await apiClient.post(`/admin/sessions/${sessionId}/reset`)
      toast.success("Sessão resetada com sucesso")
      loadDashboardData()
    } catch (error) {
      toast.error("Erro ao resetar sessão")
    }
  }

  const updateTenantPlan = async (tenantId: string, plan: string) => {
    try {
      await apiClient.put(`/admin/tenants/${tenantId}/plan`, { plan })
      toast.success("Plano atualizado com sucesso")
      loadDashboardData()
    } catch (error) {
      toast.error("Erro ao atualizar plano")
    }
  }

  const filteredTenants = tenants.filter(
    (tenant: any) =>
      tenant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="container py-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTenants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sessões Ativas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSessions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.monthlyRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="tenants" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tenants">Clientes</TabsTrigger>
          <TabsTrigger value="sessions">Sessões WhatsApp</TabsTrigger>
          <TabsTrigger value="logs">Logs do Sistema</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        {/* Tenants Tab */}
        <TabsContent value="tenants" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gerenciar Clientes</CardTitle>
                  <CardDescription>Lista de todos os clientes cadastrados</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar cliente..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Button onClick={loadDashboardData}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Atualizar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sessões</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((tenant: any) => (
                    <TableRow key={tenant._id}>
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell>{tenant.email}</TableCell>
                      <TableCell>
                        <Badge variant={tenant.plan === "enterprise" ? "default" : "secondary"}>{tenant.plan}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tenant.isActive ? "default" : "destructive"}>
                          {tenant.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tenant.sessionCount || 0}/{tenant.limits?.maxSessions || 0}
                      </TableCell>
                      <TableCell>{format(new Date(tenant.createdAt), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Editar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar Cliente</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Plano</Label>
                                <Select
                                  defaultValue={tenant.plan}
                                  onValueChange={(value) => updateTenantPlan(tenant._id, value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="free">Free</SelectItem>
                                    <SelectItem value="starter">Starter</SelectItem>
                                    <SelectItem value="professional">Professional</SelectItem>
                                    <SelectItem value="enterprise">Enterprise</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sessões WhatsApp Ativas</CardTitle>
              <CardDescription>Monitoramento de todas as conexões WhatsApp</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Nome da Sessão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Última Atividade</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session: any) => (
                    <TableRow key={session._id}>
                      <TableCell>{session.tenant?.name}</TableCell>
                      <TableCell className="font-medium">{session.name}</TableCell>
                      <TableCell>
                        {session.status === "connected" && (
                          <Badge className="bg-green-500">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Conectado
                          </Badge>
                        )}
                        {session.status === "disconnected" && (
                          <Badge variant="destructive">
                            <XCircle className="mr-1 h-3 w-3" />
                            Desconectado
                          </Badge>
                        )}
                        {session.status === "qr" && (
                          <Badge variant="secondary">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Aguardando QR
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{session.phoneNumber || "-"}</TableCell>
                      <TableCell>
                        {session.lastActivity ? format(new Date(session.lastActivity), "dd/MM/yyyy HH:mm") : "-"}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => resetSession(session._id)}>
                          Resetar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs do Sistema</CardTitle>
              <CardDescription>Últimas 50 atividades do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {logs.map((log: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 border-b pb-2">
                    <Badge variant={log.level === "error" ? "destructive" : "secondary"}>{log.level}</Badge>
                    <div className="flex-1">
                      <p className="text-sm">{log.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sistema de Billing</CardTitle>
              <CardDescription>Gerenciamento de assinaturas e pagamentos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Starter</CardTitle>
                      <CardDescription>R$ 97/mês</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-1">
                        <li>2 sessões WhatsApp</li>
                        <li>500 contatos</li>
                        <li>5 agentes</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Professional</CardTitle>
                      <CardDescription>R$ 297/mês</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-1">
                        <li>5 sessões WhatsApp</li>
                        <li>5.000 contatos</li>
                        <li>20 agentes</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Enterprise</CardTitle>
                      <CardDescription>R$ 997/mês</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-1">
                        <li>Sessões ilimitadas</li>
                        <li>Contatos ilimitados</li>
                        <li>Agentes ilimitados</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <div className="rounded-lg border p-4 bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    Para integração real com Stripe, adicione suas chaves de API nas variáveis de ambiente e implemente
                    os webhooks conforme documentação.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
