import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowUp, Sparkles } from "lucide-react"

const SUGGESTIONS = [
  "Should we buy aluminium now?",
  "What's the 3-month forecast for barley?",
  "Why is the energy recommendation a hedge?",
  "Which driver is moving PET prices most?",
  "Compare the 1-month and 6-month outlook.",
]

export function AskBar() {
  const [value, setValue] = useState("")
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  const query = value.trim().toLowerCase()
  const ghost = query ? SUGGESTIONS.find((s) => s.toLowerCase().startsWith(query)) : undefined
  const remainder = ghost ? ghost.slice(value.length) : ""
  const filtered = query ? SUGGESTIONS.filter((s) => s.toLowerCase().includes(query)) : SUGGESTIONS

  const pick = (s: string) => {
    setValue(s)
    setOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-background from-50% via-background/90 via-80% to-background/0 px-4 pb-5 pt-12">
      <div className="pointer-events-auto mx-auto w-full max-w-2xl">
        <AnimatePresence>
          {open && filtered.length > 0 ? (
            <motion.ul
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="mb-2 overflow-hidden rounded-2xl border border-border/70 bg-card/90 p-1.5 shadow-lg shadow-black/30 backdrop-blur-md"
            >
              {filtered.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault()
                      pick(suggestion)
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
                  >
                    <Sparkles className="size-3.5 shrink-0 text-cala/70" />
                    <span className="truncate">{suggestion}</span>
                  </button>
                </li>
              ))}
            </motion.ul>
          ) : null}
        </AnimatePresence>

        <form
          className="group flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-3 shadow-lg shadow-black/20 backdrop-blur transition-colors focus-within:border-foreground/25 hover:border-foreground/25 hover:bg-card"
          onSubmit={(event) => {
            event.preventDefault()
            setOpen(false)
          }}
        >
          <Sparkles className="size-4 shrink-0 text-muted-foreground" />
          <div className="relative min-w-0 flex-1">
            {remainder ? (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-pre text-sm"
              >
                <span className="invisible">{value}</span>
                <span className="text-muted-foreground/50">{remainder}</span>
              </div>
            ) : null}
            <input
              ref={inputRef}
              value={value}
              onChange={(event) => {
                setValue(event.target.value)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => window.setTimeout(() => setOpen(false), 120)}
              onKeyDown={(event) => {
                if ((event.key === "Tab" || event.key === "ArrowRight") && remainder) {
                  event.preventDefault()
                  if (ghost) setValue(ghost)
                }
                if (event.key === "Escape") setOpen(false)
              }}
              placeholder="Ask Cales — e.g. “should we buy aluminium?”"
              aria-label="Ask Cales"
              className="relative w-full bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
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
