import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { getToken, getTokenPayload } from '../auth/token'
import './Chatbot.css'

const API_URL = import.meta.env.VITE_API_URL

type ChatMessage = {
  id: number
  role: 'assistant' | 'user'
  content: string
}

const suggestionsByRole = {
  ADMIN: ['¿Qué clientes tienen pagos pendientes?', '¿Cuáles son los productos más baratos?'],
  CLIENT: ['¿Ya pagué mi última compra?', '¿Cuál es el producto más barato con stock?'],
}

export default function Chatbot() {
  const user = getTokenPayload()
  const role = user?.role ?? 'CLIENT'
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'assistant',
      content: `Hola${user?.name ? `, ${user.name}` : ''}. Puedo ayudarte con productos, categorías y estados de pago.`,
    },
  ])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [open, messages, loading])

  const ask = async (question: string) => {
    const cleanQuestion = question.trim()
    if (!cleanQuestion || loading) return

    setMessages((current) => [
      ...current,
      { id: Date.now(), role: 'user', content: cleanQuestion },
    ])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ message: cleanQuestion }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message ?? 'No se pudo consultar el asistente')

      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, role: 'assistant', content: body.answer },
      ])
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: error instanceof Error ? error.message : 'El asistente no está disponible.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    ask(input)
  }

  return (
    <div className="chatbot">
      {open && (
        <section className="chatbot__panel" role="dialog" aria-label="Asistente de la tienda">
          <header className="chatbot__header">
            <div>
              <span className="chatbot__status" aria-hidden="true" />
              <strong>Asistente</strong>
              <small>Consultas de tienda</small>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar asistente">
              ×
            </button>
          </header>

          <div className="chatbot__messages" aria-live="polite">
            {messages.map((message) => (
              <p key={message.id} className={`chatbot__message chatbot__message--${message.role}`}>
                {message.content}
              </p>
            ))}
            {messages.length === 1 && (
              <div className="chatbot__suggestions">
                {suggestionsByRole[role].map((suggestion) => (
                  <button key={suggestion} type="button" onClick={() => void ask(suggestion)}>
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            {loading && <p className="chatbot__typing">Consultando…</p>}
            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot__form" onSubmit={submit}>
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Escribí tu pregunta…"
              maxLength={500}
              disabled={loading}
              aria-label="Pregunta para el asistente"
            />
            <button type="submit" disabled={loading || !input.trim()} aria-label="Enviar pregunta">
              Enviar
            </button>
          </form>
        </section>
      )}

      <button
        className="chatbot__launcher"
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? 'Cerrar asistente' : 'Abrir asistente'}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 11.5a7.5 7.5 0 0 1-8 7.48 8.8 8.8 0 0 1-3.2-.82L4 20l1.35-4.05A7.5 7.5 0 1 1 20 11.5Z" />
          <path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" />
        </svg>
        <span>Preguntame</span>
      </button>
    </div>
  )
}
