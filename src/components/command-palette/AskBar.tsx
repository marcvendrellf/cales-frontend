import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowUp, Loader2, Sparkles, X } from "lucide-react"
import { api } from "@/api/client"
import { askActiveScreen } from "@/lib/screen-agent"
import { cn } from "@/lib/utils"

const DEMO_HOWTO_QUESTION = "Explain how to use this demo"

const DEMO_WALKTHROUGH =
  "Welcome to Calés! 👋 This is a demo deployment: both the frontend and the backend are live, but no API keys are configured, so agent interaction is limited. To see a real report created by the agent crew, go to **Reports** → pick a commodity → **Report List**, and open the report marked **Ready**."

const SUGGESTIONS = [
  DEMO_HOWTO_QUESTION,
  "Should we buy aluminium now?",
  "What's the 3-month forecast for barley?",
  "Why is the energy recommendation a hedge?",
  "Which driver is moving PET prices most?",
  "Compare the 1-month and 6-month outlook.",
]

function formatElapsed(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

type Message = { role: "user" | "assistant"; text: string }

const MESSAGE_IN = {
  initial: { opacity: 0, y: 8, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
}

/** Reveal `text` character-by-character. Bounded so long answers don't crawl:
 *  each tick reveals more chars as the text grows, finishing in ~2s max. */
function useTypewriter(text: string) {
  const [shown, setShown] = useState("")
  useEffect(() => {
    if (!text) {
      setShown("")
      return
    }
    setShown(text.slice(0, 1))
    let i = 1
    const step = Math.max(1, Math.ceil(text.length / 140))
    const id = window.setInterval(() => {
      i = Math.min(text.length, i + step)
      setShown(text.slice(0, i))
      if (i >= text.length) window.clearInterval(id)
    }, 16)
    return () => window.clearInterval(id)
  }, [text])
  return { shown, done: shown.length >= text.length }
}

/** Render `**bold**` spans in a (possibly mid-typewriter) string. An
 *  unclosed trailing marker renders as plain text until typing completes. */
function RichText({ text }: { text: string }) {
  let source = text
  const markers = source.split("**").length - 1
  if (markers % 2 === 1) source = source.slice(0, source.lastIndexOf("**"))
  return (
    <>
      {source.split("**").map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-foreground">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

function AssistantMessage({ text, onType }: { text: string; onType?: () => void }) {
  const { shown, done } = useTypewriter(text)

  // Keep the chat pinned to the bottom as the answer types out.
  useEffect(() => {
    onType?.()
  }, [shown, onType])

  return (
    <motion.div className="flex items-start gap-2.5" {...MESSAGE_IN}>
      <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-cala/15 ring-1 ring-cala/30">
        <Sparkles className="size-3 text-cala" />
      </div>
      <div className="min-w-0 flex-1 space-y-1 pt-0.5">
        <p className="text-[11px] font-medium text-cala">Cales</p>
        <div className="text-sm leading-6 text-foreground/90 whitespace-pre-wrap">
          <RichText text={shown} />
          {!done ? (
            <span
              aria-hidden
              className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse rounded-full bg-cala/80 align-middle"
            />
          ) : null}
        </div>
      </div>
    </motion.div>
  )
}

function UserMessage({ text }: { text: string }) {
  return (
    <motion.div className="flex justify-end" {...MESSAGE_IN}>
      <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-foreground/10 px-3.5 py-2.5 text-sm leading-6 text-foreground ring-1 ring-white/[0.06]">
        {text}
      </div>
    </motion.div>
  )
}

export function AskBar() {
  const [value, setValue] = useState("")
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [messages, setMessages] = useState<Message[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  // Greet the user shortly after they enter the app, once per browser session:
  // explain the demo setup and point them to the pre-generated reports.
  useEffect(() => {
    if (sessionStorage.getItem("cales-demo-greeted")) return
    const id = window.setTimeout(() => {
      sessionStorage.setItem("cales-demo-greeted", "1")
      setMessages((prev) =>
        prev.length === 0
          ? [{ role: "assistant", text: DEMO_WALKTHROUGH }]
          : prev,
      )
    }, 2000)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    if (!submitting) return
    setElapsed(0)
    const id = window.setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [submitting])

  const scrollToBottom = useCallback(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, submitting, scrollToBottom])

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
  const hasChat = messages.length > 0

  const pick = (s: string) => {
    setValue(s)
    setOpen(false)
    inputRef.current?.focus()
  }

  const submit = async (question: string) => {
    setOpen(false)
    setMessages((prev) => [...prev, { role: "user", text: question }])
    setValue("")
    if (question.trim().toLowerCase() === DEMO_HOWTO_QUESTION.toLowerCase()) {
      setMessages((prev) => [...prev, { role: "assistant", text: DEMO_WALKTHROUGH }])
      return
    }
    setSubmitting(true)
    try {
      const screenResponse = askActiveScreen(question)
      if (screenResponse) {
        const result = await screenResponse
        if (result.message) {
          setMessages((prev) => [...prev, { role: "assistant", text: result.message! }])
        }
        return
      }
      const response = await api.chat(question)
      setMessages((prev) => [...prev, { role: "assistant", text: response.answer }])
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      setMessages((prev) => [...prev, { role: "assistant", text: `Something went wrong: ${message}` }])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-4 pb-5 pt-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background via-background/80 to-transparent"
      />
      <div className="pointer-events-auto relative mx-auto w-full max-w-2xl">

        {/* Suggestions — only when no conversation started */}
        <AnimatePresence>
          {open && !hasChat && filtered.length > 0 ? (
            <motion.ul
              initial={{ opacity: 0, y: 12, scale: 0.97, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 10, scale: 0.97, filter: "blur(6px)" }}
              transition={{ duration: 0.26, ease: "easeOut" }}
              className="mb-2 origin-bottom overflow-hidden rounded-2xl border border-border/60 bg-card/90 p-1.5 shadow-[0_28px_80px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/[0.04] backdrop-blur-xl"
            >
              {filtered.map((suggestion, index) => {
                const isHowTo = suggestion === DEMO_HOWTO_QUESTION
                return (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); pick(suggestion) }}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-foreground/[0.05]",
                        isHowTo
                          ? "bg-cala/[0.08] font-medium text-foreground ring-1 ring-cala/25 hover:bg-cala/[0.12]"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Sparkles className={cn("size-3.5 shrink-0", isHowTo ? "text-cala" : "text-cala/70")} />
                      <span className="truncate">{suggestion}</span>
                      {isHowTo && index === 0 && !query ? (
                        <span className="ml-auto shrink-0 rounded-full bg-cala/15 px-2 py-0.5 text-[10px] font-medium text-cala ring-1 ring-cala/30">Start here</span>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </motion.ul>
          ) : null}
        </AnimatePresence>

        {/* Chat window */}
        <AnimatePresence>
          {hasChat ? (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mb-2 overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.9)] ring-1 ring-white/[0.05] backdrop-blur-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex size-5 items-center justify-center rounded-full bg-cala/15">
                    <Sparkles className="size-3 text-cala" />
                  </div>
                  <span className="text-xs font-semibold tracking-wide text-foreground/80">Cales</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  className="rounded-md p-1 text-muted-foreground/60 transition-colors hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              {/* Messages */}
              <div ref={chatRef} className="max-h-80 overflow-y-auto px-4 py-4 space-y-5">
                {messages.map((msg, i) =>
                  msg.role === "assistant" ? (
                    <AssistantMessage key={i} text={msg.text} onType={scrollToBottom} />
                  ) : (
                    <UserMessage key={i} text={msg.text} />
                  )
                )}

                {submitting ? (
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-cala/15 ring-1 ring-cala/30">
                      <Sparkles className="size-3 text-cala" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1 pt-0.5">
                      <p className="text-[11px] font-medium text-cala">Cales</p>
                      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground")}>
                        <span className="flex gap-1">
                          <span className="animate-bounce [animation-delay:0ms]">·</span>
                          <span className="animate-bounce [animation-delay:150ms]">·</span>
                          <span className="animate-bounce [animation-delay:300ms]">·</span>
                        </span>
                        {elapsed >= 15 ? (
                          <span className="text-xs text-muted-foreground/60">
                            {elapsed >= 15 ? "this can take a minute" : ""} · <span className="font-mono tabular-nums">{formatElapsed(elapsed)}</span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Input bar */}
        <form
          className="group flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-3 shadow-lg shadow-black/20 backdrop-blur transition-colors focus-within:border-foreground/25 hover:border-foreground/25 hover:bg-card"
          onSubmit={(e) => {
            e.preventDefault()
            const question = value.trim()
            if (!question || submitting) return
            void submit(question)
          }}
        >
          <Sparkles className="size-4 shrink-0 text-muted-foreground" />
          <div className="relative min-w-0 flex-1">
            {remainder && !hasChat ? (
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
              onChange={(e) => { setValue(e.target.value); setOpen(true) }}
              onFocus={() => setOpen(true)}
              onBlur={() => window.setTimeout(() => setOpen(false), 120)}
              onKeyDown={(e) => {
                if ((e.key === "Tab" || e.key === "ArrowRight") && remainder && !hasChat) {
                  e.preventDefault()
                  if (ghost) setValue(ghost)
                }
                if (e.key === "Escape") { setOpen(false); setMessages([]) }
              }}
              placeholder={hasChat ? "Follow up…" : "Ask Cales, e.g. 'should we buy aluminium?'"}
              aria-label="Ask Cales"
              className="relative w-full bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <kbd className="hidden rounded-sm border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
            ⌘K
          </kbd>
          <button
            type="submit"
            aria-label="Send"
            disabled={submitting}
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-90 transition-opacity group-hover:opacity-100 disabled:opacity-40"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
          </button>
        </form>
      </div>
    </div>
  )
}
