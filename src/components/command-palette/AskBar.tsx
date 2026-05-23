import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowUp, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/api/client"
import { askActiveScreen } from "@/lib/screen-agent"

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
  const [submitting, setSubmitting] = useState(false)
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
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-4 pb-5 pt-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background via-background/80 to-transparent"
      />
      <div className="pointer-events-auto relative mx-auto w-full max-w-2xl">
        <AnimatePresence>
          {open && filtered.length > 0 ? (
            <motion.ul
              initial={{ opacity: 0, y: 12, scale: 0.97, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 10, scale: 0.97, filter: "blur(6px)" }}
              transition={{ duration: 0.26, ease: "easeOut" }}
              className="mb-2 origin-bottom overflow-hidden rounded-2xl border border-border/60 bg-card/90 p-1.5 shadow-[0_28px_80px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/[0.04] backdrop-blur-xl"
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
          onSubmit={async (event) => {
            event.preventDefault()
            const question = value.trim()
            if (!question || submitting) return
            setOpen(false)
            setSubmitting(true)
            try {
              const screenResponse = askActiveScreen(question)
              if (screenResponse) {
                const result = await screenResponse
                if (result.message) toast("Cales", { description: result.message })
                setValue("")
                return
              }
              const response = await api.chat(question)
              toast("Cales", { description: response.answer })
              setValue("")
            } catch (error) {
              const message = error instanceof Error ? error.message : "Unknown error"
              toast.error("Cales could not answer", { description: message })
            } finally {
              setSubmitting(false)
            }
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
            disabled={submitting}
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-90 transition-opacity group-hover:opacity-100"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
          </button>
        </form>
      </div>
    </div>
  )
}
