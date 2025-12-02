"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"
import { Label } from "@/components/ui/label"

export default function SignUpPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    companyName: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem")
      return
    }

    if (formData.password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres")
      return
    }

    setIsLoading(true)
    console.log("[v0] =================================")
    console.log("[v0] Starting sign-up process...")
    console.log("[v0] Email:", formData.email)
    console.log("[v0] Company:", formData.companyName)
    console.log("[v0] =================================")

    const supabase = createClient()

    try {
      console.log("[v0] Calling supabase.auth.signUp...")

      const { error: signUpError, data } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            full_name: formData.fullName,
            company_name: formData.companyName,
          },
        },
      })

      if (signUpError) {
        console.error("[v0] =================================")
        console.error("[v0] Sign-up ERROR")
        console.error("[v0] Error message:", signUpError.message)
        console.error("[v0] Error code:", signUpError.code)
        console.error("[v0] Error status:", signUpError.status)
        console.error("[v0] Full error:", JSON.stringify(signUpError, null, 2))
        console.error("[v0] =================================")

        if (signUpError.message.includes("Invalid API key") || signUpError.message.includes("invalid api key")) {
          throw new Error(
            "Erro de configuração: Chave da API Supabase inválida. Verifique NEXT_PUBLIC_SUPABASE_ANON_KEY nas variáveis de ambiente da Vercel.",
          )
        }

        if (signUpError.message.includes("User already registered")) {
          throw new Error("Este email já está cadastrado. Tente fazer login.")
        }

        throw signUpError
      }

      console.log("[v0] =================================")
      console.log("[v0] Sign-up SUCCESS!")
      console.log("[v0] User ID:", data?.user?.id)
      console.log("[v0] User email:", data?.user?.email)
      console.log("[v0] Session:", data?.session ? "Created" : "Not created (email confirmation needed)")
      console.log("[v0] Redirecting to success page...")
      console.log("[v0] =================================")

      router.push("/sign-up-success")
    } catch (err: any) {
      console.error("[v0] Sign up error:", err)
      setError(err.message || "Erro ao criar conta")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">WhatsApp CRM</span>
          </div>
          <CardTitle className="text-center">Criar Conta</CardTitle>
          <CardDescription className="text-center">Comece seu teste grátis de 14 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 rounded-md border border-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="companyName">Nome da Empresa</Label>
              <Input
                id="companyName"
                placeholder="Minha Empresa"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Seu Nome</Label>
              <Input
                id="fullName"
                placeholder="João Silva"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repita sua senha"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Criando conta..." : "Criar conta grátis"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Fazer login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
