import { useState } from "react"
import { ArrowUp, Sparkles } from "lucide-react"

export function AskBar() {
  const [value, setValue] = useState("")

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-background from-50% via-background/90 via-80% to-background/0 px-4 pb-5 pt-12">
      <div className="pointer-events-auto mx-auto w-full max-w-2xl">
        <form
          className="group flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-3 shadow-lg shadow-black/20 backdrop-blur transition-colors focus-within:border-foreground/25 hover:border-foreground/25 hover:bg-card"
          onSubmit={(event) => {
            event.preventDefault()
          }}
        >
          <Sparkles className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Ask Cales — e.g. “should we buy aluminium?”"
            aria-label="Ask Cales"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded-sm border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
            ⌘K
          </kbd>
          <button
            type="submit"
            aria-label="Send question"
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-90 transition-opacity group-hover:opacity-100"
          >
            <ArrowUp className="size-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
