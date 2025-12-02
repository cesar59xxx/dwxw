"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Copy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function StatusPage() {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const envVars = [
    {
      name: "NEXT_PUBLIC_SUPABASE_URL",
      value: process.env.NEXT_PUBLIC_SUPABASE_URL,
      required: true,
      description: "URL do projeto Supabase",
    },
    {
      name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      required: true,
      description: "Chave pública (anon) do Supabase",
      showPartial: true,
    },
    {
      name: "NEXT_PUBLIC_API_URL",
      value: process.env.NEXT_PUBLIC_API_URL,
      required: true,
      description: "URL do backend no Railway",
    },
    {
      name: "SUPABASE_SERVICE_ROLE_KEY",
      value: process.env.SUPABASE_SERVICE_ROLE_KEY,
      required: false,
      description: "Chave service_role para Server Actions",
      showPartial: true,
    },
  ]

  const checkSupabaseKey = () => {
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!key) return null

    try {
      const payload = key.split(".")[1]
      if (!payload) return null

      const decoded = JSON.parse(atob(payload))
      return decoded.role
    } catch {
      return null
    }
  }

  const keyRole = checkSupabaseKey()

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">Status do Sistema</h1>
        <p className="text-muted-foreground">Verificação de configuração e variáveis de ambiente</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Variáveis de Ambiente</CardTitle>
          <CardDescription>Configurações necessárias para o funcionamento do sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {envVars.map((envVar) => {
            const isSet = !!envVar.value
            const displayValue =
              envVar.showPartial && envVar.value
                ? `${envVar.value.substring(0, 20)}...${envVar.value.substring(envVar.value.length - 10)}`
                : envVar.value || "NÃO CONFIGURADA"

            return (
              <div key={envVar.name} className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{envVar.name}</code>
                    {envVar.required ? (
                      isSet ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Opcional
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{envVar.description}</p>
                  <p className="text-sm font-mono bg-muted/50 p-2 rounded break-all">{displayValue}</p>
                </div>
                {isSet && envVar.value && (
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(envVar.value!, envVar.name)}>
                    {copied === envVar.name ? "Copiado!" : <Copy className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {keyRole && (
        <Card className={keyRole === "anon" ? "border-green-500" : "border-red-500"}>
          <CardHeader>
            <CardTitle>Verificação da Chave Supabase</CardTitle>
          </CardHeader>
          <CardContent>
            {keyRole === "anon" ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span>Chave ANON correta - pronta para uso no frontend</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  <span className="font-semibold">ERRO: Você está usando a chave {keyRole.toUpperCase()}!</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  A variável NEXT_PUBLIC_SUPABASE_ANON_KEY deve conter a chave &quot;anon public&quot;, não a
                  &quot;service_role&quot;. Vá ao Supabase Dashboard e copie a chave correta.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Links Úteis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <a
            href="https://supabase.com/dashboard/project/1dieqcofmincppqzownw/settings/api"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 hover:bg-muted rounded-lg transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Supabase API Settings</span>
          </a>
          <a
            href="https://railway.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 hover:bg-muted rounded-lg transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Railway Dashboard</span>
          </a>
          <a href="/diagnostics" className="flex items-center gap-2 p-3 hover:bg-muted rounded-lg transition-colors">
            <ExternalLink className="h-4 w-4" />
            <span>Página de Diagnóstico Completo</span>
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instruções Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h3 className="font-semibold mb-1">1. Verificar Supabase</h3>
            <p className="text-muted-foreground">
              Acesse o link acima, copie a chave &quot;anon public&quot; e cole em NEXT_PUBLIC_SUPABASE_ANON_KEY
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">2. Verificar Railway</h3>
            <p className="text-muted-foreground">
              Confirme que NEXT_PUBLIC_API_URL aponta para: https://whatsapp-api-web-oi-production.up.railway.app
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">3. Redeploy</h3>
            <p className="text-muted-foreground">
              Após alterar variáveis na Vercel, faça redeploy para aplicar as mudanças
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">4. Testar</h3>
            <p className="text-muted-foreground">
              Acesse /diagnostics para testar conectividade com backend e Supabase
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
