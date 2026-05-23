import { ArrowUp, Sparkles } from "lucide-react"

export function AskBar({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="pointer-events-none shrink-0 bg-gradient-to-t from-background via-background to-transparent px-4 pb-5 pt-10">
      <div className="pointer-events-auto mx-auto w-full max-w-2xl">
        <button
          type="button"
          onClick={onOpen}
          aria-keyshortcuts="Meta+K Control+K"
          className="group flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-3 text-left shadow-lg shadow-black/20 backdrop-blur transition-colors hover:border-foreground/25 hover:bg-card"
        >
          <Sparkles className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate text-sm text-muted-foreground">
            Ask Cales — e.g. “should we buy aluminium?”
          </span>
          <kbd className="hidden rounded-sm border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
            ⌘K
          </kbd>
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-90 transition-opacity group-hover:opacity-100">
            <ArrowUp className="size-4" />
          </span>
        </button>
      </div>
    </div>
  )
}
