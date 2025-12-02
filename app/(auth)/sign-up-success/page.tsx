import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Mail } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">WhatsApp CRM</span>
          </div>
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <Mail className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <CardTitle className="text-center">Verifique seu email!</CardTitle>
          <CardDescription className="text-center">Enviamos um link de confirmação para seu email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Você se registrou com sucesso! Por favor, verifique seu email e clique no link de confirmação para ativar
            sua conta antes de fazer login.
          </p>

          <div className="pt-4 space-y-2">
            <Link href="/login" className="block">
              <Button variant="outline" className="w-full bg-transparent">
                Voltar para Login
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground text-center pt-2">
            Não recebeu o email? Verifique sua pasta de spam
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
