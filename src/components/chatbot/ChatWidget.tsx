"use client"

import { useAuthStore } from "@/api/stores/auth.store"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  answerQuestion,
  faqQuickReplies,
  glossaryText,
  greetingByTime,
  navigationQuickReplies,
  randomTip,
  type ChatQuickReply,
} from "@/lib/chatbot-knowledge"
import { cn } from "@/lib/utils"
import {
  ArrowUp,
  History,
  Minus,
  Paperclip,
  Smile,
  Sparkles,
  X,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useId, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  FOOTER_LINKS,
  QUICK_ACTIONS,
  SPECIAL_QUERIES,
  SUPPORT_MESSAGE,
} from "./chat-config"

interface ChatMessage {
  id: string
  role: "user" | "bot"
  text: string
  quickReplies?: ChatQuickReply[]
}

function resolveSpecialQuery(
  query: string
): { text: string; quickReplies?: ChatQuickReply[] } | null {
  switch (query) {
    case SPECIAL_QUERIES.support:
      return { text: SUPPORT_MESSAGE }
    case SPECIAL_QUERIES.menu:
      return {
        text: "Voici les pages disponibles dans Organizer :",
        quickReplies: navigationQuickReplies(),
      }
    case SPECIAL_QUERIES.faq:
      return {
        text: "Voici quelques questions fréquentes — cliquez sur l'une d'elles :",
        quickReplies: faqQuickReplies(),
      }
    case SPECIAL_QUERIES.glossary:
      return { text: `Petit lexique de l'application :\n${glossaryText()}` }
    case SPECIAL_QUERIES.tips:
      return { text: randomTip() }
    default:
      return null
  }
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3.5 py-2.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  )
}

function BotAvatar({ className }: { className?: string }) {
  return (
    <Avatar className={cn("size-7 shrink-0 bg-neutral-900", className)}>
      <AvatarImage src="/robot.png" alt="Assistant" className="object-cover" />
      <AvatarFallback className="bg-neutral-900 text-neutral-100">
        <Sparkles className="size-3.5" />
      </AvatarFallback>
    </Avatar>
  )
}

function QuickReplies({
  items,
  onPick,
}: {
  items: ChatQuickReply[]
  onPick: (reply: ChatQuickReply) => void
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map((reply) => (
        <button
          key={reply.label}
          type="button"
          onClick={() => onPick(reply)}
          className="cursor-pointer rounded-full border border-border bg-card px-3 py-1.5 text-left text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          {reply.label}
        </button>
      ))}
    </div>
  )
}

function MessageBubble({
  message,
  onPickQuickReply,
}: {
  message: ChatMessage
  onPickQuickReply: (reply: ChatQuickReply) => void
}) {
  const isUser = message.role === "user"
  return (
    <div className={cn("flex items-end gap-2", isUser && "flex-row-reverse")}>
      {!isUser && <BotAvatar />}
      <div className={cn("flex max-w-[85%] flex-col", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line",
            isUser
              ? "rounded-br-sm bg-primary text-primary-foreground"
              : "rounded-bl-sm bg-muted text-foreground"
          )}
        >
          {message.text}
        </div>
        {!isUser && message.quickReplies && (
          <QuickReplies
            items={message.quickReplies}
            onPick={onPickQuickReply}
          />
        )}
      </div>
    </div>
  )
}

function ChatHome({ userName }: { userName?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 pt-2 pb-4 text-center">
      <div className="mb-2 grid size-14 place-items-center rounded-full bg-neutral-900">
        <img
          src="/robot.png"
          alt="Assistant"
          className="size-9 object-contain"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        {greetingByTime()}
        {userName ? `, ${userName}` : ""} 👋
      </p>
      <h2 className="font-heading text-xl leading-tight text-foreground">
        Comment puis-je vous aider ?
      </h2>
      <p className="mt-1 max-w-72 text-[13px] text-muted-foreground">
        Posez-moi vos questions sur vos achats, la navigation ou les
        fonctionnalités d'Organizer — je réponds à partir de ce que je connais
        de l'application.
      </p>
    </div>
  )
}

