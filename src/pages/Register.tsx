import type { FormEvent } from "react"
import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { toast } from "sonner"
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

export function Register() {
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    toast("Account creation submitted (demo)")
  }

  return (
    <AuthLayout
      eyebrow="Create your workspace"
      title="Turn commodity volatility into clearer procurement decisions."
      description="Set up an account for your team and start tracking aluminium, PET, energy, and barley signals in one place."
    >
      <Card className="w-full max-w-md rounded-lg border-border/80 bg-card/70 shadow-none">
        <CardHeader>
          <CardTitle className="display-serif text-3xl font-normal">Create account</CardTitle>
          <CardDescription>Start with your work email.</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="register-first-name">First name</Label>
                <Input
                  id="register-first-name"
                  name="firstName"
                  autoComplete="given-name"
                  placeholder="Marc"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-last-name">Last name</Label>
                <Input
                  id="register-last-name"
                  name="lastName"
                  autoComplete="family-name"
                  placeholder="Vendrell"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-company">Company</Label>
              <Input
                id="register-company"
                name="company"
                autoComplete="organization"
                placeholder="Cales"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-email">Email</Label>
              <Input
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="marc@cales.ai"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-password">Password</Label>
              <Input
                id="register-password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="mt-2 flex-col items-stretch gap-4">
            <Button type="submit" className="w-full">
              Create account
              <ArrowRight className="size-4" />
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Log in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  )
}
