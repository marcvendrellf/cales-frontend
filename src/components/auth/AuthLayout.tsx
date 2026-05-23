import { Link } from "react-router-dom"
import { Logo } from "@/components/layout/Logo"

interface AuthLayoutProps {
  children: React.ReactNode
  eyebrow: string
  title: string
  description: string
}

export function AuthLayout({ children, eyebrow, title, description }: AuthLayoutProps) {
  return (
    <main className="grid min-h-svh bg-background text-foreground lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.75fr)]">
      <section className="relative hidden overflow-hidden border-r border-border bg-sidebar lg:block">
        <img
          src="/alluminium.png"
          alt=""
          className="absolute bottom-16 right-[-12%] w-[68%] opacity-20"
        />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Logo />
          <div className="max-w-lg">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {eyebrow}
            </p>
            <h1 className="display-serif mt-4 text-5xl leading-tight text-foreground">
              {title}
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Market signals for procurement teams.
          </p>
        </div>
      </section>

      <section className="flex min-h-svh flex-col">
        <header className="flex h-16 items-center justify-between px-6 lg:hidden">
          <Link to="/" aria-label="Go to Cales command center">
            <Logo />
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center px-6 py-10">
          {children}
        </div>
      </section>
    </main>
  )
}