export function ChatWidget() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const inputId = useId()

  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const firstName = user?.name?.split(" ")[0]

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages, typing])

  function pushBotReply(text: string, quickReplies?: ChatQuickReply[]) {
    setTyping(true)
    const delay = 350 + Math.min(text.length * 4, 500)
    window.setTimeout(() => {
      setTyping(false)
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "bot", text, quickReplies },
      ])
    }, delay)
  }

  function send(rawQuery: string) {
    const query = rawQuery.trim()
    if (!query) return

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text: query },
    ])
    setInput("")

    const special = resolveSpecialQuery(query)
    if (special) {
      pushBotReply(special.text, special.quickReplies)
      return
    }

    const { text, quickReplies } = answerQuestion(query)
    pushBotReply(text, quickReplies)
  }

  function handleQuickReply(reply: ChatQuickReply) {
    if (reply.route) {
      navigate(reply.route)
      setOpen(false)
      return
    }
    if (reply.prompt) send(reply.prompt)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    send(input)
  }

  function resetConversation() {
    setMessages([])
    setInput("")
    setTyping(false)
  }

  return (
    <div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-4 bottom-22 z-50 flex w-95 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl sm:right-6 sm:bottom-24 sm:max-w-[calc(100vw-3rem)]"
            style={{
              height: minimized ? "auto" : "min(640px, calc(100dvh - 7rem))",
            }}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <Avatar className="size-9 bg-neutral-900">
                  <AvatarImage
                    src="/robot.png"
                    alt="Assistant"
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-neutral-900 text-neutral-100">
                    OA
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-heading text-sm leading-tight text-foreground">
                    Assistant Organizer
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-accent-2-600" />
                    En ligne
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  title="Nouvelle conversation"
                  onClick={resetConversation}
                >
                  <History className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  title={minimized ? "Agrandir" : "Réduire"}
                  onClick={() => setMinimized((m) => !m)}
                >
                  <Minus className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  title="Fermer"
                  onClick={() => setOpen(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            {!minimized && (
              <>
                {/* Corps : accueil + actions rapides, ou fil de conversation */}
                <div
                  ref={scrollRef}
                  className="custom-scrollbar min-h-0 flex-1 overflow-y-auto"
                >
                  {messages.length === 0 ? (
                    <div className="flex flex-col gap-4">
                      <ChatHome userName={firstName} />
                      <div className="grid grid-cols-2 gap-2.5 px-4 pb-1">
                        {QUICK_ACTIONS.map((action) => {
                          const Icon = action.icon
                          return (
                            <button
                              key={action.key}
                              type="button"
                              onClick={() => send(action.query)}
                              className="flex flex-col items-start gap-2.5 rounded-2xl border border-border bg-card p-3.5 text-left transition-colors hover:bg-muted"
                            >
                              <span
                                className={cn(
                                  "grid size-8 place-items-center rounded-full",
                                  action.iconClassName
                                )}
                              >
                                <Icon className="size-4" />
                              </span>
                              <span className="text-[13px] leading-tight font-medium text-foreground">
                                {action.label}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 p-4">
                      {messages.map((m) => (
                        <MessageBubble
                          key={m.id}
                          message={m}
                          onPickQuickReply={handleQuickReply}
                        />
                      ))}
                      {typing && (
                        <div className="flex items-end gap-2">
                          <BotAvatar />
                          <div className="rounded-2xl rounded-bl-sm bg-muted">
                            <TypingDots />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Pastilles de raccourci, toujours visibles au-dessus de la saisie */}
                <div className="no-scrollbar flex shrink-0 gap-1.5 overflow-x-auto border-t border-border px-3 py-2">
                  {FOOTER_LINKS.map((link) => {
                    const Icon = link.icon
                    return (
                      <button
                        key={link.key}
                        type="button"
                        onClick={() => send(link.query)}
                        className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Icon className="size-3.5" />
                        {link.label}
                      </button>
                    )
                  })}
                </div>

                {/* Saisie */}
                <form
                  onSubmit={handleSubmit}
                  className="flex shrink-0 items-center gap-2 border-t border-border p-3"
                >
                  <label htmlFor={inputId} className="sr-only">
                    Poser une question
                  </label>
                  <button
                    type="button"
                    title="Joindre un fichier (indisponible)"
                    disabled
                    className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground/50"
                  >
                    <Paperclip className="size-4" />
                  </button>
                  <input
                    id={inputId}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Posez votre question..."
                    className="h-9 min-w-0 flex-1 rounded-full border border-border bg-background px-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                  <button
                    type="button"
                    title="Émoji (indisponible)"
                    disabled
                    className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground/50"
                  >
                    <Smile className="size-4" />
                  </button>
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    title="Envoyer"
                    className="grid size-8 shrink-0 place-items-center rounded-full bg-neutral-900 text-neutral-100 transition-opacity disabled:opacity-40"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bouton flottant d'ouverture/fermeture */}
      <Button
        type="button"
        size="icon"
        title={open ? "Fermer l'assistant" : "Ouvrir l'assistant"}
        onClick={() => setOpen((o) => !o)}
        className="fixed right-4 bottom-4 z-50 size-13 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 sm:right-6 sm:bottom-6"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "open"}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid place-items-center"
          >
            {open ? (
              <X className="size-5.5" />
            ) : (
              <img src="/robot.png" alt="" className="size-13 object-contain" />
            )}
          </motion.span>
        </AnimatePresence>
      </Button>
    </div>
  )
}
