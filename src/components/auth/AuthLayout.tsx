import { useState } from "react"
import { Link } from "react-router-dom"
import { Logo } from "@/components/layout/Logo"
import { cn } from "@/lib/utils"

interface AuthLayoutProps {
  children: React.ReactNode
  eyebrow: string
  description: string
}

export function AuthLayout({ children, eyebrow, description }: AuthLayoutProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  return (
    <main className="dark grid min-h-svh bg-background text-foreground [color-scheme:dark] lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.75fr)]">
      <section className="relative hidden overflow-hidden border-r border-border bg-sidebar lg:block">
        <img
          src="/pexels-matreding-11666903.jpg"
          alt=""
          onLoad={() => setImageLoaded(true)}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out",
            imageLoaded ? "opacity-20" : "opacity-0",
          )}
        />
        <div className="relative flex h-full flex-col p-10">
          <Logo />
          <div className="flex flex-1 items-center">
            <div className="max-w-lg">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {eyebrow}
              </p>
              <h1 className="display-serif mt-4 text-5xl leading-tight text-foreground">
                See the latest buying signals before the market moves.
              </h1>
              <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
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
