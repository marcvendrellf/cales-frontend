import type { FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function Login() {
  const navigate = useNavigate()

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigate("/")
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="See the latest buying signals before the market moves."
      description="Sign in to return to your commodity dashboard, scenario tools, and recommendation history."
    >
      <Card className="w-full max-w-md rounded-lg border-border/80 bg-card/70 shadow-none">
        <CardHeader>
          <CardTitle className="display-serif text-3xl font-normal">Log in</CardTitle>
          <CardDescription>Use your Cales account to continue.</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="marc@cales.ai"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="login-password">Password</Label>
                <Link
                  to="/login"
                  className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
              />
            </div>
          </CardContent>
          <CardFooter className="mt-2 flex-col items-stretch gap-4">
            <Button type="submit" className="w-full">
              Log in
              <ArrowRight className="size-4" />
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              New to Cales?{" "}
              <Link
                to="/register"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Create an account
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  )
}
