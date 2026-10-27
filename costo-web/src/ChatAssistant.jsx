import { useEffect, useRef, useState } from 'react';
import { Bot, LoaderCircle, MessageCircle, Send, X } from 'lucide-react';

const WELCOME =
  'Hola. Puedo buscar productos del catálogo y pedirle a la calculadora un reporte real. Las cantidades deben estar en la unidad que muestra el catálogo; no convierto kg o g a unidades.';

function formatNumber(value, digits = 2) {
  return Number(value).toLocaleString('es', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function ReportCard({ report }) {
  return (
    <section className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-slate-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-slate-100">
      <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
        Resultado calculado por la aplicación
      </h3>
      <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-xs text-slate-500">Costo total</dt>
          <dd className="font-semibold">{formatNumber(report.costoTotal)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Precio de venta</dt>
          <dd className="font-semibold">{formatNumber(report.precioVenta)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Costo USD</dt>
          <dd className="font-semibold">{formatNumber(report.costoUsdTotal)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Costo / venta</dt>
          <dd className="font-semibold">{formatNumber(report.costoPorPeso * 100, 1)}%</dd>
        </div>
      </dl>
      <ul className="mt-3 space-y-1 border-t border-emerald-200 pt-2 text-xs dark:border-emerald-800">
        {report.items.map((item) => (
          <li key={item.id}>
            {item.nombre.trim()} — {item.cantidadUsada} {item.unidad}: {formatNumber(item.costoTotalLinea)}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-300">
        Costo / venta es una proporción, no un costo por kilogramo ni una ganancia.
      </p>
    </section>
  );
}

export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: WELCOME },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function sendMessage(event) {
    event.preventDefault();
    const message = input.trim();
    if (!message || sending) return;

    const previousMessages = messages;
    setMessages((current) => [...current, { role: 'user', content: message }]);
    setInput('');
    setSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: previousMessages.slice(-8).map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'El asistente no está disponible. Inténtalo de nuevo más tarde.');
      }
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: data.reply,
          report: data.report || null,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: error instanceof Error
            ? error.message
            : 'No se pudo conectar con el asistente. Inténtalo de nuevo.',
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir asistente de costos"
        className="fixed bottom-4 right-4 z-40 flex h-14 items-center gap-2 rounded-full bg-blue-600 px-5 font-semibold text-white shadow-xl hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
      >
        <MessageCircle className="h-5 w-5" />
        <span>Asistente IA</span>
      </button>

      {open && (
        <section
          aria-label="Asistente de costos"
          className="fixed inset-0 z-50 flex flex-col bg-white text-slate-900 shadow-2xl dark:bg-slate-900 dark:text-slate-100 sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[min(760px,85vh)] sm:w-[min(440px,calc(100vw-2rem))] sm:rounded-2xl sm:border sm:border-slate-200 sm:dark:border-slate-700"
        >
          <header className="flex items-center justify-between border-b border-slate-200 bg-blue-700 px-4 py-3 text-white dark:border-slate-700 sm:rounded-t-2xl">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div>
                <h2 className="font-semibold">Asistente de costos</h2>
                <p className="text-xs text-blue-100">Catálogo y cálculos de la aplicación</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar asistente"
              className="rounded-lg p-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-white"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div
            ref={scrollRef}
            className="flex-1 space-y-4 overflow-y-auto p-4"
            aria-live="polite"
          >
            {messages.map((entry, index) => (
              <div
                key={`${entry.role}-${index}`}
                className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm ${
                  entry.role === 'user'
                    ? 'ml-auto bg-blue-600 text-white'
                    : 'mr-auto bg-slate-100 dark:bg-slate-800'
                }`}
              >
                <p className="whitespace-pre-wrap">{entry.content}</p>
                {entry.report && <ReportCard report={entry.report} />}
              </div>
            ))}
            {sending && (
              <div className="mr-auto flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Consultando el catálogo y preparando respuesta…
              </div>
            )}
          </div>

          <form
            onSubmit={sendMessage}
            className="border-t border-slate-200 p-3 dark:border-slate-700 sm:rounded-b-2xl"
          >
            <label htmlFor="assistant-message" className="sr-only">
              Escribe un mensaje
            </label>
            <div className="flex items-end gap-2">
              <textarea
                id="assistant-message"
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value.slice(0, 1200))}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                maxLength={1200}
                rows={2}
                placeholder="Ej.: Busca arroz y dime la unidad del catálogo"
                disabled={sending}
                className="max-h-32 min-h-11 flex-1 resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-950 dark:focus:ring-blue-900"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                aria-label="Enviar mensaje"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              La IA interpreta y explica; la aplicación calcula con su catálogo.
            </p>
          </form>
        </section>
      )}
    </>
  );
}
