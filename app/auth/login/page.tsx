import { LoginForm } from "@/components/auth/login-form"
import { Logo } from "@/components/logo"
import { ModeToggle } from "@/components/mode-toggle"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4 flex-col">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      <div className="mb-8 flex flex-col items-center">
        <Logo width={300} height={75} />
      </div>

      <LoginForm />
    </div>
  )
}
