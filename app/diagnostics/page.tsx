"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react"

interface DiagnosticResult {
  test: string
  status: "success" | "error" | "warning"
  message: string
  details?: string
}

export default function DiagnosticsPage() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runDiagnostics = async () => {
    setIsRunning(true)
    const diagnostics: DiagnosticResult[] = []

    // 1. Verificar variáveis de ambiente
    console.log("[v0] === DIAGNÓSTICO COMPLETO ===")
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    console.log("[v0] NEXT_PUBLIC_API_URL:", apiUrl)
    console.log("[v0] NEXT_PUBLIC_BACKEND_URL:", backendUrl)
    console.log("[v0] NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl)

    if (!apiUrl && !backendUrl) {
      diagnostics.push({
        test: "Variáveis de Ambiente",
        status: "error",
        message: "NEXT_PUBLIC_API_URL não configurada",
        details: "Configure NEXT_PUBLIC_API_URL na Vercel com a URL do Railway",
      })
    } else {
      diagnostics.push({
        test: "Variáveis de Ambiente",
        status: "success",
        message: `URL configurada: ${apiUrl || backendUrl}`,
      })
    }

    const finalUrl = apiUrl || backendUrl || "http://localhost:3001"

    // 2. Testar conectividade com backend - Root
    try {
      console.log("[v0] Testando conectividade:", finalUrl)
      const response = await fetch(finalUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Backend response:", data)
        diagnostics.push({
          test: "Conectividade Backend (Root)",
          status: "success",
          message: `Backend respondendo: ${data.message || "OK"}`,
          details: JSON.stringify(data, null, 2),
        })
      } else {
        diagnostics.push({
          test: "Conectividade Backend (Root)",
          status: "error",
          message: `Erro HTTP ${response.status}: ${response.statusText}`,
          details: await response.text(),
        })
      }
    } catch (error: any) {
      console.error("[v0] Erro ao conectar:", error)
      diagnostics.push({
        test: "Conectividade Backend (Root)",
        status: "error",
        message: "Falha ao conectar com backend",
        details: `${error.message}\n\nURL tentada: ${finalUrl}\n\nPossíveis causas:\n- URL incorreta na NEXT_PUBLIC_API_URL\n- Backend offline no Railway\n- CORS bloqueando requisições`,
      })
    }

    // 3. Testar endpoint de health
    try {
      console.log("[v0] Testando /health:", `${finalUrl}/health`)
      const response = await fetch(`${finalUrl}/health`)

      if (response.ok) {
        const data = await response.json()
        diagnostics.push({
          test: "Health Check",
          status: "success",
          message: "Health endpoint respondendo",
          details: JSON.stringify(data, null, 2),
        })
      } else {
        diagnostics.push({
          test: "Health Check",
          status: "warning",
          message: `Health endpoint retornou ${response.status}`,
        })
      }
    } catch (error: any) {
      diagnostics.push({
        test: "Health Check",
        status: "error",
        message: "Health endpoint não acessível",
        details: error.message,
      })
    }

    // 4. Testar endpoint da API
    try {
      console.log("[v0] Testando /api/health:", `${finalUrl}/api/health`)
      const response = await fetch(`${finalUrl}/api/health`)

      if (response.ok) {
        const data = await response.json()
        diagnostics.push({
          test: "API Health Check",
          status: "success",
          message: "API endpoints acessíveis",
          details: JSON.stringify(data, null, 2),
        })
      } else {
        diagnostics.push({
          test: "API Health Check",
          status: "warning",
          message: `API retornou ${response.status}`,
        })
      }
    } catch (error: any) {
      diagnostics.push({
        test: "API Health Check",
        status: "error",
        message: "API endpoints não acessíveis",
        details: error.message,
      })
    }

    // 5. Verificar CORS
    try {
      console.log("[v0] Testando CORS:", `${finalUrl}/api/health`)
      const response = await fetch(`${finalUrl}/api/health`, {
        method: "OPTIONS",
      })

      const corsHeaders = {
        "access-control-allow-origin": response.headers.get("access-control-allow-origin"),
        "access-control-allow-methods": response.headers.get("access-control-allow-methods"),
        "access-control-allow-headers": response.headers.get("access-control-allow-headers"),
      }

      console.log("[v0] CORS Headers:", corsHeaders)

      if (corsHeaders["access-control-allow-origin"]) {
        diagnostics.push({
          test: "Configuração CORS",
          status: "success",
          message: "CORS configurado corretamente",
          details: JSON.stringify(corsHeaders, null, 2),
        })
      } else {
        diagnostics.push({
          test: "Configuração CORS",
          status: "warning",
          message: "Headers CORS não encontrados",
          details: "Verifique configuração CORS no backend",
        })
      }
    } catch (error: any) {
      diagnostics.push({
        test: "Configuração CORS",
        status: "error",
        message: "Não foi possível verificar CORS",
        details: error.message,
      })
    }

    // 6. Testar Supabase
    if (supabaseUrl) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          },
        })

        diagnostics.push({
          test: "Conexão Supabase",
          status: response.ok ? "success" : "error",
          message: response.ok ? "Supabase acessível" : `Supabase retornou ${response.status}`,
        })
      } catch (error: any) {
        diagnostics.push({
          test: "Conexão Supabase",
          status: "error",
          message: "Falha ao conectar com Supabase",
          details: error.message,
        })
      }
    }

    console.log("[v0] === FIM DO DIAGNÓSTICO ===")
    setResults(diagnostics)
    setIsRunning(false)
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  const getIcon = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500">Sucesso</Badge>
      case "error":
        return <Badge variant="destructive">Erro</Badge>
      case "warning":
        return <Badge variant="secondary">Aviso</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Diagnóstico do Sistema</h1>
          <p className="text-muted-foreground">Verificação completa de conectividade e configuração</p>
        </div>
        <Button onClick={runDiagnostics} disabled={isRunning}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? "animate-spin" : ""}`} />
          Executar Novamente
        </Button>
      </div>

      <div className="space-y-4">
        {results.map((result, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getIcon(result.status)}
                  <CardTitle className="text-lg">{result.test}</CardTitle>
                </div>
                {getStatusBadge(result.status)}
              </div>
              <CardDescription>{result.message}</CardDescription>
            </CardHeader>
            {result.details && (
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">{result.details}</pre>
              </CardContent>
            )}
          </Card>
        ))}

        {results.length === 0 && isRunning && (
          <Card>
            <CardContent className="py-12 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Executando diagnósticos...</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Instruções de Correção</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Se o backend não está respondendo:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Verifique se a URL está correta nas variáveis de ambiente da Vercel</li>
              <li>Acesse o Railway e confirme que o serviço está rodando</li>
              <li>Verifique os logs do Railway para erros</li>
              <li>Confirme que a porta 5000 está acessível</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Configuração correta das variáveis:</h3>
            <pre className="bg-muted p-4 rounded-lg text-sm">
              {`NEXT_PUBLIC_API_URL=https://whatsapp-api-web-oi-production.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Abra o Console do Navegador (F12)</h3>
            <p className="text-sm text-muted-foreground">
              Todos os logs detalhados começam com [v0] - procure por mensagens de erro relacionadas a fetch ou CORS
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
